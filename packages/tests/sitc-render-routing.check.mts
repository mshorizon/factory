#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I2 (strategy-routed render path).
 * No engine, no model — a real temp git repo + fake collaborators.
 *
 * Run: pnpm tsx packages/tests/sitc-render-routing.check.mts
 *
 * Covers:
 *   A. WorktreeManager.ensureBaseWorktree — creates a detached worktree pinned at
 *      the champion sha, is idempotent, dedupes concurrent creates, and gives a
 *      distinct path per champion generation.
 *   B. runSectionIteration threads `strategy` + `base` into collab.render so the
 *      runner can route tune-json to the shared champion engine (the I2 decision
 *      point).
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { WorktreeManager } from "../sitc-core/src/orchestrator/worktree.js";
import { runSectionIteration, type SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
};
const sh = (args: string[], cwd: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

// ── A. ensureBaseWorktree on a real temp git repo ────────────────────────────
console.log("A. WorktreeManager.ensureBaseWorktree");
const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i2-"));
try {
  sh(["init", "-q", "-b", "main"], repo);
  sh(["config", "user.email", "t@t.test"], repo);
  sh(["config", "user.name", "t"], repo);
  await fs.writeFile(path.join(repo, "a.txt"), "v1\n");
  sh(["add", "-A"], repo);
  sh(["commit", "-qm", "c1"], repo);
  const sha1 = sh(["rev-parse", "HEAD"], repo);
  // a second commit = a later champion generation
  await fs.writeFile(path.join(repo, "a.txt"), "v2\n");
  sh(["add", "-A"], repo);
  sh(["commit", "-qm", "c2"], repo);
  const sha2 = sh(["rev-parse", "HEAD"], repo);

  const wtm = new WorktreeManager({ repoRoot: repo, worktreeRoot: path.join(repo, ".sitc", "worktrees") });
  await wtm.createRunBranch(1, sha1);
  ok((await wtm.champion(1)) === sha1, "champion = run branch tip");

  const p1 = await wtm.ensureBaseWorktree(1, sha1);
  ok(await fs.access(path.join(p1, ".git")).then(() => true).catch(() => false), "base worktree created");
  ok(sh(["rev-parse", "HEAD"], p1) === sha1, "base worktree pinned at champion sha");
  ok(sh(["cat-file", "-p", "HEAD:a.txt"], p1) === "v1", "base worktree serves that champion's files");

  const p1b = await wtm.ensureBaseWorktree(1, sha1);
  ok(p1b === p1, "idempotent — same path on second call");

  // concurrent creates of the SAME (new) generation dedupe to one worktree
  const [c1, c2] = await Promise.all([wtm.ensureBaseWorktree(1, sha2), wtm.ensureBaseWorktree(1, sha2)]);
  ok(c1 === c2, "concurrent creates dedupe to one path");
  ok(c1 !== p1, "distinct path per champion generation");
  ok(sh(["rev-parse", "HEAD"], c1) === sha2, "second generation pinned at its own sha");

  await wtm.teardown(1, { deleteBranch: true });
} finally {
  await fs.rm(repo, { recursive: true, force: true }).catch(() => {});
}

// ── B. runSectionIteration threads strategy + base into render ───────────────
console.log("B. runSectionIteration → render ctx carries {strategy, base}");
{
  const BASE = "basesha1234567890";
  let n = 0;
  const worktree: any = {
    repoRoot: "/fake",
    branchName: (id: number) => `sitc/run-${id}`,
    addWorkerWorktree: async () => ({ path: "/fake/wt", base: BASE }),
    resetSoftTo: async () => {},
    commitInWorktree: async () => `sha${++n}`,
    changedFiles: async () => ["templates/template-x/template-x.json"],
    integrate: async (_id: number, sha: string) => sha,
    removeWorktree: async () => {},
  };
  const captured: Array<{ strategy: string; base: string }> = [];
  const collab: SectionCollaborators = {
    mutate: async () => ({ changedFiles: ["templates/template-x/template-x.json"], summary: "edit" }),
    sanity: async () => ({ ok: true } as any),
    render: async (ctx: any) => { captured.push({ strategy: ctx.strategy, base: ctx.base }); return { ourImg: "/fake/img.png" }; },
    score: async () => ({ score: 0.9, vlm: { score: 0.9, critique: "c" }, pixel: { similarity: 0.9 }, weights: { vlm: 0.7, pixel: 0.3 } } as any),
    judge: async () => ({ winner: "challenger" } as any),
  };

  for (const strategy of ["tune-json", "new-variant"] as const) {
    await runSectionIteration({
      worktree, runId: 1, workerId: `w-${strategy}`, sectionId: "hero#0",
      strategy, targetImg: "t.png", championImg: null, collab,
    });
  }
  ok(captured.length === 2, "render called for both iterations");
  ok(captured[0].strategy === "tune-json" && captured[0].base === BASE, "tune-json: render ctx carries strategy + base");
  ok(captured[1].strategy === "new-variant" && captured[1].base === BASE, "new-variant: render ctx carries strategy");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
