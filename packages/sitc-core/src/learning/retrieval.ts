/**
 * Semantic retrieval (DESIGN §9.2).
 *
 * Tag pre-filter (scope + overlapping design traits, archived excluded) → vector
 * cosine similarity → ranked by similarity × confidence. The top-K are injected
 * into the worker prompt so guidance is *situational* ("this kind of gap, on this
 * kind of design"), not generic tag buckets.
 */
import type { EmbedFn } from "./embed.js";
import { cosineSimilarity } from "./embed.js";
import type { LessonRecord, LessonStore } from "./lesson-store.js";

export interface RetrievalQuery {
  scope?: string;
  designTraits?: string[];
  /** Free text built from section type + detected traits + the live critique. */
  text: string;
}

export interface RetrievedLesson {
  lesson: LessonRecord;
  similarity: number;
  /** similarity × confidence (new lessons still surface a little via a confidence floor). */
  rank: number;
}

export async function retrieveLessons(
  store: LessonStore,
  embed: EmbedFn,
  query: RetrievalQuery,
  opts: { topK?: number } = {},
): Promise<RetrievedLesson[]> {
  const topK = opts.topK ?? 5;
  const candidates = await store.candidates({ scope: query.scope, designTraits: query.designTraits });
  if (!candidates.length) return [];
  const q = await embed(query.text);
  const scored = candidates.map((lesson) => {
    const similarity = lesson.embedding ? cosineSimilarity(q, lesson.embedding) : 0;
    const rank = similarity * (0.15 + lesson.confidence); // confidence floor lets fresh lessons participate
    return { lesson, similarity, rank };
  });
  scored.sort((a, b) => b.rank - a.rank);
  return scored.slice(0, topK);
}

/** Render retrieved lessons as a prompt block for the worker / authoring kit. */
export function lessonsToPromptBlock(retrieved: RetrievedLesson[]): string {
  if (!retrieved.length) return "";
  const lines = retrieved.map(
    (r) => `- (${r.lesson.scope}, conf ${r.lesson.confidence.toFixed(2)}) ${r.lesson.lesson}`,
  );
  return `Relevant lessons from prior runs (advisory — hints, not rules):\n${lines.join("\n")}`;
}
