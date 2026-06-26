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
  /**
   * Render the section. `strategy` + `base` let the renderer pick a fast path:
   * a JSON-only `tune-json` change leaves component code identical to the
   * iteration's `base` champion, so it can render through a shared, already-warm
   * per-champion engine (reading the worker's edited JSON via profilePath) instead
   * of cold-compiling a fresh per-worktree engine (tasks I2). Code-changing
   * strategies must still render from their own worktree (their edits live there).
   */
  render(ctx: { worktreePath: string; sectionId: string; strategy: MutationStrategy; base: string }): Promise<{ ourImg: string }>;
  /**
   * Optional cross-breakpoint guard (I12, DESIGN §5.2 step 6). Called only when a
   * challenger has WON the desktop pairwise AND there's an existing champion to fall
   * back to. Returns `ok:false` to REJECT the promotion (e.g. the challenger breaks
   * mobile layout) — the champion is kept and the reason feeds the next critique.
   * Absent → no guard (current behavior).
   */
  guard?(ctx: { worktreePath: string; sectionId: string; strategy: MutationStrategy; base: string; ourImg: string }): Promise<{ ok: boolean; reason?: string }>;
  score(ctx: { ourImg: string; targetImg: string }): Promise<HybridScore>;
  judge(ctx: { champion: string; challenger: string; target: string }): Promise<PairwiseResult>;
}

/** A leased worktree (tasks I3) — same shape `addWorkerWorktree` yields, plus release. */
export interface WorktreeLease {
  path: string;
  base: string;
  release(): Promise<void>;
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
  /**
   * Lease a PERSISTENT pooled worktree (I3) instead of creating a fresh one per
   * iteration. When provided, its `release()` returns the slot to the pool (kept
   * warm); when absent, the iteration falls back to `addWorkerWorktree` +
   * `removeWorktree` (the original per-iteration behavior).
   */
  lease?: () => Promise<WorktreeLease>;
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
  // Pooled worktree (I3) if a lease is provided, else a fresh per-iteration one.
  const leased: WorktreeLease = input.lease
    ? await input.lease()
    : await (async () => {
        const w = await worktree.addWorkerWorktree(runId, workerId);
        return {
          path: w.path,
          base: w.base,
          release: async () => {
            if (process.env.SITC_KEEP_FAILED_WORKTREE !== "1") await worktree.removeWorktree(w.path);
          },
        };
      })();
  const wt = { path: leased.path, base: leased.base };
  try {
    // MUTATE
    const m = await collab.mutate({ worktreePath: wt.path, sectionId, strategy, critique: input.critique });
    // The worker may have committed its own edits (it has Bash). Soft-reset to the
    // base so those changes are uncommitted again and get captured below as one
    // integrate commit — otherwise commitInWorktree sees a clean tree → false no-op.
    await worktree.resetSoftTo(wt.path, wt.base);
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
    const { ourImg } = await collab.render({ worktreePath: wt.path, sectionId, strategy, base: wt.base });
    const score = await collab.score({ ourImg, targetImg: input.targetImg });

    // SELECT — first challenger auto-promotes; otherwise pairwise A/B decides
    let promote = input.championImg == null;
    if (!promote) {
      const pw = await collab.judge({ champion: input.championImg as string, challenger: ourImg, target: input.targetImg });
      promote = pw.winner === "challenger";
    }

    // GUARD (I12) — a desktop win must not regress another breakpoint (e.g. mobile).
    // Only when there's a champion to keep; the first challenger has no fallback.
    if (promote && input.championImg != null && collab.guard) {
      const g = await collab.guard({ worktreePath: wt.path, sectionId, strategy, base: wt.base, ourImg });
      if (!g.ok) {
        return { outcome: "reverted", challengerSha: sha, changedFiles, score, ourImg, critique: g.reason ?? "rejected by breakpoint guard" };
      }
    }

    if (promote) {
      const newChampionCommit = input.integrateLock
        ? await input.integrateLock.run(() => worktree.integrate(runId, sha))
        : await worktree.integrate(runId, sha);
      return { outcome: "promoted", challengerSha: sha, newChampionCommit, changedFiles, score, ourImg, critique: score.vlm.critique };
    }
    return { outcome: "reverted", challengerSha: sha, changedFiles, score, ourImg, critique: score.vlm.critique };
  } finally {
    // Release the worktree: pooled → returns the slot (kept warm, I3); fresh →
    // removes it (unless SITC_KEEP_FAILED_WORKTREE=1, honored in the fallback above).
    await leased.release();
  }
}
