/**
 * VLM absolute scorer (DESIGN §7).
 *
 * Scores how closely OUR render matches the TARGET on the DESIGN SYSTEM
 * (layout, color, typography, spacing, radius, imagery TREATMENT) — explicitly
 * discounting literal copy and specific photos, so the threshold is reachable
 * with placeholder content. Returns a 0..1 score, a per-dimension breakdown, and
 * the critique that steers the next worker. Used for tracking/threshold/plateau,
 * NOT for promotion (promotion = pairwise, §7.2a).
 */
import type { WorkerRunner } from "../types.js";

export interface VlmScore {
  score: number; // 0..1
  breakdown: Record<string, number>; // 0..1 per dimension
  critique: string;
}

interface RawVlm {
  score: number; // 0..100
  breakdown?: Record<string, number>;
  critique?: string;
}

export async function vlmScore(
  runner: WorkerRunner,
  ourImg: string,
  targetImg: string,
  opts: { model?: string } = {},
): Promise<VlmScore> {
  const prompt = `Compare OUR rendered website section to the TARGET and score DESIGN-SYSTEM fidelity.
OUR:    ${ourImg}
TARGET: ${targetImg}
Score 0-100 on: layout/composition, color system, typography, spacing rhythm, border-radius, imagery TREATMENT (not the literal photo). IGNORE exact copy text and specific photo content.
Output NOTHING except one JSON object: {"score":0-100,"breakdown":{"layout":0-100,"color":0-100,"typography":0-100,"spacing":0-100,"imagery":0-100},"critique":"<the top concrete gaps to fix next>"}`;
  const r = await runner.runJson<RawVlm>(prompt, {
    images: [ourImg, targetImg],
    allowedTools: ["Read"],
    model: opts.model,
  });
  const norm = (n: number) => Math.max(0, Math.min(1, (Number(n) || 0) / 100));
  const breakdown: Record<string, number> = {};
  for (const [k, v] of Object.entries(r.breakdown ?? {})) breakdown[k] = norm(v as number);
  return { score: norm(r.score), breakdown, critique: r.critique ?? "" };
}
