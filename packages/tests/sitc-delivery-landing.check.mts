#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I4 (close the auto-merge loop).
 * Real temp git repos (+ a bare remote); no model, no network.
 *
 * Run: pnpm tsx packages/tests/sitc-delivery-landing.check.mts
 *
 * Covers landDelivery:
 *   A. auto-merge → develop advances, run branch merged (local, no push).
 *   B. auto-merge + push → the bare remote's develop receives the merge.
 *   C. auto-merge with a DIRTY working tree → safe downgrade to needs_review,
 *      run branch intact, no crash.
 *   D. needs_review + openPr → run branch pushed, injected PR opener called.
 */
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { landDelivery, decideDelivery } from "../sitc-core/src/delivery/delivery.js";

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
};
const g = (args: string[], cwd: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

const PASS_GATE = { pass: true, failures: [] };

/** Build a repo on `develop` with a clean run branch carrying one extra commit. */
async function makeRepo(withRemote: boolean): Promise<{ repo: string; remote?: string; runBranch: string }> {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i4-"));
  g(["init", "-q", "-b", "develop"], repo);
  g(["config", "user.email", "t@t.test"], repo);
  g(["config", "user.name", "t"], repo);
  await fs.writeFile(path.join(repo, "tpl.json"), '{"v":1}\n');
  g(["add", "-A"], repo);
  g(["commit", "-qm", "base"], repo);
  // run branch with an additive change
  const runBranch = "sitc/run-1";
  g(["branch", runBranch, "HEAD"], repo);
  g(["checkout", "-q", runBranch], repo);
  await fs.writeFile(path.join(repo, "tpl.json"), '{"v":2}\n');
  g(["add", "-A"], repo);
  g(["commit", "-qm", "tune"], repo);
  g(["checkout", "-q", "develop"], repo);
  let remote: string | undefined;
  if (withRemote) {
    remote = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i4-remote-"));
    g(["init", "-q", "--bare", "-b", "develop"], remote);
    g(["remote", "add", "origin", remote], repo);
    g(["push", "-q", "origin", "develop"], repo);
    g(["push", "-q", "origin", runBranch], repo);
  }
  return { repo, remote, runBranch };
}

const cleanRouting = decideDelivery({ strategiesUsed: ["tune-json"], thresholdReached: true, regression: PASS_GATE, acceptance: PASS_GATE });
const reviewRouting = decideDelivery({ strategiesUsed: ["new-variant"], thresholdReached: true, regression: PASS_GATE, acceptance: PASS_GATE });
ok(cleanRouting.decision === "auto-merge", "decideDelivery: clean tune-json → auto-merge");
ok(reviewRouting.decision === "needs_review", "decideDelivery: new-variant → needs_review");

// ── A. auto-merge, local only ────────────────────────────────────────────────
console.log("A. auto-merge (local, no push)");
{
  const { repo, runBranch } = await makeRepo(false);
  try {
    const r = await landDelivery({ repoRoot: repo, runBranch, routing: cleanRouting });
    ok(r.decision === "auto-merge" && !!r.merged, "landed as auto-merge");
    ok(r.pushed === false, "not pushed (default)");
    ok((await fs.readFile(path.join(repo, "tpl.json"), "utf8")).includes('"v":2'), "develop working tree has the merged change");
    ok(g(["rev-parse", "HEAD"], repo) === r.merged!.develop, "returned sha == develop HEAD");
  } finally { await fs.rm(repo, { recursive: true, force: true }); }
}

// ── B. auto-merge + push ─────────────────────────────────────────────────────
console.log("B. auto-merge + push");
{
  const { repo, remote, runBranch } = await makeRepo(true);
  try {
    const r = await landDelivery({ repoRoot: repo, runBranch, routing: cleanRouting, landing: { push: true } });
    ok(r.pushed === true, "pushed = true");
    ok(g(["rev-parse", "develop"], remote!) === r.merged!.develop, "remote develop advanced to the merge");
  } finally { await fs.rm(repo, { recursive: true, force: true }); if (remote) await fs.rm(remote, { recursive: true, force: true }); }
}

// ── C. auto-merge with a dirty tree → safe downgrade ─────────────────────────
console.log("C. dirty tree → downgrade to needs_review");
{
  const { repo, runBranch } = await makeRepo(false);
  try {
    await fs.writeFile(path.join(repo, "tpl.json"), '{"v":99,"dirty":true}\n'); // uncommitted
    const r = await landDelivery({ repoRoot: repo, runBranch, routing: cleanRouting });
    ok(r.decision === "needs_review" && r.downgradedToReview === true, "downgraded to needs_review");
    ok(!r.merged, "no merge recorded");
    ok(g(["rev-parse", "--verify", runBranch], repo).length === 40, "run branch intact");
    ok(r.notes.some((n) => /not clean/i.test(n)), "note explains the downgrade");
  } finally { await fs.rm(repo, { recursive: true, force: true }); }
}

// ── D. needs_review + openPr (injected opener) ───────────────────────────────
console.log("D. needs_review → push branch + open PR");
{
  const { repo, remote, runBranch } = await makeRepo(true);
  try {
    let seen: any = null;
    const r = await landDelivery({
      repoRoot: repo, runBranch, routing: reviewRouting,
      landing: { openPr: true, prOpener: async (o) => { seen = o; return "https://example.test/pr/1"; } },
    });
    ok(r.decision === "needs_review", "stays needs_review");
    ok(r.pushed === true, "run branch pushed for the PR");
    ok(r.prUrl === "https://example.test/pr/1", "PR url surfaced");
    ok(seen?.branch === runBranch && seen?.base === "develop", "PR opener got branch + base");
    ok(!r.merged, "no merge to develop");
  } finally { await fs.rm(repo, { recursive: true, force: true }); if (remote) await fs.rm(remote, { recursive: true, force: true }); }
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
