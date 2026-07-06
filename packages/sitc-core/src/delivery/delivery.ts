/**
 * Strategy-routed delivery (DESIGN §6 / §13.4).
 *
 * A run that reached threshold and passes both gates auto-merges to `develop`
 * — but ONLY if it touched no shared code. Any `new-variant`/`new-section` run,
 * any failed gate, or a non-converged run stops in `needs_review` (branch kept).
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { MutationStrategy } from "../types.js";
import { forcesReview } from "../loop/strategy.js";
import type { GateResult } from "./gates.js";

export type DeliveryDecision = "auto-merge" | "needs_review";

export interface DeliveryInput {
  strategiesUsed: MutationStrategy[];
  thresholdReached: boolean;
  regression: GateResult;
  acceptance: GateResult;
}

export interface DeliveryRouting {
  decision: DeliveryDecision;
  reasons: string[];
}

export function decideDelivery(input: DeliveryInput): DeliveryRouting {
  const reasons: string[] = [];
  if (!input.regression.pass || !input.acceptance.pass) {
    reasons.push(...input.regression.failures, ...input.acceptance.failures);
    return { decision: "needs_review", reasons };
  }
  if (!input.thresholdReached) {
    reasons.push("threshold not reached (best-so-far) — human review");
    return { decision: "needs_review", reasons };
  }
  if (input.strategiesUsed.some(forcesReview)) {
    reasons.push("introduced shared code (new-variant/new-section) — human approves before merge");
    return { decision: "needs_review", reasons };
  }
  return { decision: "auto-merge", reasons: ["clean tuning run; threshold reached; gates pass"] };
}

// ─── git merge action (only on auto-merge) ───────────────────────────────────

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, maxBuffer: 1024 * 1024 * 16 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`git ${args.join(" ")} failed: ${stderr || err.message}`));
      resolve(stdout.trim());
    });
  });
}

export interface MergeOptions {
  repoRoot: string;
  runBranch: string;
  develop?: string;
  noFF?: boolean;
}

/**
 * Merge the run branch into `develop` (no-ff). Returns the new develop sha.
 *
 * todo I21 — never hijack the operator's checkout. Two paths:
 *   • main checkout already ON develop (the VPS case): merge in place, but only
 *    with a clean tree (an uncommitted operator edit must not be swept into an
 *    auto-merge commit).
 *   • main checkout on ANY other branch: the old code did `git checkout develop`
 *    in the operator's working tree mid-run — switching their branch under them.
 *    Now the merge happens in a throwaway worktree pinned at `develop`; the
 *    operator's checkout (branch, index, dirty files) is never touched. If
 *    develop is checked out in some other worktree, `git worktree add` refuses
 *    → the error propagates and landDelivery downgrades to needs_review.
 */
export async function mergeRunToDevelop(opts: MergeOptions): Promise<string> {
  const develop = opts.develop ?? "develop";
  const msg = `sitc: auto-merge ${opts.runBranch}`;
  const mergeArgs = ["merge", opts.runBranch, "-m", msg];
  if (opts.noFF !== false) mergeArgs.splice(1, 0, "--no-ff");

  const head = await git(["rev-parse", "--abbrev-ref", "HEAD"], opts.repoRoot).catch(() => "");
  if (head === develop) {
    if ((await git(["status", "--porcelain"], opts.repoRoot)) !== "") {
      throw new Error("working tree not clean — refusing to auto-merge in place");
    }
    await git(mergeArgs, opts.repoRoot);
    return git(["rev-parse", "HEAD"], opts.repoRoot);
  }

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-merge-"));
  try {
    await git(["worktree", "add", tmp, develop], opts.repoRoot);
    await git(mergeArgs, tmp);
    return await git(["rev-parse", "HEAD"], tmp);
  } finally {
    await git(["worktree", "remove", "--force", tmp], opts.repoRoot).catch(() => {});
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

// ─── full landing (merge+push / push+PR / safe downgrade) — tasks I4 ──────────

export interface LandingOptions {
  /** Push the landed branch to the remote. OUTWARD-FACING (triggers prod deploy) —
   * default false; the operator opts in. A no-push auto-merge still accumulates on
   * the local `develop` so the next run seeds from the improved template. */
  push?: boolean;
  remote?: string;
  develop?: string;
  /** Open a PR for the run branch (needs_review runs, or as a review-first lane). */
  openPr?: boolean;
  /** Injectable PR opener (defaults to the `gh` CLI) so the path is testable. */
  prOpener?: (o: { repoRoot: string; branch: string; base: string; title: string; body: string }) => Promise<string | null>;
}

export interface LandingResult {
  decision: DeliveryDecision;
  merged?: { develop: string };
  /** Whether a push to the remote actually happened. */
  pushed?: boolean;
  prUrl?: string | null;
  /** True when auto-merge was intended but the git landing failed → kept for review. */
  downgradedToReview?: boolean;
  notes: string[];
}

/** Default PR opener — `gh pr create`. Best-effort: returns the URL or null. */
export async function ghOpenPr(o: { repoRoot: string; branch: string; base: string; title: string; body: string }): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      "gh",
      ["pr", "create", "--base", o.base, "--head", o.branch, "--title", o.title, "--body", o.body],
      { cwd: o.repoRoot, maxBuffer: 1024 * 1024 * 8 },
      (err, stdout) => resolve(err ? null : stdout.trim() || null),
    );
  });
}

