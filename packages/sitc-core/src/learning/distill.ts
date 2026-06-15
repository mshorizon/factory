/**
 * End-of-run distillation + dedup (DESIGN §9.4).
 *
 * A distillation worker reads the run's iteration history and proposes new/updated
 * lessons; `dedupeLessons` merges them against existing rows by embedding
 * similarity (so the store doesn't accumulate near-duplicates). Net effect: the
 * Nth run starts smarter than the 1st.
 */
import type { WorkerRunner } from "../types.js";
import type { EmbedFn } from "./embed.js";
import { cosineSimilarity } from "./embed.js";

export interface IterationDatum {
  sectionId: string;
  strategy: string;
  outcome: string;
  scoreDelta?: number;
  critique?: string;
}

export interface DistilledLesson {
  scope: string;
  designTraits: string[];
  trigger: string;
  lesson: string;
  scoreDelta?: number;
}

export interface DistillInput {
  traits?: Record<string, unknown>;
  history: IterationDatum[];
  model?: string;
}

export async function distillLessons(runner: WorkerRunner, input: DistillInput): Promise<DistilledLesson[]> {
  const prompt = `You are distilling reusable DESIGN-CLONING lessons from one run's history.
Detected target traits: ${JSON.stringify(input.traits ?? {})}.
Iteration history (sectionId, strategy, outcome, scoreDelta, critique):
${JSON.stringify(input.history).slice(0, 6000)}
Propose 0-6 GENERALIZABLE, trait-conditioned heuristics (not target-specific quirks) that would help a FUTURE run on a similar design. Each must be actionable.
Output NOTHING except one JSON object: {"lessons":[{"scope":"hero|color|typography|spacing|layout|general","designTraits":["..."],"trigger":"<when it applies>","lesson":"<what to do>","scoreDelta":0.0}]}`;
  const r = await runner.runJson<{ lessons: DistilledLesson[] }>(prompt, { model: input.model });
  return r.lessons ?? [];
}

export interface DedupeResult {
  fresh: DistilledLesson[];
  duplicates: { proposed: DistilledLesson; existingId: number; similarity: number }[];
}

/**
 * Split proposed lessons into genuinely-new vs near-duplicates of existing ones
 * (cosine ≥ threshold). Duplicates should be MERGED (bump evidence) not re-added.
 */
export async function dedupeLessons(
  existing: { id: number; embedding: number[] | null }[],
  proposed: DistilledLesson[],
  embed: EmbedFn,
  threshold = 0.92,
): Promise<DedupeResult> {
  const result: DedupeResult = { fresh: [], duplicates: [] };
  for (const p of proposed) {
    const vec = await embed(`${p.trigger} ${p.lesson} ${p.designTraits.join(" ")}`);
    let best: { id: number; sim: number } | null = null;
    for (const e of existing) {
      if (!e.embedding) continue;
      const sim = cosineSimilarity(vec, e.embedding);
      if (!best || sim > best.sim) best = { id: e.id, sim };
    }
    if (best && best.sim >= threshold) {
      result.duplicates.push({ proposed: p, existingId: best.id, similarity: best.sim });
    } else {
      result.fresh.push(p);
    }
  }
  return result;
}
