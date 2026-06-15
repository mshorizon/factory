/**
 * Orphan garbage collection (DESIGN §16).
 *
 * Reclaims resources leaked by runs that died without cleanup: expired-lease
 * runs → tear down their worktrees + run branch, optionally drop the run DB,
 * and mark them cleaned up. Without this, dead runs accumulate databases, git
 * worktrees, and disk indefinitely.
 */
import type { RunStore } from "./store.js";
import type { WorktreeManager } from "./worktree.js";
import { dropRunDb, type SqlExec } from "./run-db.js";

export interface SweepOptions {
  store: RunStore;
  worktree: WorktreeManager;
  /** Provide to also DROP the run-scoped DBs (admin connection). */
  admin?: SqlExec;
  /** Delete the `sitc/run-<id>` branch too (default false — keep for inspection). */
  deleteBranch?: boolean;
  now?: Date;
}

export interface SweepReport {
  reclaimed: number[];
  errors: { runId: number; error: string }[];
}

export async function sweepOrphans(opts: SweepOptions): Promise<SweepReport> {
  const { store, worktree, admin } = opts;
  const report: SweepReport = { reclaimed: [], errors: [] };
  const expired = await store.findExpiredLeasedRuns(opts.now);

  for (const run of expired) {
    try {
      await worktree.teardown(run.id, { deleteBranch: opts.deleteBranch });
      if (admin) await dropRunDb(admin, run.id);
      await store.releaseLease(run.id, run.lockedBy ?? "");
      await store.updateRun(run.id, { cleanedUp: true });
      report.reclaimed.push(run.id);
    } catch (e) {
      report.errors.push({ runId: run.id, error: String(e).slice(0, 160) });
    }
  }
  return report;
}
