/**
 * Orchestrator skeleton (DESIGN §4, §5, §16).
 *
 * Phase 1: drives the run loop with a STUB worker (no AI, no real render) to
 * exercise the state machine, single-owner lease, and crash-recovery. The real
 * per-section work (render → sanity → score → pairwise select) is wired in
 * later phases by swapping the injected worker.
 *
 * Crash-safety contract (§16): each iteration's row is written BEFORE acting and
 * marked finished AFTER. On resume we re-run the last unfinished iteration
 * (startIteration is idempotent), so a crash loses at most one in-flight unit.
 */
import type { RunStore, IterationRecord } from "./store.js";
import { applyEvent, isTerminal, type RunStatus } from "./state-machine.js";

export interface IterationContext {
  runId: number;
  iterationNo: number;
  store: RunStore;
}

export interface IterationResult {
  sectionId: string;
  score: number;
  outcome: "promoted" | "reverted";
  snapshotCommit?: string;
  variantName?: string;
}

/** A worker advances one iteration. May throw to simulate a crash. */
export type SectionWorker = (ctx: IterationContext) => Promise<IterationResult>;

export interface OrchestratorOptions {
  store: RunStore;
  worker: SectionWorker;
  /** Host identity for the single-owner lease (e.g. "vps" | "local"). */
  owner: string;
  leaseTtlMs?: number;
}

export interface RunOutcome {
  status: RunStatus;
  iterationsRun: number;
  reason: "completed" | "paused" | "aborted" | "lease-denied";
}

export class Orchestrator {
  private store: RunStore;
  private worker: SectionWorker;
  private owner: string;
  private leaseTtlMs: number;

  constructor(opts: OrchestratorOptions) {
    this.store = opts.store;
    this.worker = opts.worker;
    this.owner = opts.owner;
    this.leaseTtlMs = opts.leaseTtlMs ?? 60_000;
  }

  /** Where to resume: re-run an unfinished iteration, else next number (§16). */
  private resumePoint(last: IterationRecord | null): number {
    if (!last) return 1;
    return last.finishedAt === null ? last.iterationNo : last.iterationNo + 1;
  }

  async run(runId: number): Promise<RunOutcome> {
    if (!(await this.store.acquireLease(runId, this.owner, this.leaseTtlMs))) {
      return { status: (await this.store.getRun(runId))?.status ?? "idle", iterationsRun: 0, reason: "lease-denied" };
    }

    let run = await this.store.getRun(runId);
    if (!run) throw new Error(`run ${runId} not found`);
    if (run.status === "idle") run = await this.store.updateRun(runId, { status: applyEvent(run.status, "start") });

    const cap = run.budgetIterations ?? Infinity;
    let ran = 0;

    try {
      let next = this.resumePoint(await this.store.lastIteration(runId));
      while (next <= cap) {
        // honor admin commands before starting work
        const cmd = await this.store.nextCommand(runId);
        if (cmd) {
          await this.store.consumeCommand(cmd.id);
          if (cmd.type === "abort") {
            await this.store.updateRun(runId, { status: applyEvent(run.status, "abort") });
            return { status: "aborted", iterationsRun: ran, reason: "aborted" };
          }
          if (cmd.type === "pause") {
            await this.store.updateRun(runId, { status: applyEvent(run.status, "pause") });
            return { status: "paused", iterationsRun: ran, reason: "paused" };
          }
        }

        // write-before-act (idempotent on resume)
        const iter = await this.store.startIteration(runId, next);
        const result = await this.worker({ runId, iterationNo: next, store: this.store });
        await this.store.recordSectionScore({
          iterationId: iter.id,
          sectionId: result.sectionId,
          outcome: result.outcome,
          score: result.score,
        });
        if (result.outcome === "promoted") {
          await this.store.setChampion(runId, result.sectionId, {
            score: result.score,
            snapshotCommit: result.snapshotCommit,
            variantName: result.variantName,
          });
        }
        await this.store.finishIteration(iter.id);
        await this.store.renewLease(runId, this.owner, this.leaseTtlMs);
        ran++;
        next++;
      }

      await this.store.updateRun(runId, { status: applyEvent("running", "complete_clean") });
      return { status: "done", iterationsRun: ran, reason: "completed" };
    } finally {
      const cur = await this.store.getRun(runId);
      if (cur && isTerminal(cur.status)) await this.store.releaseLease(runId, this.owner);
    }
  }
}
