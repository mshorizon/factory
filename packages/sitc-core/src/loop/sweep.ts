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
  /** Consecutive low-yield attempts before escalating strategy. */
  plateauAfter?: number;
  onIteration?: (sectionId: string, r: SectionIterationResult) => void;
}

export interface SweepResult {
  states: SectionState[];
  rounds: number;
  promotions: number;
}

export async function runSweep(input: SweepInput): Promise<SweepResult> {
  const states = new Map(input.initialStates.map((s) => [s.sectionId, { ...s }]));
  const champ: Record<string, string | null> = { ...(input.championImg ?? {}) };
  const lock = createMutex();
  const maxWorkers = input.maxWorkers ?? 3;
  const maxRounds = input.maxRounds ?? 50;
  const plateauAfter = input.plateauAfter ?? 2;
  let rounds = 0;
  let promotions = 0;

  while (!allSettled([...states.values()]) && rounds < maxRounds) {
    rounds++;
    const picked = pickNext([...states.values()], maxWorkers);
    if (!picked.length) break;

    await Promise.all(
      picked.map(async (pick) => {
        const st = states.get(pick.sectionId)!;
        const res = await runSectionIteration({
          worktree: input.worktree,
          runId: input.runId,
          workerId: `r${rounds}-${pick.sectionId}`,
          sectionId: pick.sectionId,
          strategy: st.strategy,
          targetImg: input.targetImgFor(pick.sectionId),
          championImg: champ[pick.sectionId] ?? null,
          collab: input.collab,
          integrateLock: lock,
        });
        input.onIteration?.(pick.sectionId, res);

        if (res.outcome === "promoted") {
          promotions++;
          st.score = res.score?.score ?? st.score;
          champ[pick.sectionId] = res.ourImg ?? champ[pick.sectionId];
          st.attempts = 0;
          if (st.score >= st.threshold) st.locked = true;
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

  return { states: [...states.values()], rounds, promotions };
}
