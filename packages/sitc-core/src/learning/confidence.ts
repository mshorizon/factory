/**
 * Lesson confidence model (DESIGN §9.4).
 *
 * Confidence rises with the win-rate (wins/uses) and the evidence score-delta,
 * dampened by low usage (a 1/1 lesson isn't as trusted as 8/10). Lessons whose
 * confidence falls below a floor are archived (decay).
 */
export interface ConfidenceInput {
  uses: number;
  wins: number;
  /** Average score improvement attributed to the lesson (0..1-ish). */
  scoreDelta?: number;
}

export const CONFIDENCE_FLOOR = 0.2;

export function computeConfidence(input: ConfidenceInput): number {
  const { uses, wins } = input;
  if (uses <= 0) return 0;
  const winRate = Math.max(0, Math.min(1, wins / uses));
  // Usage damping: a Wilson-ish shrink toward 0 for small samples.
  const damp = uses / (uses + 3);
  const deltaBoost = Math.max(0, Math.min(0.3, input.scoreDelta ?? 0));
  return Math.max(0, Math.min(1, winRate * damp + deltaBoost * (1 - winRate * damp)));
}

export function shouldArchive(confidence: number, uses: number): boolean {
  // Only archive once there's enough evidence that it's genuinely low-value.
  return uses >= 3 && confidence < CONFIDENCE_FLOOR;
}
