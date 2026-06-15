/**
 * Drizzle-backed RunStore — the production bridge for the orchestrator
 * (DESIGN §10/§16). Implements the @mshorizon/sitc-core RunStore interface
 * against the sitc_* control-plane tables.
 *
 * Type-checked against the real schema. NOT yet exercised against production
 * Postgres (gated on an operator run, like the rest of Phase 1's DB DDL).
 */
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import type {
  RunStore,
  RunRecord,
  CreateRunInput,
  IterationRecord,
  CommandRecord,
  SectionScoreInput,
  ChampionInput,
} from "@mshorizon/sitc-core";
import { getDb } from "./client.js";
import {
  sitcRuns,
  sitcIterations,
  sitcSectionScores,
  sitcChampions,
  sitcCommands,
  type SitcRun,
} from "./sitc-schema.js";

function toRecord(r: SitcRun): RunRecord {
  return {
    id: r.id,
    templateName: r.templateName,
    targetUrl: r.targetUrl,
    status: r.status,
    branch: r.branch ?? null,
    maxWorkers: r.maxWorkers,
    budgetIterations: r.budgetIterations ?? null,
    themeLocked: r.themeLocked,
    atomsLocked: r.atomsLocked,
    lockedBy: r.lockedBy ?? null,
    leaseExpiresAt: r.leaseExpiresAt ?? null,
    cleanedUp: r.cleanedUp,
  };
}

export class DrizzleRunStore implements RunStore {
  private get db() {
    return getDb();
  }

  async createRun(input: CreateRunInput): Promise<RunRecord> {
    const [row] = await this.db
      .insert(sitcRuns)
      .values({
        templateName: input.templateName,
        targetUrl: input.targetUrl,
        maxWorkers: input.maxWorkers ?? 3,
        budgetIterations: input.budgetIterations ?? null,
      })
      .returning();
    return toRecord(row);
  }

  async getRun(id: number): Promise<RunRecord | null> {
    const [row] = await this.db.select().from(sitcRuns).where(eq(sitcRuns.id, id)).limit(1);
    return row ? toRecord(row) : null;
  }

  async updateRun(id: number, patch: Partial<RunRecord>): Promise<RunRecord> {
    const [row] = await this.db
      .update(sitcRuns)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(sitcRuns.id, id))
      .returning();
    if (!row) throw new Error(`run ${id} not found`);
    return toRecord(row);
  }

  async acquireLease(id: number, owner: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const rows = await this.db
      .update(sitcRuns)
      .set({ lockedBy: owner, leaseExpiresAt: new Date(now.getTime() + ttlMs) })
      .where(
        and(
          eq(sitcRuns.id, id),
          or(isNull(sitcRuns.lockedBy), lte(sitcRuns.leaseExpiresAt, now), eq(sitcRuns.lockedBy, owner)),
        ),
      )
      .returning({ id: sitcRuns.id });
    return rows.length > 0;
  }

  async renewLease(id: number, owner: string, ttlMs: number): Promise<boolean> {
    const rows = await this.db
      .update(sitcRuns)
      .set({ leaseExpiresAt: new Date(Date.now() + ttlMs) })
      .where(and(eq(sitcRuns.id, id), eq(sitcRuns.lockedBy, owner)))
      .returning({ id: sitcRuns.id });
    return rows.length > 0;
  }

  async releaseLease(id: number, owner: string): Promise<void> {
    await this.db
      .update(sitcRuns)
      .set({ lockedBy: null, leaseExpiresAt: null })
      .where(and(eq(sitcRuns.id, id), eq(sitcRuns.lockedBy, owner)));
  }

  async startIteration(runId: number, iterationNo: number): Promise<IterationRecord> {
    await this.db
      .insert(sitcIterations)
      .values({ runId, iterationNo })
      .onConflictDoNothing({ target: [sitcIterations.runId, sitcIterations.iterationNo] });
    const [row] = await this.db
      .select()
      .from(sitcIterations)
      .where(and(eq(sitcIterations.runId, runId), eq(sitcIterations.iterationNo, iterationNo)))
      .limit(1);
    return {
      id: row.id,
      runId: row.runId,
      iterationNo: row.iterationNo,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt ?? null,
      notes: row.notes ?? null,
    };
  }

  async finishIteration(iterationId: number, notes?: string): Promise<void> {
    await this.db
      .update(sitcIterations)
      .set({ finishedAt: new Date(), ...(notes !== undefined ? { notes } : {}) })
      .where(eq(sitcIterations.id, iterationId));
  }

  async lastIteration(runId: number): Promise<IterationRecord | null> {
    const [row] = await this.db
      .select()
      .from(sitcIterations)
      .where(eq(sitcIterations.runId, runId))
      .orderBy(desc(sitcIterations.iterationNo))
      .limit(1);
    return row
      ? {
          id: row.id,
          runId: row.runId,
          iterationNo: row.iterationNo,
          startedAt: row.startedAt,
          finishedAt: row.finishedAt ?? null,
          notes: row.notes ?? null,
        }
      : null;
  }

  async recordSectionScore(input: SectionScoreInput): Promise<void> {
    await this.db.insert(sitcSectionScores).values({
      iterationId: input.iterationId,
      sectionId: input.sectionId,
      strategy: input.strategy as never,
      outcome: input.outcome as never,
      score: input.score,
      critique: input.critique,
    });
  }

  async setChampion(runId: number, sectionId: string, c: ChampionInput): Promise<void> {
    await this.db
      .insert(sitcChampions)
      .values({ runId, sectionId, score: c.score, snapshotCommit: c.snapshotCommit, variantName: c.variantName })
      .onConflictDoUpdate({
        target: [sitcChampions.runId, sitcChampions.sectionId],
        set: { score: c.score, snapshotCommit: c.snapshotCommit, variantName: c.variantName, updatedAt: new Date() },
      });
  }

  async enqueueCommand(runId: number, type: string, payload?: unknown): Promise<void> {
    await this.db.insert(sitcCommands).values({ runId, type, payload: payload ?? null });
  }

  async nextCommand(runId: number): Promise<CommandRecord | null> {
    const [row] = await this.db
      .select()
      .from(sitcCommands)
      .where(and(eq(sitcCommands.runId, runId), isNull(sitcCommands.consumedAt)))
      .orderBy(sitcCommands.createdAt)
      .limit(1);
    return row
      ? { id: row.id, runId: row.runId, type: row.type, payload: row.payload, createdAt: row.createdAt, consumedAt: row.consumedAt ?? null }
      : null;
  }

  async consumeCommand(id: number): Promise<void> {
    await this.db.update(sitcCommands).set({ consumedAt: new Date() }).where(eq(sitcCommands.id, id));
  }

  async findExpiredLeasedRuns(now = new Date()): Promise<RunRecord[]> {
    const rows = await this.db
      .select()
      .from(sitcRuns)
      .where(
        and(
          sql`${sitcRuns.lockedBy} is not null`,
          lte(sitcRuns.leaseExpiresAt, now),
          sql`${sitcRuns.status} not in ('done','aborted')`,
        ),
      );
    return rows.map(toRecord);
  }
}
