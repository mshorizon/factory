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
}

export interface BudgetSpent {
  iterations: number;
  workerInvocations: number;
  elapsedMs: number;
}

export interface BudgetCheck {
  exceeded: boolean;
  hit: ("iterations" | "workerInvocations" | "wallClock")[];
}

export function budgetExceeded(spent: BudgetSpent, caps: BudgetCaps): BudgetCheck {
  const hit: BudgetCheck["hit"] = [];
  if (caps.maxIterations != null && spent.iterations >= caps.maxIterations) hit.push("iterations");
  if (caps.maxWorkerInvocations != null && spent.workerInvocations >= caps.maxWorkerInvocations)
    hit.push("workerInvocations");
  if (caps.maxWallClockMs != null && spent.elapsedMs >= caps.maxWallClockMs) hit.push("wallClock");
  return { exceeded: hit.length > 0, hit };
}
