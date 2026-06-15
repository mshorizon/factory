/**
 * Hybrid section scorer (DESIGN §7).
 *
 * Absolute tracking score = w_vlm·vlm + w_pixel·pixel. This drives the
 * threshold/plateau/dashboards; PROMOTION is decided by the pairwise judge
 * (§7.2a), not this number.
 */
import type { WorkerRunner } from "../types.js";
import { vlmScore, type VlmScore } from "./vlm.js";
import { pixelScore, type PixelScore } from "./pixel.js";

export interface HybridScore {
  score: number; // 0..1
  vlm: VlmScore;
  pixel: PixelScore;
  weights: { vlm: number; pixel: number };
}

export interface ScoreSectionInput {
  ourImg: string;
  targetImg: string;
  weights?: { vlm: number; pixel: number };
  model?: string;
}

export async function scoreSection(runner: WorkerRunner, input: ScoreSectionInput): Promise<HybridScore> {
  const weights = input.weights ?? { vlm: 0.7, pixel: 0.3 };
  const [vlm, pixel] = await Promise.all([
    vlmScore(runner, input.ourImg, input.targetImg, { model: input.model }),
    pixelScore(input.targetImg, input.ourImg),
  ]);
  const score = weights.vlm * vlm.score + weights.pixel * pixel.similarity;
  return { score, vlm, pixel, weights };
}
