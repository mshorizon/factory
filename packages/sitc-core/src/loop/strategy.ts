/**
 * Mutation-strategy escalation (DESIGN §6, reuse-before-create §17).
 *
 * Try the cheapest, safest strategy first; escalate only when a section
 * plateaus. `new-variant`/`new-section` (shared codegen) come last and force a
 * `needs_review` delivery (§6/§13.4).
 */
import type { MutationStrategy } from "../types.js";

export const STRATEGY_LADDER: readonly MutationStrategy[] = [
  "tune-json",
  "extend-variant",
  "new-variant",
  "new-section",
];

/** Relative cost/risk of a strategy (cheaper first — used by the scheduler). */
export const STRATEGY_COST: Record<MutationStrategy, number> = {
  "tune-json": 1,
  "extend-variant": 2,
  "new-variant": 4,
  "new-section": 8,
};

/** Strategies that introduce shared code → force `needs_review` at delivery (§6). */
export function forcesReview(strategy: MutationStrategy): boolean {
  return strategy === "new-variant" || strategy === "new-section";
}

/** Next strategy: stay put while improving; escalate one rung on plateau. */
export function nextStrategy(current: MutationStrategy, opts: { plateaued: boolean }): MutationStrategy {
  if (!opts.plateaued) return current;
  const i = STRATEGY_LADDER.indexOf(current);
  return STRATEGY_LADDER[Math.min(i + 1, STRATEGY_LADDER.length - 1)];
}

/** True once escalation has exhausted the ladder (→ freeze the section, §8). */
export function ladderExhausted(current: MutationStrategy): boolean {
  return current === STRATEGY_LADDER[STRATEGY_LADDER.length - 1];
}
