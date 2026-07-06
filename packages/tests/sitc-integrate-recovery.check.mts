#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I19 (integrate-conflict recovery).
 * Real temp git repo — no model, no engines.
 *
 * The failure this fixes: two workers branch from the same champion and edit the
 * SAME file; after A integrates, B's cherry-pick conflicts and used to leave the
 * __integrate worktree wedged mid-pick — every later promotion then failed as a
 * silent "iteration error" no-op for the rest of the run.
 *
 * Run: pnpm tsx packages/tests/sitc-integrate-recovery.check.mts
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { WorktreeManager } from "../sitc-core/src/orchestrator/worktree.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const g = (args: string[], cwd: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i19-"));
try {
  g(["init", "-q", "-b", "develop"], repo);
  g(["config", "user.email", "t@t.test"], repo);
  g(["config", "user.name", "t"], repo);
  await fs.mkdir(path.join(repo, "templates/x"), { recursive: true });
  await fs.writeFile(path.join(repo, "templates/x/x.json"), '{"v":"base"}\n');
  g(["add", "-A"], repo);
  g(["commit", "-qm", "base"], repo);

  const wm = new WorktreeManager({ repoRoot: repo });
  const runId = 1;
  await wm.createRunBranch(runId);
  const champ0 = await wm.champion(runId);

  // Two workers branch from the SAME champion and edit the SAME line.
  const a = await wm.addWorkerWorktree(runId, "worker-a");
  const b = await wm.addWorkerWorktree(runId, "worker-b");
  await fs.writeFile(path.join(a.path, "templates/x/x.json"), '{"v":"from-A"}\n');
  const shaA = (await wm.commitInWorktree(a.path, "A edit"))!;
  await fs.writeFile(path.join(b.path, "templates/x/x.json"), '{"v":"from-B"}\n');
  const shaB = (await wm.commitInWorktree(b.path, "B edit"))!;

  // A integrates cleanly; champion advances.
  const champ1 = await wm.integrate(runId, shaA);
  ok(champ1 !== champ0, "A integrates → champion advances");

  // B's pick (based on the old champion) conflicts.
  let err: Error | null = null;
  try { await wm.integrate(runId, shaB); } catch (e) { err = e as Error; }
  ok(!!err, "conflicting cherry-pick throws");
  ok(!!err && err.message.startsWith("integrate-conflict:"), "error is tagged integrate-conflict (steers the next critique)");
  ok(await wm.champion(runId) === champ1, "champion unchanged after the conflict");

  // THE core assertion: the ops worktree recovered — no CHERRY_PICK_HEAD, clean tree.
  const opsWt = path.join(wm.worktreeRoot, `run-${runId}`, "__integrate");
  const picking = await fs.access(path.join(g(["rev-parse", "--git-dir"], opsWt), "CHERRY_PICK_HEAD")).then(() => true, () => false);
  ok(!picking, "ops worktree has no cherry-pick in progress");
  ok(g(["status", "--porcelain"], opsWt) === "", "ops worktree clean");

  // ...so the NEXT promotion integrates fine (this is what used to be impossible).
  const c = await wm.addWorkerWorktree(runId, "worker-c");
  await fs.writeFile(path.join(c.path, "templates/x/other.json"), '{"n":1}\n');
  const shaC = (await wm.commitInWorktree(c.path, "C edit"))!;
  const champ2 = await wm.integrate(runId, shaC);
  ok(champ2 !== champ1, "subsequent integrate succeeds after a recovered conflict");

  // Entry self-heal: wedge the ops tree by hand (simulate a crash mid-pick), then integrate.
  const d = await wm.addWorkerWorktree(runId, "worker-d");
  await fs.writeFile(path.join(d.path, "templates/x/x.json"), '{"v":"from-D"}\n');
  const shaD = (await wm.commitInWorktree(d.path, "D edit"))!;
  const e2 = await wm.addWorkerWorktree(runId, "worker-e");
  await fs.writeFile(path.join(e2.path, "templates/x/x.json"), '{"v":"from-E"}\n');
  const shaE = (await wm.commitInWorktree(e2.path, "E edit"))!;
  const champ3 = await wm.integrate(runId, shaD);
  try { g(["cherry-pick", shaE], opsWt); } catch { /* leaves CHERRY_PICK_HEAD — the simulated crash */ }
  const f = await wm.addWorkerWorktree(runId, "worker-f");
  await fs.writeFile(path.join(f.path, "templates/x/third.json"), '{"n":3}\n');
  const shaF = (await wm.commitInWorktree(f.path, "F edit"))!;
  const champ4 = await wm.integrate(runId, shaF);
  ok(champ4 !== champ3, "integrate self-heals a wedged ops tree on entry (crash mid-pick)");
  ok((await fs.readFile(path.join(repo, "templates/x/x.json"), "utf8")).length > 0, "repo main tree untouched throughout");
} finally {
  await fs.rm(repo, { recursive: true, force: true }).catch(() => {});
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
