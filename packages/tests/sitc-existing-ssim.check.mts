#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I6 (real existing-template SSIM regression).
 * No engine, no model — real FS for discovery + fake deps for orchestration.
 *
 * Run: pnpm tsx packages/tests/sitc-existing-ssim.check.mts
 *
 * Covers:
 *   A. listExistingTemplates — discovers templates/<n>/<n>.json, excludes the run's
 *      own, counts home sections, skips non-renderable dirs, sorts.
 *   B. createExistingTemplatesSsim — renders each existing template's sections on BOTH
 *      the develop baseline tree and the run-branch champion tree, pairs them
 *      [challenger, baseline], honors the sample caps, and no-ops when run == develop.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { listExistingTemplates, createExistingTemplatesSsim } from "../sitc-core/src/delivery/existing-ssim.js";

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
};

// ── A. listExistingTemplates on a real temp templates/ dir ───────────────────
console.log("A. listExistingTemplates");
const root = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i6-"));
try {
  const mk = async (name: string, sections: number) => {
    await fs.mkdir(path.join(root, "templates", name), { recursive: true });
    await fs.writeFile(
      path.join(root, "templates", name, `${name}.json`),
      JSON.stringify({ pages: { home: { sections: Array.from({ length: sections }, (_, i) => ({ type: `s${i}` })) } } }),
    );
  };
  await mk("template-alpha", 3);
  await mk("template-beta", 1);
  await mk("template-run", 5); // the run's own — must be excluded
  // a directory with no JSON (e.g. shared assets) — must be skipped
  await fs.mkdir(path.join(root, "templates", "_shared"), { recursive: true });

  const found = await listExistingTemplates(root, "template-run");
  ok(found.length === 2, `found 2 templates (got ${found.length})`);
  ok(found.map((t) => t.name).join(",") === "template-alpha,template-beta", "excludes run template + sorted");
  ok(found.find((t) => t.name === "template-alpha")!.sectionCount === 3, "alpha section count = 3");
  ok(found.find((t) => t.name === "template-beta")!.sectionCount === 1, "beta section count = 1");
  ok(!found.some((t) => t.name === "_shared"), "non-JSON dir skipped");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}

// ── B. createExistingTemplatesSsim orchestration (fake deps) ─────────────────
console.log("B. createExistingTemplatesSsim");
const fakeTemplates = [{ name: "template-alpha", sectionCount: 2 }, { name: "template-beta", sectionCount: 1 }];
const rendered: string[] = [];
const baseDeps = {
  developSha: async () => "DEVSHA",
  championSha: async () => "CHAMPSHA",
  resolveTree: async (sha: string) => `tree:${sha}`,
  listTemplates: async () => fakeTemplates,
  renderTreeSection: async (a: { tree: string; role: string; template: string; index: number }) => {
    const id = `${a.role}|${a.tree}|${a.template}|${a.index}`;
    rendered.push(id);
    return id;
  },
};

{
  rendered.length = 0;
  const pairs = await createExistingTemplatesSsim({ ...baseDeps })();
  ok(pairs.length === 3, `3 section pairs (2 alpha + 1 beta) (got ${pairs.length})`);
  // each pair = [challenger@champion, baseline@develop]
  ok(pairs.every(([c, b]) => c.startsWith("challenger|tree:CHAMPSHA") && b.startsWith("baseline|tree:DEVSHA")), "pairs are [challenger@champion, baseline@develop]");
  ok(pairs[0][0] === "challenger|tree:CHAMPSHA|template-alpha|0", "first challenger = alpha section 0 on champion tree");
  ok(pairs[2][0] === "challenger|tree:CHAMPSHA|template-beta|0", "last challenger = beta section 0");
}

// cap: maxTemplates
{
  rendered.length = 0;
  const pairs = await createExistingTemplatesSsim({ ...baseDeps }, { maxTemplates: 1 })();
  ok(pairs.length === 2 && pairs.every(([c]) => c.includes("template-alpha")), "maxTemplates=1 → only first template (2 pairs)");
}

// cap: maxSectionsPerTemplate
{
  rendered.length = 0;
  const pairs = await createExistingTemplatesSsim({ ...baseDeps }, { maxSectionsPerTemplate: 1 })();
  ok(pairs.length === 2, "maxSectionsPerTemplate=1 → 1 pair per template (2 total)");
}

// no-op when run branch == develop (no shared-code delta)
{
  rendered.length = 0;
  const pairs = await createExistingTemplatesSsim({ ...baseDeps, championSha: async () => "DEVSHA" })();
  ok(pairs.length === 0 && rendered.length === 0, "run==develop → no pairs, nothing rendered");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