/**
 * Perform the actual delivery git work after `decideDelivery` (DESIGN §13.4):
 *   auto-merge   → merge the run branch into `develop` (no-ff), optionally push.
 *                  Any git failure (dirty tree, conflict) → DOWNGRADE to needs_review
 *                  with the branch intact, never a thrown crash mid-run.
 *   needs_review → leave the branch; optionally push it + open a PR so the human
 *                  review happens off a durable remote branch (no manual cherry-pick).
 *
 * This is the piece that closes the flywheel: a clean run lands on `develop`
 * unattended so the NEXT run starts from the improved template (CONCLUSIONS #7),
 * instead of run branches piling up for hand cherry-picking.
 */
export async function landDelivery(opts: {
  repoRoot: string;
  runBranch: string;
  routing: DeliveryRouting;
  landing?: LandingOptions;
}): Promise<LandingResult> {
  const l = opts.landing ?? {};
  const remote = l.remote ?? "origin";
  const develop = l.develop ?? "develop";
  const notes: string[] = [];

  if (opts.routing.decision === "auto-merge") {
    try {
      // I21 — pushing onto a develop that silently diverged from the remote would
      // fail (or worse, force-shape history). Check BEFORE merging so a stale local
      // develop downgrades cleanly with no local merge to unwind.
      if (l.push) {
        await git(["fetch", remote, develop], opts.repoRoot);
        const behind = await git(["merge-base", "--is-ancestor", `${remote}/${develop}`, develop], opts.repoRoot).then(
          () => false,
          () => true,
        );
        if (behind) throw new Error(`local ${develop} is behind ${remote}/${develop} — sync before auto-merge`);
      }
      const sha = await mergeRunToDevelop({ repoRoot: opts.repoRoot, runBranch: opts.runBranch, develop });
      notes.push(`auto-merged ${opts.runBranch} → ${develop} @ ${sha.slice(0, 9)}`);
      let pushed = false;
      if (l.push) {
        await git(["push", remote, develop], opts.repoRoot);
        pushed = true;
        notes.push(`pushed ${develop} → ${remote}`);
      } else {
        notes.push(`not pushed (set SITC_DELIVERY_PUSH=1 to propagate to ${remote}/prod)`);
      }
      return { decision: "auto-merge", merged: { develop: sha }, pushed, notes };
    } catch (e) {
      // Safe downgrade — the branch is untouched and reviewable.
      notes.push(`auto-merge FAILED, downgraded to needs_review: ${(e as Error).message}`);
      const review = await landNeedsReview(opts.repoRoot, opts.runBranch, remote, develop, l, notes);
      return { ...review, downgradedToReview: true };
    }
  }

  return landNeedsReview(opts.repoRoot, opts.runBranch, remote, develop, l, notes);
}

async function landNeedsReview(
  repoRoot: string,
  runBranch: string,
  remote: string,
  develop: string,
  l: LandingOptions,
  notes: string[],
): Promise<LandingResult> {
  let pushed = false;
  let prUrl: string | null = null;
  if (l.push || l.openPr) {
    // A PR needs the branch on the remote first.
    try {
      await git(["push", "-u", remote, runBranch], repoRoot);
      pushed = true;
      notes.push(`pushed ${runBranch} → ${remote}`);
    } catch (e) {
      notes.push(`branch push failed: ${(e as Error).message}`);
    }
  }
  if (l.openPr && pushed) {
    const opener = l.prOpener ?? ghOpenPr;
    prUrl = await opener({
      repoRoot,
      branch: runBranch,
      base: develop,
      title: `sitc: ${runBranch}`,
      body: "Automated SITC run — review the additive design-system changes before merge.",
    });
    notes.push(prUrl ? `opened PR ${prUrl}` : "PR open attempt returned no URL (gh missing/unauth?)");
  }
  return { decision: "needs_review", pushed, prUrl, notes };
}
