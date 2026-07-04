/**
 * Budget caps (DESIGN §8).
 *
 * A run ends when any cap is hit — wall-clock, iteration count, or
 * worker-invocation count — returning "best so far". Pure → unit-tested.
 */
export interface BudgetCaps {
  maxIterations?: number;
  maxWorkerInvocations?: number;
  maxWallClockMs?: number;
  /**
   * Hard dollar cap (todo I27) — checked against the live CostMeter spend (I9).
   * Previously the meter measured `totalUsd` in real time but nothing enforced it,
   * so a stuck-expensive run burned to the iteration cap.
   */
  maxUsd?: number;
}

export interface BudgetSpent {
  iterations: number;
  workerInvocations: number;
  elapsedMs: number;
  /** Live dollar spend (CostMeter). Absent → the usd cap is not evaluated. */
  usd?: number;
}

export interface BudgetCheck {
  exceeded: boolean;
  hit: ("iterations" | "workerInvocations" | "wallClock" | "usd")[];
}

export function budgetExceeded(spent: BudgetSpent, caps: BudgetCaps): BudgetCheck {
  const hit: BudgetCheck["hit"] = [];
  if (caps.maxIterations != null && spent.iterations >= caps.maxIterations) hit.push("iterations");
  if (caps.maxWorkerInvocations != null && spent.workerInvocations >= caps.maxWorkerInvocations)
    hit.push("workerInvocations");
  if (caps.maxWallClockMs != null && spent.elapsedMs >= caps.maxWallClockMs) hit.push("wallClock");
  if (caps.maxUsd != null && spent.usd != null && spent.usd >= caps.maxUsd) hit.push("usd");
  return { exceeded: hit.length > 0, hit };
}
