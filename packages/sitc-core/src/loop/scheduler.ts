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
  /** Consecutive low-yield attempts (feeds plateau/freeze). Resets to 0 on promote. */
  attempts: number;
  /**
   * TOTAL times this section has been dispatched to a worker across the run —
   * unlike `attempts`, never reset (a promote keeps the tally). Drives the
   * coverage floor so a section can't be starved to 0 iterations by higher-gap
   * peers when `maxWorkers < in-play count` (CONCLUSIONS #6, the `about` bug).
   * Optional for back-compat with existing state literals (undefined ⇒ 0).
   */
  dispatches?: number;
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

/** Total dispatches an in-play section has received (undefined ⇒ 0). */
export function dispatchesOf(s: SectionState): number {
  return s.dispatches ?? 0;
}

/**
 * A section is "covered" once it's been dispatched at least `minCoverage` times.
 * An in-play section below the floor is starved and must be prioritized.
 */
export function isCovered(s: SectionState, minCoverage: number): boolean {
  return dispatchesOf(s) >= minCoverage;
}

/**
 * True once every IN-PLAY section has met the coverage floor. (Locked/frozen
 * sections are done and don't need coverage.) Undefined `minCoverage` ⇒ vacuously
 * true. Useful as an observability / guarantee predicate alongside `allSettled`.
 */
export function coverageMet(states: SectionState[], minCoverage: number): boolean {
  if (minCoverage <= 0) return true;
  return states.filter(inPlay).every((s) => isCovered(s, minCoverage));
}

export interface PickOptions {
  /**
   * Coverage floor: in-play sections dispatched fewer than this many times sort
   * STRICTLY BEFORE covered ones, so no in-play unit is starved to 0 iterations
   * before the run settles on budget/rounds (CONCLUSIONS #6). Default 0 = off
   * (pure gap ordering, unchanged behavior).
   */
  minCoverage?: number;
}

/**
 * Return up to `maxWorkers` highest-priority in-play sections.
 *
 * Priority:
 *   0. COVERAGE — uncovered (dispatches < minCoverage) before covered, so every
 *      in-play unit gets its floor of attempts before any peer gets re-rolled
 *      beyond it. This is a hard partition, not a tie-break: it beats gap.
 *   1. larger gap first;
 *   2. tie-break toward cheaper strategy;
 *   3. then fewer attempts.
 */
export function pickNext(states: SectionState[], maxWorkers: number, opts: PickOptions = {}): SectionState[] {
  const minCoverage = opts.minCoverage ?? 0;
  return states
    .filter(inPlay)
    .slice()
    .sort((a, b) => {
      if (minCoverage > 0) {
        const cov = Number(isCovered(a, minCoverage)) - Number(isCovered(b, minCoverage));
        if (cov !== 0) return cov; // false(0) sorts before true(1) → uncovered first
      }
      const g = gap(b) - gap(a);
      if (Math.abs(g) > 1e-9) return g;
      const c = STRATEGY_COST[a.strategy] - STRATEGY_COST[b.strategy];
      if (c !== 0) return c;
      return a.attempts - b.attempts;
    })
    .slice(0, Math.max(0, maxWorkers));
}
