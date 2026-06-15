/**
 * RunStore — the persistence seam the orchestrator drives (DESIGN §10, §16).
 *
 * The interface keeps the orchestrator DB-agnostic and testable. The in-memory
 * impl here is what the crash-recovery test exercises (it plays the role of the
 * durable store across simulated orchestrator restarts); the Drizzle-backed impl
 * lives in @mshorizon/db.
 */
import type { RunStatus } from "./state-machine.js";

export interface RunRecord {
  id: number;
  templateName: string;
  targetUrl: string;
  status: RunStatus;
  branch: string | null;
  maxWorkers: number;
  budgetIterations: number | null;
  lockedBy: string | null;
  leaseExpiresAt: Date | null;
  cleanedUp: boolean;
}

export interface CreateRunInput {
  templateName: string;
  targetUrl: string;
  maxWorkers?: number;
  budgetIterations?: number | null;
}

export interface IterationRecord {
  id: number;
  runId: number;
  iterationNo: number;
  startedAt: Date;
  finishedAt: Date | null;
  notes: string | null;
}

export interface CommandRecord {
  id: number;
  runId: number;
  type: string;
  payload: unknown;
  createdAt: Date;
  consumedAt: Date | null;
}

export interface SectionScoreInput {
  iterationId: number;
  sectionId: string;
  strategy?: string;
  outcome?: string;
  score?: number;
  critique?: string;
}

export interface ChampionInput {
  score?: number;
  snapshotCommit?: string;
  variantName?: string;
}

export interface RunStore {
  createRun(input: CreateRunInput): Promise<RunRecord>;
  getRun(id: number): Promise<RunRecord | null>;
  /** Patch arbitrary run fields (status, branch, ...). */
  updateRun(id: number, patch: Partial<RunRecord>): Promise<RunRecord>;

  // single-owner lease (DESIGN §13.1 / §16)
  acquireLease(id: number, owner: string, ttlMs: number): Promise<boolean>;
  renewLease(id: number, owner: string, ttlMs: number): Promise<boolean>;
  releaseLease(id: number, owner: string): Promise<void>;

  // iterations (write-before-act → idempotent resume, §16)
  startIteration(runId: number, iterationNo: number): Promise<IterationRecord>;
  finishIteration(iterationId: number, notes?: string): Promise<void>;
  lastIteration(runId: number): Promise<IterationRecord | null>;

  recordSectionScore(input: SectionScoreInput): Promise<void>;
  setChampion(runId: number, sectionId: string, c: ChampionInput): Promise<void>;

  // command channel (admin → orchestrator)
  enqueueCommand(runId: number, type: string, payload?: unknown): Promise<void>;
  nextCommand(runId: number): Promise<CommandRecord | null>;
  consumeCommand(id: number): Promise<void>;

  /** Runs whose lease has expired (orphan detection, §16). */
  findExpiredLeasedRuns(now?: Date): Promise<RunRecord[]>;
}

// ─── In-memory implementation ────────────────────────────────────────────────

export class InMemoryRunStore implements RunStore {
  private runs = new Map<number, RunRecord>();
  private iterations: IterationRecord[] = [];
  private commands: CommandRecord[] = [];
  private scores: SectionScoreInput[] = [];
  private champions = new Map<string, ChampionInput & { sectionId: string; runId: number }>();
  private seq = { run: 0, iter: 0, cmd: 0 };

  async createRun(input: CreateRunInput): Promise<RunRecord> {
    const id = ++this.seq.run;
    const rec: RunRecord = {
      id,
      templateName: input.templateName,
      targetUrl: input.targetUrl,
      status: "idle",
      branch: null,
      maxWorkers: input.maxWorkers ?? 3,
      budgetIterations: input.budgetIterations ?? null,
      lockedBy: null,
      leaseExpiresAt: null,
      cleanedUp: false,
    };
    this.runs.set(id, rec);
    return { ...rec };
  }

  async getRun(id: number): Promise<RunRecord | null> {
    const r = this.runs.get(id);
    return r ? { ...r } : null;
  }

  async updateRun(id: number, patch: Partial<RunRecord>): Promise<RunRecord> {
    const r = this.runs.get(id);
    if (!r) throw new Error(`run ${id} not found`);
    Object.assign(r, patch);
    return { ...r };
  }

  async acquireLease(id: number, owner: string, ttlMs: number): Promise<boolean> {
    const r = this.runs.get(id);
    if (!r) return false;
    const now = Date.now();
    const held = r.lockedBy && r.leaseExpiresAt && r.leaseExpiresAt.getTime() > now;
    if (held && r.lockedBy !== owner) return false;
    r.lockedBy = owner;
    r.leaseExpiresAt = new Date(now + ttlMs);
    return true;
  }

  async renewLease(id: number, owner: string, ttlMs: number): Promise<boolean> {
    const r = this.runs.get(id);
    if (!r || r.lockedBy !== owner) return false;
    r.leaseExpiresAt = new Date(Date.now() + ttlMs);
    return true;
  }

  async releaseLease(id: number, owner: string): Promise<void> {
    const r = this.runs.get(id);
    if (r && r.lockedBy === owner) {
      r.lockedBy = null;
      r.leaseExpiresAt = null;
    }
  }

  async startIteration(runId: number, iterationNo: number): Promise<IterationRecord> {
    const existing = this.iterations.find((i) => i.runId === runId && i.iterationNo === iterationNo);
    if (existing) return { ...existing };
    const rec: IterationRecord = {
      id: ++this.seq.iter,
      runId,
      iterationNo,
      startedAt: new Date(),
      finishedAt: null,
      notes: null,
    };
    this.iterations.push(rec);
    return { ...rec };
  }

  async finishIteration(iterationId: number, notes?: string): Promise<void> {
    const it = this.iterations.find((i) => i.id === iterationId);
    if (it) {
      it.finishedAt = new Date();
      if (notes !== undefined) it.notes = notes;
    }
  }

  async lastIteration(runId: number): Promise<IterationRecord | null> {
    const forRun = this.iterations.filter((i) => i.runId === runId);
    if (!forRun.length) return null;
    return { ...forRun.reduce((a, b) => (b.iterationNo > a.iterationNo ? b : a)) };
  }

  async recordSectionScore(input: SectionScoreInput): Promise<void> {
    this.scores.push({ ...input });
  }

  async setChampion(runId: number, sectionId: string, c: ChampionInput): Promise<void> {
    this.champions.set(`${runId}:${sectionId}`, { runId, sectionId, ...c });
  }

  async enqueueCommand(runId: number, type: string, payload?: unknown): Promise<void> {
    this.commands.push({
      id: ++this.seq.cmd,
      runId,
      type,
      payload: payload ?? null,
      createdAt: new Date(),
      consumedAt: null,
    });
  }

  async nextCommand(runId: number): Promise<CommandRecord | null> {
    const c = this.commands.find((x) => x.runId === runId && x.consumedAt === null);
    return c ? { ...c } : null;
  }

  async consumeCommand(id: number): Promise<void> {
    const c = this.commands.find((x) => x.id === id);
    if (c) c.consumedAt = new Date();
  }

  async findExpiredLeasedRuns(now = new Date()): Promise<RunRecord[]> {
    return [...this.runs.values()]
      .filter(
        (r) =>
          r.lockedBy != null &&
          r.leaseExpiresAt != null &&
          r.leaseExpiresAt.getTime() <= now.getTime() &&
          !["done", "aborted"].includes(r.status),
      )
      .map((r) => ({ ...r }));
  }
}
