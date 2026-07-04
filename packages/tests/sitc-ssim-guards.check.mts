#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I17 (existing-template SSIM false-positive
 * guards). Pure orchestration with fake deps — no git, engines, or screenshots.
 *
 * The regressions these guards fix (runs 40/41): a JSON-only run rendered ~110
 * screenshots of byte-identical shared code and then FAILED the gate at SSIM ~0.70
 * — pure render nondeterminism — permanently blocking auto-merge.
 *
 * Run: pnpm tsx packages/tests/sitc-ssim-guards.check.mts
 *
 * Covers:
 *   A. shared-code early exit — templates-only diff → no renders, no pairs.
 *   B. shared path present → proceeds and pairs.
 *   C. noise control — self-SSIM below floor → loud skip (no pairs); above → pairs.
 *   D. absent optional deps → original behavior (renders happen).
 */
import { createExistingTemplatesSsim, type ExistingSsimDeps } from "../sitc-core/src/delivery/existing-ssim.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

function makeDeps(over: Partial<ExistingSsimDeps> = {}) {
  const renders: string[] = [];
  const logs: string[] = [];
  const deps: ExistingSsimDeps = {
    developSha: async () => "DEV",
    championSha: async () => "CHAMP",
    resolveTree: async (sha) => `/tree/${sha}`,
    listTemplates: async () => [
      { name: "alpha", sectionCount: 2 },
      { name: "beta", sectionCount: 1 },
    ],
    renderTreeSection: async ({ tree, role, template, index }) => {
      const p = `${tree}/${role}-${template}-${index}.png`;
      renders.push(p);
      return p;
    },
    log: (m) => logs.push(m),
    ...over,
  };
  return { deps, renders, logs };
}

// ── A. shared-code early exit ────────────────────────────────────────────────
console.log("A. shared-code early exit");
{
  const { deps, renders, logs } = makeDeps({
    changedPaths: async () => ["templates/sacrum/sacrum.json", "templates/sacrum/translations/pl.json"],
  });
  const pairs = await createExistingTemplatesSsim(deps)();
  ok(pairs.length === 0, "templates-only diff → no pairs (gate vacuously passes)");
  ok(renders.length === 0, "…and ZERO renders (no wasted screenshots)");
  ok(logs.some((l) => l.includes("only templates/")), "early exit is logged, not silent");
}

// ── B. shared path present → proceeds ────────────────────────────────────────
console.log("B. shared change proceeds");
{
  const { deps, renders } = makeDeps({
    changedPaths: async () => ["templates/sacrum/sacrum.json", "packages/ui/src/sections/Hero.tsx"],
  });
  const pairs = await createExistingTemplatesSsim(deps)();
  ok(pairs.length === 3, "2+1 sections → 3 pairs");
  ok(renders.length === 6, "each pair renders challenger + baseline");
  ok(pairs.every(([c, b]) => c.includes("/tree/CHAMP/") && b.includes("/tree/DEV/")), "challenger@champion vs baseline@develop");
}

// ── C. noise self-calibration ────────────────────────────────────────────────
console.log("C. noise control");
{
  // noisy harness: identical-code control pair scores 0.72 → skip loudly
  const noisy = makeDeps({ ssim: async () => 0.72 });
  const pairs = await createExistingTemplatesSsim(noisy.deps, { noiseControl: true })();
  ok(pairs.length === 0, "self-SSIM 0.72 < 0.99 → gate skipped (fail-open)");
  ok(noisy.renders.length === 2, "only the control pair was rendered");
  ok(noisy.renders.some((r) => r.includes("control")) && noisy.renders.every((r) => r.includes("/tree/DEV/")), "control pair renders the SAME baseline tree twice");
  ok(noisy.logs.some((l) => l.includes("IDENTICAL code")), "noise skip is loud");

  // clean harness: control ≈1 → proceeds to real pairs
  const clean = makeDeps({ ssim: async () => 0.998 });
  const pairs2 = await createExistingTemplatesSsim(clean.deps, { noiseControl: true })();
  ok(pairs2.length === 3, "self-SSIM ok → real pairs produced");
  ok(clean.logs.some((l) => l.includes("noise floor ok")), "noise floor logged");

  // custom floor honored
  const custom = makeDeps({ ssim: async () => 0.95 });
  const pairs3 = await createExistingTemplatesSsim(custom.deps, { noiseControl: true, noiseFloor: 0.9 })();
  ok(pairs3.length === 3, "custom noiseFloor 0.9 accepts self-SSIM 0.95");

  // noiseControl without an ssim dep → no control render (guard requires both)
  const noSsim = makeDeps();
  await createExistingTemplatesSsim(noSsim.deps, { noiseControl: true })();
  ok(!noSsim.renders.some((r) => r.includes("control")), "noiseControl without ssim dep → no control pair");
}

// ── D. optional deps absent → original behavior ──────────────────────────────
console.log("D. back-compat");
{
  const { deps, renders } = makeDeps();
  const pairs = await createExistingTemplatesSsim(deps)();
  ok(pairs.length === 3 && renders.length === 6, "no changedPaths/ssim deps → renders as before");

  const same = makeDeps({ championSha: async () => "DEV" });
  const nopairs = await createExistingTemplatesSsim(same.deps)();
  ok(nopairs.length === 0 && same.renders.length === 0, "run==develop early exit still intact");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
