/**
 * Per-section iteration (DESIGN §5.2) — the inner loop:
 *   SNAPSHOT (worktree at champion) → MUTATE → SANITY (§5.2a) → RENDER → SCORE
 *   → SELECT (pairwise A/B, §7.2a) → integrate | discard.
 *
 * Quality is monotonic: a challenger is integrated only if it WINS the pairwise
 * judgment (or is the first attempt); otherwise the champion is kept. Collaborators
 * are injected so this is verifiable with fakes and so prod wires the real
 * authorVariant / sanity / renderSection / scoreSection / pairwiseJudge.
 *
 * The single-writer integrate (§5.4) is guarded by an optional shared mutex so
 * concurrent section iterations can't race the run branch.
 */
import type { WorktreeManager } from "../orchestrator/worktree.js";
import type { MutationStrategy } from "../types.js";
import type { SanityResult } from "./sanity.js";
import type { HybridScore } from "../scorer/score.js";
import type { PairwiseResult } from "../scorer/pairwise.js";

export interface Mutex {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

/** Tiny FIFO async mutex — serializes the single-writer integrate. */
export function createMutex(): Mutex {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      const result = tail.then(fn);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}

export interface SectionCollaborators {
  mutate(ctx: {
    worktreePath: string;
    sectionId: string;
    strategy: MutationStrategy;
    critique?: string;
  }): Promise<{ changedFiles?: string[]; summary?: string }>;
  sanity(ctx: { worktreePath: string; changedFiles: string[]; strategy: MutationStrategy }): Promise<SanityResult>;
  render(ctx: { worktreePath: string; sectionId: string }): Promise<{ ourImg: string }>;
  score(ctx: { ourImg: string; targetImg: string }): Promise<HybridScore>;
  judge(ctx: { champion: string; challenger: string; target: string }): Promise<PairwiseResult>;
}

export interface SectionIterationInput {
  worktree: WorktreeManager;
  runId: number;
  workerId: string;
  sectionId: string;
  strategy: MutationStrategy;
  targetImg: string;
  /** Current champion render; null on the section's first iteration. */
  championImg: string | null;
  critique?: string;
  collab: SectionCollaborators;
  integrateLock?: Mutex;
}

export type SectionOutcome = "promoted" | "reverted" | "sanity_failed" | "no-op";

export interface SectionIterationResult {
  outcome: SectionOutcome;
  challengerSha: string | null;
  newChampionCommit?: string;
  changedFiles: string[];
  score?: HybridScore;
  ourImg?: string;
  critique?: string;
}

export async function runSectionIteration(input: SectionIterationInput): Promise<SectionIterationResult> {
  const { worktree, runId, workerId, sectionId, strategy, collab } = input;
  const wt = await worktree.addWorkerWorktree(runId, workerId);
  try {
    // MUTATE
    const m = await collab.mutate({ worktreePath: wt.path, sectionId, strategy, critique: input.critique });
    const sha = await worktree.commitInWorktree(wt.path, `sitc(${sectionId}/${strategy}): ${m.summary ?? "edit"}`);
    // Surface the worker's reasoning on a no-op so we can see WHY nothing changed
    // (plan judged infeasible / already-matches / plan didn't parse, etc.).
    if (!sha) return { outcome: "no-op", challengerSha: null, changedFiles: [], critique: m.summary };
    const changedFiles = await worktree.changedFiles(wt.path, sha);

    // SANITY — allowlist + build + validate, before any render/score
    const gate = await collab.sanity({ worktreePath: wt.path, changedFiles, strategy });
    if (!gate.ok) {
      return { outcome: "sanity_failed", challengerSha: sha, changedFiles, critique: gate.reason };
    }

    // RENDER + SCORE
    const { ourImg } = await collab.render({ worktreePath: wt.path, sectionId });
    const score = await collab.score({ ourImg, targetImg: input.targetImg });

    // SELECT — first challenger auto-promotes; otherwise pairwise A/B decides
    let promote = input.championImg == null;
    if (!promote) {
      const pw = await collab.judge({ champion: input.championImg as string, challenger: ourImg, target: input.targetImg });
      promote = pw.winner === "challenger";
    }

    if (promote) {
      const newChampionCommit = input.integrateLock
        ? await input.integrateLock.run(() => worktree.integrate(runId, sha))
        : await worktree.integrate(runId, sha);
      return { outcome: "promoted", challengerSha: sha, newChampionCommit, changedFiles, score, ourImg, critique: score.vlm.critique };
    }
    return { outcome: "reverted", challengerSha: sha, changedFiles, score, ourImg, critique: score.vlm.critique };
  } finally {
    await worktree.removeWorktree(wt.path);
  }
}
