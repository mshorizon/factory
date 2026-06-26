/**
 * Worktree pool (tasks I3 / CONCLUSIONS #1 — "the single biggest reliability/speed win").
 *
 * THE WASTE THIS REMOVES: code-changing iterations (`extend-variant`/`new-variant`/
 * `new-section`) used a FRESH per-iteration worktree (`addWorkerWorktree`), so every
 * one paid a cold Vite compile (~9s idle, minutes under load). A run does dozens of
 * these → most of its wall-clock + fragility.
 *
 * THE FIX: a fixed pool of N = maxWorkers PERSISTENT slot worktrees. Each iteration
 * leases a free slot (reset to the current champion on acquire — cheap), so the slot's
 * render engine stays warm across iterations and HMR recompiles only the worker's
 * actual edits instead of cold-starting. (`tune-json` already renders through I2's
 * shared per-champion base engine; this covers the code-changing strategies.)
 *
 * Pure orchestration over the injected WorktreeManager → unit-tested with a fake.
 */
import type { WorktreeManager } from "./worktree.js";

export interface WorktreeLease {
  path: string;
  base: string;
  /** Return the slot to the pool. Idempotent. */
  release(): Promise<void>;
}

export class WorktreePool {
  private readonly free: number[];
  private readonly waiters: Array<(slot: number) => void> = [];

  constructor(
    private readonly worktree: Pick<WorktreeManager, "acquireSlot">,
    private readonly runId: number | string,
    size: number,
  ) {
    this.free = Array.from({ length: Math.max(1, size) }, (_, i) => i);
  }

  private takeSlot(): Promise<number> {
    const n = this.free.pop();
    if (n !== undefined) return Promise.resolve(n);
    return new Promise((resolve) => this.waiters.push(resolve)); // wait for a release
  }

  private giveSlot(n: number): void {
    const w = this.waiters.shift();
    if (w) w(n);
    else this.free.push(n);
  }

  /**
   * Lease a slot worktree, reset to the current champion. Blocks if all slots are
   * in use until one is released. Call `release()` when done (the sweep awaits all
   * leases of a round, so the pool never over-subscribes, but blocking keeps it
   * correct if maxWorkers ever exceeds the pool size).
   */
  async acquire(): Promise<WorktreeLease> {
    const slot = await this.takeSlot();
    try {
      const { path, base } = await this.worktree.acquireSlot(this.runId, slot);
      let released = false;
      return {
        path,
        base,
        release: async () => {
          if (released) return;
          released = true;
          this.giveSlot(slot);
        },
      };
    } catch (e) {
      this.giveSlot(slot); // don't leak the slot if reset/create failed
      throw e;
    }
  }
}
