/**
 * Cost-aware work-unit scheduler (DESIGN §5.6).
 *
 * Picks the next sections to work on by expected score-gain-per-cost rather than
 * round-robin: prioritize sections farthest below threshold, break ties toward
 * cheaper strategies; skip locked (≥threshold) and frozen (plateaued) sections.
 * Pure → unit-tested.
 */
import type { MutationStrategy } from "../types.js";
import { STRATEGY_COST } from "./strategy.js";

export interface SectionState {
  sectionId: string;
  /** Current absolute design-system score 0..1. */
  score: number;
  /** Target threshold 0..1 (e.g. 0.9). */
  threshold: number;
  strategy: MutationStrategy;
  /** Consecutive low-yield attempts (feeds plateau/freeze). */
  attempts: number;
  /** True once score ≥ threshold. */
  locked: boolean;
  /** True once plateaued after ladder exhaustion (§8). */
  frozen: boolean;
}

/** Distance below threshold (0 if at/over). Bigger = more to gain. */
export function gap(s: SectionState): number {
  return Math.max(0, s.threshold - s.score);
}

export function inPlay(s: SectionState): boolean {
  return !s.locked && !s.frozen;
}

/** Whether all sections are settled (every one locked or frozen). */
export function allSettled(states: SectionState[]): boolean {
  return states.every((s) => s.locked || s.frozen);
}

/**
 * Return up to `maxWorkers` highest-priority in-play sections.
 * Priority: larger gap first; tie-break toward cheaper strategy, then fewer attempts.
 */
export function pickNext(states: SectionState[], maxWorkers: number): SectionState[] {
  return states
    .filter(inPlay)
    .slice()
    .sort((a, b) => {
      const g = gap(b) - gap(a);
      if (Math.abs(g) > 1e-9) return g;
      const c = STRATEGY_COST[a.strategy] - STRATEGY_COST[b.strategy];
      if (c !== 0) return c;
      return a.attempts - b.attempts;
    })
    .slice(0, Math.max(0, maxWorkers));
}
