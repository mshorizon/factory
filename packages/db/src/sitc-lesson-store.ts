/**
 * Drizzle-backed LessonStore (DESIGN §9) — pgvector `sitc_lessons`.
 *
 * Tag pre-filter (scope) runs in SQL; the design-traits overlap is applied
 * in-app (jsonb-array overlap is awkward in SQL and lesson counts are modest).
 * The vector cosine ranking is done by the caller (`retrieveLessons`). A
 * pgvector-native `ORDER BY embedding <=> $q` method can be added later for scale.
 *
 * Type-checked; not yet run against production (gated, like the rest of the DB).
 */
import { and, eq, or, sql } from "drizzle-orm";
import type { LessonStore, LessonRecord, NewLesson } from "@mshorizon/sitc-core";
import { getDb } from "./client.js";
import { sitcLessons, type SitcLesson } from "./sitc-schema.js";

function toRecord(r: SitcLesson): LessonRecord {
  return {
    id: r.id,
    scope: r.scope,
    designTraits: r.designTraits ?? [],
    trigger: r.trigger,
    lesson: r.lesson,
    embedding: (r.embedding as number[] | null) ?? null,
    evidenceRunId: r.evidenceRunId ?? null,
    scoreDelta: r.scoreDelta ?? null,
    confidence: r.confidence,
    uses: r.uses,
    wins: r.wins,
    archived: r.archived,
  };
}

export class DrizzleLessonStore implements LessonStore {
  private get db() {
    return getDb();
  }

  async insert(l: NewLesson): Promise<LessonRecord> {
    const [row] = await this.db
      .insert(sitcLessons)
      .values({
        scope: l.scope,
        designTraits: l.designTraits ?? [],
        trigger: l.trigger,
        lesson: l.lesson,
        embedding: l.embedding,
        evidenceRunId: l.evidenceRunId,
        scoreDelta: l.scoreDelta,
        confidence: l.confidence ?? 0,
      })
      .returning();
    return toRecord(row);
  }

  async update(id: number, patch: Partial<LessonRecord>): Promise<LessonRecord> {
    const [row] = await this.db.update(sitcLessons).set(patch).where(eq(sitcLessons.id, id)).returning();
    if (!row) throw new Error(`lesson ${id} not found`);
    return toRecord(row);
  }

  async candidates(filter: { scope?: string; designTraits?: string[] }): Promise<LessonRecord[]> {
    const where = filter.scope
      ? and(eq(sitcLessons.archived, false), or(eq(sitcLessons.scope, filter.scope), eq(sitcLessons.scope, "general")))
      : eq(sitcLessons.archived, false);
    const rows = await this.db.select().from(sitcLessons).where(where);
    const traits = new Set(filter.designTraits ?? []);
    // Trait-less lessons are wildcards (apply to any design) — same semantics as
    // InMemoryLessonStore.candidates.
    return rows
      .map(toRecord)
      .filter((r) => traits.size === 0 || r.designTraits.length === 0 || r.designTraits.some((t) => traits.has(t)));
  }

  async all(includeArchived = false): Promise<LessonRecord[]> {
    const rows = includeArchived
      ? await this.db.select().from(sitcLessons)
      : await this.db.select().from(sitcLessons).where(eq(sitcLessons.archived, false));
    return rows.map(toRecord);
  }

  async recordUse(id: number, won: boolean): Promise<LessonRecord> {
    const [row] = await this.db
      .update(sitcLessons)
      .set({ uses: sql`${sitcLessons.uses} + 1`, wins: won ? sql`${sitcLessons.wins} + 1` : sitcLessons.wins })
      .where(eq(sitcLessons.id, id))
      .returning();
    return toRecord(row);
  }

  async archive(id: number): Promise<void> {
    await this.db.update(sitcLessons).set({ archived: true }).where(eq(sitcLessons.id, id));
  }
}
