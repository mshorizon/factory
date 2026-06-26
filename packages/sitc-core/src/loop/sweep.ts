/**
 * Phase B sweep (DESIGN §5.2, §5.4, §5.6, §8).
 *
 * Drives all in-play sections via the cost-aware scheduler with bounded
 * concurrency (default 3 workers), a shared single-writer integrate mutex, and
 * strategy escalation → freeze on plateau. Runs until every section is locked
 * (≥ threshold) or frozen, or the round budget is hit.
 */
import { pickNext, allSettled, type SectionState } from "./scheduler.js";
import { nextStrategy, ladderExhausted } from "./strategy.js";
import { runSectionIteration, createMutex, type SectionCollaborators, type SectionIterationResult } from "./section-iteration.js";
import type { WorktreeManager } from "../orchestrator/worktree.js";
import type { WorktreePool } from "../orchestrator/worktree-pool.js";
import type { RunStore } from "../orchestrator/store.js";
import { budgetExceeded, type BudgetCaps } from "../delivery/budget.js";

export interface SweepInput {
  worktree: WorktreeManager;
  runId: number;
  collab: SectionCollaborators;
  /** Target screenshot path per section. */
  targetImgFor: (sectionId: string) => string;
  initialStates: SectionState[];
  /** Initial champion render per section (null if none yet). */
  championImg?: Record<string, string | null>;
  maxWorkers?: number;
  maxRounds?: number;
  /** Hard budget caps (§8) — stop when any is hit, returning best-so-far. */
  budget?: BudgetCaps;
  /** Poll this store's command queue between rounds for pause/abort (§16). */
  store?: RunStore;
  /** Persistent worktree pool (I3) — keeps render engines warm across iterations. */
  worktreePool?: WorktreePool;
  nowMs?: () => number;
  /** Consecutive low-yield attempts before escalating strategy. */
  plateauAfter?: number;
  onIteration?: (sectionId: string, r: SectionIterationResult) => void;
}

export interface SweepResult {
  states: SectionState[];
  rounds: number;
  promotions: number;
  /** Total worker invocations dispatched (cost proxy for the §18-G / I1 metric). */
  workerInvocations: number;
  /**
   * Round at which each section FIRST reached its threshold (locked). The headline
   * compounding metric (DESIGN §18-G / tasks I1): "iterations-to-threshold". A
   * section that never locked is absent from the map (treat as null = unreached).
   */
  iterationsToLock: Record<string, number>;
  /** Final champion render per section (the image that won each section). */
  championImg: Record<string, string | null>;
  /** Why the sweep stopped. */
  stoppedBy: "settled" | "maxRounds" | "budget" | "paused" | "aborted";
}

export async function runSweep(input: SweepInput): Promise<SweepResult> {
  const states = new Map(input.initialStates.map((s) => [s.sectionId, { ...s }]));
  const champ: Record<string, string | null> = { ...(input.championImg ?? {}) };
  const critiques: Record<string, string | undefined> = {};
  const lock = createMutex();
  const maxWorkers = input.maxWorkers ?? 3;
  const maxRounds = input.maxRounds ?? 50;
  const plateauAfter = input.plateauAfter ?? 2;
  const now = input.nowMs ?? (() => Date.now());
  const startMs = now();
  let rounds = 0;
  let promotions = 0;
  let workerInvocations = 0;
  const iterationsToLock: Record<string, number> = {};
  let stoppedBy: SweepResult["stoppedBy"] = "settled";

  while (!allSettled([...states.values()])) {
    // admin commands (pause/abort) take effect between rounds (§16)
    if (input.store) {
      const cmd = await input.store.nextCommand(input.runId);
      if (cmd) {
        await input.store.consumeCommand(cmd.id);
        if (cmd.type === "abort") { stoppedBy = "aborted"; break; }
        if (cmd.type === "pause") { stoppedBy = "paused"; break; }
      }
    }
    if (rounds >= maxRounds) {
      stoppedBy = "maxRounds";
      break;
    }
    if (
      input.budget &&
      budgetExceeded({ iterations: workerInvocations, workerInvocations, elapsedMs: now() - startMs }, input.budget)
        .exceeded
    ) {
      stoppedBy = "budget";
      break;
    }
    rounds++;
    const picked = pickNext([...states.values()], maxWorkers);
    if (!picked.length) break;
    workerInvocations += picked.length;

    await Promise.all(
      picked.map(async (pick) => {
        const st = states.get(pick.sectionId)!;
        // Isolate per-section failures: an error in one iteration (worker crash,
        // render/score throw) degrades to a low-yield no-op for THAT section, it
        // never aborts the whole sweep.
        let res: SectionIterationResult;
        try {
          res = await runSectionIteration({
            worktree: input.worktree,
            runId: input.runId,
            workerId: `r${rounds}-${pick.sectionId}`,
            sectionId: pick.sectionId,
            strategy: st.strategy,
            targetImg: input.targetImgFor(pick.sectionId),
            championImg: champ[pick.sectionId] ?? null,
            // Feed the prior attempt's failure (sanity error / scorer critique)
            // back so the worker FIXES it next time (e.g. a type error from a
            // rejected edit) instead of the loop escalating away blindly.
            critique: critiques[pick.sectionId],
            collab: input.collab,
            integrateLock: lock,
            lease: input.worktreePool ? () => input.worktreePool!.acquire() : undefined,
          });
        } catch (err) {
          res = { outcome: "no-op", challengerSha: null, changedFiles: [], critique: `iteration error: ${String(err).slice(0, 160)}` };
        }
        input.onIteration?.(pick.sectionId, res);
        // remember the critique for the section's next attempt (cleared on promote)
        critiques[pick.sectionId] = res.outcome === "promoted" ? "" : res.critique ?? critiques[pick.sectionId];

        if (res.outcome === "promoted") {
          promotions++;
          st.score = res.score?.score ?? st.score;
          champ[pick.sectionId] = res.ourImg ?? champ[pick.sectionId];
          st.attempts = 0;
          if (st.score >= st.threshold && !st.locked) {
            st.locked = true;
            // record the round it first crossed threshold (iterations-to-threshold, I1)
            iterationsToLock[pick.sectionId] = rounds;
          }
          // persist the new champion (DESIGN §10) — best-effort, non-blocking on failure
          if (input.store) {
            await input.store
              .setChampion(input.runId, pick.sectionId, {
                score: st.score,
                snapshotCommit: res.newChampionCommit ?? res.challengerSha ?? undefined,
              })
              .catch(() => undefined);
          }
        } else {
          // reverted / sanity_failed / no-op → low yield
          st.attempts++;
          if (st.attempts >= plateauAfter) {
            if (ladderExhausted(st.strategy)) {
              st.frozen = true; // plateaued after exhausting the ladder (§8)
            } else {
              st.strategy = nextStrategy(st.strategy, { plateaued: true });
              st.attempts = 0;
            }
          }
        }
      }),
    );
  }

  return { states: [...states.values()], rounds, promotions, workerInvocations, iterationsToLock, championImg: champ, stoppedBy };
}
