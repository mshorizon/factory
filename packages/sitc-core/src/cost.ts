/**
 * Pre-launch cost & duration estimate (DESIGN §18-H).
 *
 * Surfaced on the admin "Start run" screen so a run's likely €/time is known up
 * front and the budget cap (§8) can be set sensibly. Pure → unit-tested.
 *
 *   tokens ≈ sections · iters/section · (mutate + score + pairwise) tokens
 *   wall-clock ≈ (total iters / workers) · (worker + render) seconds
 */
export interface CostModel {
  /** Estimated tokens per call type. */
  mutateTokens: number;
  scoreTokens: number;
  /** Pairwise judge = both orders. */
  pairwiseTokens: number;
  /** Blended USD per 1M tokens. */
  usdPerMTok: number;
  /** Wall-clock seconds per iteration. */
  workerSeconds: number;
  renderSeconds: number;
}

/** Conservative defaults (override per model/measurement). */
export const DEFAULT_COST_MODEL: CostModel = {
  mutateTokens: 12_000,
  scoreTokens: 4_000,
  pairwiseTokens: 6_000,
  usdPerMTok: 6,
  workerSeconds: 25,
  renderSeconds: 4,
};

export interface EstimateInput {
  sectionCount: number;
  avgIterationsPerSection: number;
  maxWorkers?: number;
  /** Add the theme + atom passes (a handful of whole-page scored iterations). */
  includeTierPasses?: boolean;
  model?: Partial<CostModel>;
}

export interface CostEstimate {
  iterations: number;
  totalTokens: number;
  usd: number;
  wallClockSeconds: number;
  wallClockHours: number;
}

export function estimateRunCost(input: EstimateInput): CostEstimate {
  const m: CostModel = { ...DEFAULT_COST_MODEL, ...(input.model ?? {}) };
  const workers = Math.max(1, input.maxWorkers ?? 3);
  const tierIters = input.includeTierPasses ? 6 : 0; // ~theme + atom passes
  const iterations = Math.max(0, Math.round(input.sectionCount * input.avgIterationsPerSection) + tierIters);
  const tokensPerIter = m.mutateTokens + m.scoreTokens + m.pairwiseTokens;
  const totalTokens = iterations * tokensPerIter;
  const usd = (totalTokens / 1_000_000) * m.usdPerMTok;
  const wallClockSeconds = (iterations / workers) * (m.workerSeconds + m.renderSeconds);
  return {
    iterations,
    totalTokens,
    usd: Math.round(usd * 100) / 100,
    wallClockSeconds: Math.round(wallClockSeconds),
    wallClockHours: Math.round((wallClockSeconds / 3600) * 10) / 10,
  };
}
