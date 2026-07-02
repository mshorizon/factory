#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I3 (persistent worktree/engine pool).
 * Real temp git repo for acquireSlot; fakes for pool + iteration lifecycle.
 *
 * Run: pnpm tsx packages/tests/sitc-worktree-pool.check.mts
 *
 * Covers:
 *   A. WorktreePool — bounded slots, blocks when exhausted + unblocks on release,
 *      reuses freed slots, resets-on-acquire, idempotent release, returns the slot
 *      if acquireSlot throws.
 *   B. WorktreeManager.acquireSlot — creates a detached slot worktree at champion,
 *      and on reuse resets --hard to the advanced champion + cleans untracked files.
 *   C. runSectionIteration — uses the lease (release always called, even on the
 *      promote path) and falls back to addWorkerWorktree/removeWorktree without one.
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { WorktreePool } from "../sitc-core/src/orchestrator/worktree-pool.js";
import { WorktreeManager } from "../sitc-core/src/orchestrator/worktree.js";
import { runSectionIteration, type SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const tick = () => new Promise((r) => setTimeout(r, 15));
const g = (a: string[], cwd: string) => execFileSync("git", a, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

// ── A. WorktreePool ──────────────────────────────────────────────────────────
console.log("A. WorktreePool");
{
  const acquired: Array<number | string> = [];
  const fakeWt = { acquireSlot: async (_r: any, slot: number | string) => { acquired.push(slot); return { path: `/wt/slot-${slot}`, base: "CHAMP" }; } };
  const pool = new WorktreePool(fakeWt as any, 1, 2);

  const a = await pool.acquire();
  const b = await pool.acquire();
  ok(a.path !== b.path, "two acquires → two distinct slots");

  let cReady = false;
  const cP = pool.acquire().then((c) => { cReady = true; return c; });
  await tick();
  ok(!cReady, "third acquire blocks while pool (size 2) is exhausted");
  await a.release();
  const c = await cP;
  ok(cReady, "release unblocks the waiter");
  ok(c.path === a.path, "waiter reuses the freed slot");
  ok(acquired.length === 3, "acquireSlot (reset/create) called once per acquire");

  await c.release();
  await c.release(); // idempotent — must not double-free
  await b.release();
  // capacity is still exactly 2
  const x = await pool.acquire();
  const y = await pool.acquire();
  let zReady = false;
  const zP = pool.acquire().then(() => { zReady = true; });
  await tick();
  ok(!zReady, "idempotent release didn't inflate capacity (3rd still blocks)");
  await x.release();
  await zP;
  await y.release();
}
{
  // acquireSlot throws once → the slot must be returned, not leaked.
  let boom = true;
  const flaky = { acquireSlot: async (_r: any, s: number | string) => { if (boom) { boom = false; throw new Error("reset failed"); } return { path: `/wt/${s}`, base: "C" }; } };
  const pool = new WorktreePool(flaky as any, 1, 1);
  await pool.acquire().then(() => { throw new Error("should have thrown"); }, () => {});
  const after = await pool.acquire();
  ok(!!after.path, "slot returned to pool after acquireSlot failure (size-1 pool not deadlocked)");
}

// ── B. acquireSlot on a real temp git repo ───────────────────────────────────
console.log("B. WorktreeManager.acquireSlot");
const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i3-"));
try {
  g(["init", "-q", "-b", "main"], repo);
  g(["config", "user.email", "t@t.test"], repo);
  g(["config", "user.name", "t"], repo);
  await fs.writeFile(path.join(repo, "a.txt"), "v1\n");
  g(["add", "-A"], repo); g(["commit", "-qm", "c1"], repo);
  const c1 = g(["rev-parse", "HEAD"], repo);
  const wtm = new WorktreeManager({ repoRoot: repo, worktreeRoot: path.join(repo, ".sitc", "worktrees") });
  await wtm.createRunBranch(1, c1);

  const s0 = await wtm.acquireSlot(1, 0);
  ok(g(["rev-parse", "HEAD"], s0.path) === c1, "slot created at champion (c1)");
  ok(g(["cat-file", "-p", "HEAD:a.txt"], s0.path) === "v1", "slot serves champion content");

  // simulate a worker leaving an untracked file, and the champion advancing.
  await fs.writeFile(path.join(s0.path, "junk.txt"), "scratch\n");
  await fs.writeFile(path.join(s0.path, "a.txt"), "v2\n");
  g(["add", "a.txt"], s0.path); g(["commit", "-qm", "c2"], s0.path);
  const c2 = g(["rev-parse", "HEAD"], s0.path);
  g(["branch", "-f", "sitc/run-1", c2], repo); // advance the champion

  const s0b = await wtm.acquireSlot(1, 0);
  ok(s0b.path === s0.path, "same slot path reused (persistent)");
  ok(g(["rev-parse", "HEAD"], s0b.path) === c2, "reused slot reset --hard to the new champion (c2)");
  ok(g(["cat-file", "-p", "HEAD:a.txt"], s0b.path) === "v2", "reused slot has the advanced content");
  ok(!(await fs.access(path.join(s0b.path, "junk.txt")).then(() => true).catch(() => false)), "clean removed the prior iteration's untracked file");

  await wtm.teardown(1, { deleteBranch: true });
} finally {
  await fs.rm(repo, { recursive: true, force: true });
}

// ── C. runSectionIteration lease lifecycle ───────────────────────────────────
console.log("C. runSectionIteration lease");
{
  let n = 0;
  const baseWt: any = {
    branchName: (id: number) => `sitc/run-${id}`,
    resetSoftTo: async () => {},
    commitInWorktree: async () => `sha${++n}`,
    changedFiles: async () => ["templates/x/x.json"],
    integrate: async (_i: number, sha: string) => sha,
    addWorkerWorktree: async () => ({ path: "/fresh/wt", base: "BASE" }),
    removeWorktree: async () => { baseWt._removed = (baseWt._removed ?? 0) + 1; },
    _removed: 0,
  };
  const collab: SectionCollaborators = {
    mutate: async () => ({ changedFiles: ["templates/x/x.json"], summary: "e" }),
    sanity: async () => ({ ok: true } as any),
    render: async () => ({ ourImg: "/i.png" }),
    score: async () => ({ score: 0.9, vlm: { score: 0.9, critique: "c" }, pixel: { similarity: 0.9 }, weights: { vlm: 0.7, pixel: 0.3 } } as any),
    judge: async () => ({ winner: "challenger" } as any),
  };

  // with a lease: release() is called, addWorkerWorktree/removeWorktree are NOT.
  let released = 0, leaseAdds = 0;
  await runSectionIteration({
    worktree: baseWt, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: null, collab,
    lease: async () => { leaseAdds++; return { path: "/pool/slot-0", base: "BASE", release: async () => { released++; } }; },
  });
  ok(leaseAdds === 1 && released === 1, "lease acquired + released exactly once");
  ok(baseWt._removed === 0, "pooled iteration did NOT remove a worktree");

  // sanity failure still releases the lease.
  released = 0;
  await runSectionIteration({
    worktree: baseWt, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: "champ.png",
    collab: { ...collab, sanity: async () => ({ ok: false, reason: "boom" } as any) },
    lease: async () => ({ path: "/pool/slot-0", base: "BASE", release: async () => { released++; } }),
  });
  ok(released === 1, "lease released even on sanity failure");

  // without a lease: falls back to addWorkerWorktree + removeWorktree.
  baseWt._removed = 0;
  await runSectionIteration({
    worktree: baseWt, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: null, collab,
  });
  ok(baseWt._removed === 1, "no lease → fresh worktree removed (fallback behavior preserved)");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
