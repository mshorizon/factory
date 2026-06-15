/**
 * Strategy-routed delivery (DESIGN §6 / §13.4).
 *
 * A run that reached threshold and passes both gates auto-merges to `develop`
 * — but ONLY if it touched no shared code. Any `new-variant`/`new-section` run,
 * any failed gate, or a non-converged run stops in `needs_review` (branch kept).
 */
import { execFile } from "node:child_process";
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

/** Merge the run branch into `develop` (no-ff). Returns the new develop sha. */
export async function mergeRunToDevelop(opts: MergeOptions): Promise<string> {
  const develop = opts.develop ?? "develop";
  await git(["checkout", develop], opts.repoRoot);
  const args = ["merge", opts.runBranch, "-m", `sitc: auto-merge ${opts.runBranch}`];
  if (opts.noFF !== false) args.splice(1, 0, "--no-ff");
  await git(args, opts.repoRoot);
  return git(["rev-parse", "HEAD"], opts.repoRoot);
}
