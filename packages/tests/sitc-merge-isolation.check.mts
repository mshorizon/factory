#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I21 (regression gate + merge never touch the
 * operator's checkout). Real temp git repos + real spawned commands.
 *
 * The failures this fixes: (a) the pre-merge build/validate ran in `repoRoot` —
 * the operator's checkout on develop — type-checking code the run never changed;
 * (b) `mergeRunToDevelop` did `git checkout develop` in the operator's working
 * tree mid-run, switching their branch under them.
 *
 * Run: pnpm tsx packages/tests/sitc-merge-isolation.check.mts
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { mergeRunToDevelop, landDelivery, decideDelivery } from "../sitc-core/src/delivery/delivery.js";
import { createRegressionChecks } from "../sitc-core/src/delivery/checks.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const g = (args: string[], cwd: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

const PASS_GATE = { pass: true, failures: [] };
const cleanRouting = decideDelivery({ strategiesUsed: ["tune-json"], thresholdReached: true, regression: PASS_GATE, acceptance: PASS_GATE });

async function makeRepo(headBranch: string): Promise<{ repo: string; runBranch: string }> {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i21-"));
  g(["init", "-q", "-b", "develop"], repo);
  g(["config", "user.email", "t@t.test"], repo);
  g(["config", "user.name", "t"], repo);
  await fs.writeFile(path.join(repo, "tpl.json"), '{"v":1}\n');
  g(["add", "-A"], repo);
  g(["commit", "-qm", "base"], repo);
  const runBranch = "sitc/run-1";
  g(["branch", runBranch, "HEAD"], repo);
  g(["checkout", "-q", runBranch], repo);
  await fs.writeFile(path.join(repo, "tpl.json"), '{"v":2}\n');
  g(["add", "-A"], repo);
  g(["commit", "-qm", "tune"], repo);
  if (headBranch !== runBranch) {
    if (headBranch !== "develop") g(["branch", headBranch, "develop"], repo);
    g(["checkout", "-q", headBranch], repo);
  }
  return { repo, runBranch };
}

// ── A. merge with operator on ANOTHER branch → checkout untouched ────────────
console.log("A. merge in a temp worktree (operator on another branch)");
{
  const { repo, runBranch } = await makeRepo("work");
  try {
    await fs.writeFile(path.join(repo, "wip.txt"), "operator dirty work\n"); // dirty operator tree
    const sha = await mergeRunToDevelop({ repoRoot: repo, runBranch });
    ok(g(["rev-parse", "develop"], repo) === sha, "develop ref advanced to the merge");
    ok(g(["rev-parse", "--abbrev-ref", "HEAD"], repo) === "work", "operator's HEAD still on their branch");
    ok((await fs.readFile(path.join(repo, "wip.txt"), "utf8")).includes("dirty"), "operator's dirty file untouched");
    ok((await fs.readFile(path.join(repo, "tpl.json"), "utf8")).includes('"v":1'), "operator's working tree NOT rewritten by the merge");
    ok(g(["log", "-1", "--format=%P", "develop"], repo).split(" ").length === 2, "no-ff merge commit (two parents)");
  } finally { await fs.rm(repo, { recursive: true, force: true }); }
}

// ── B. operator ON develop (VPS case) — in-place semantics preserved ─────────
console.log("B. in-place merge when HEAD == develop");
{
  const { repo, runBranch } = await makeRepo("develop");
  try {
    const sha = await mergeRunToDevelop({ repoRoot: repo, runBranch });
    ok(g(["rev-parse", "HEAD"], repo) === sha, "merged in place on develop");
    ok((await fs.readFile(path.join(repo, "tpl.json"), "utf8")).includes('"v":2'), "working tree has the merged change (VPS accumulation)");
  } finally { await fs.rm(repo, { recursive: true, force: true }); }
}
{
  // dirty tree on develop still refuses (must not sweep operator edits into the merge)
  const { repo, runBranch } = await makeRepo("develop");
  try {
    await fs.writeFile(path.join(repo, "tpl.json"), '{"v":99}\n');
    const r = await landDelivery({ repoRoot: repo, runBranch, routing: cleanRouting });
    ok(r.decision === "needs_review" && r.downgradedToReview === true, "dirty tree on develop → safe downgrade");
    ok(r.notes.some((n) => /not clean/i.test(n)), "downgrade note explains why");
  } finally { await fs.rm(repo, { recursive: true, force: true }); }
}

// ── C. regression checks run in the champion tree (cwd thunk) ────────────────
console.log("C. gate cwd thunk");
{
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i21-root-"));
  const champTree = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i21-champ-"));
  try {
    let resolved = 0;
    const checks = createRegressionChecks({
      repoRoot,
      cwd: async () => { resolved++; return champTree; },
      // `node -e` writes a marker into ITS cwd — proves where the command ran.
      buildCmd: ["node", ["-e", "require('fs').writeFileSync('gate-marker.txt','here')"]],
      validateCmd: ["node", ["-e", "process.exit(0)"]],
      ssimPairs: async () => [],
    });
    const b = await checks.build();
    const v = await checks.validate();
    ok(b.ok && v.ok, "build + validate pass");
    ok(await fs.access(path.join(champTree, "gate-marker.txt")).then(() => true, () => false), "build ran in the CHAMPION tree, not repoRoot");
    ok(await fs.access(path.join(repoRoot, "gate-marker.txt")).then(() => false, () => true), "…and nothing ran in repoRoot");
    ok(resolved === 1, "cwd thunk resolved once (memoized across checks)");

    const noCwd = createRegressionChecks({
      repoRoot,
      buildCmd: ["node", ["-e", "require('fs').writeFileSync('root-marker.txt','here')"]],
      validateCmd: ["node", ["-e", "process.exit(0)"]],
      ssimPairs: async () => [],
    });
    await noCwd.build();
    ok(await fs.access(path.join(repoRoot, "root-marker.txt")).then(() => true, () => false), "no cwd option → repoRoot (back-compat)");
  } finally {
    await fs.rm(repoRoot, { recursive: true, force: true });
    await fs.rm(champTree, { recursive: true, force: true });
  }
}

// ── D. push onto a stale develop → downgrade BEFORE merging ──────────────────
console.log("D. stale develop + push");
{
  const { repo, runBranch } = await makeRepo("develop");
  const remote = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i21-remote-"));
  try {
    g(["init", "-q", "--bare", "-b", "develop"], remote);
    g(["remote", "add", "origin", remote], repo);
    g(["push", "-q", "origin", "develop", runBranch], repo);
    // advance the REMOTE develop so the local one is behind
    const other = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i21-other-"));
    g(["clone", "-q", "-b", "develop", remote, other], os.tmpdir());
    g(["config", "user.email", "o@t.test"], other);
    g(["config", "user.name", "o"], other);
    await fs.writeFile(path.join(other, "remote-change.txt"), "x\n");
    g(["add", "-A"], other);
    g(["commit", "-qm", "remote work"], other);
    g(["push", "-q", "origin", "develop"], other);

    const devBefore = g(["rev-parse", "develop"], repo);
    const r = await landDelivery({ repoRoot: repo, runBranch, routing: cleanRouting, landing: { push: true } });
    ok(r.decision === "needs_review" && r.downgradedToReview === true, "stale local develop + push → downgrade");
    ok(r.notes.some((n) => /behind/.test(n)), "note names the divergence");
    ok(g(["rev-parse", "develop"], repo) === devBefore, "no local merge happened (checked BEFORE merging)");
    await fs.rm(other, { recursive: true, force: true });
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
    await fs.rm(remote, { recursive: true, force: true });
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
