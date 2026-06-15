/**
 * Cold start → tier locking (DESIGN §5.0 → §5.1 → §5.1b).
 *
 * Produces the run's working profile with the global theme and shared atoms
 * LOCKED, flipping `themeLocked`/`atomsLocked` on the run so that per-section
 * work (Phase B) can only mutate section-local structure on a stable substrate.
 */
import type { BusinessProfile, WorkerRunner } from "../types.js";
import type { RunStore } from "../orchestrator/store.js";
import { seedIteration0, type SeedOptions } from "./cold-start.js";
import { lockGlobalTheme, type ProposedTheme } from "./theme-pass.js";
import { lockSharedAtoms, type ProposedAtoms } from "./atom-pass.js";

export interface LockTiersInput {
  runner: WorkerRunner;
  store: RunStore;
  runId: number;
  seed: SeedOptions;
  /** Frozen target screenshot paths (from captureTarget). */
  targetScreenshots: string[];
  model?: string;
}

export interface LockTiersResult {
  profile: BusinessProfile;
  theme: ProposedTheme;
  atoms: ProposedAtoms;
}

export async function lockTiers(input: LockTiersInput): Promise<LockTiersResult> {
  // Phase 0 — seed iteration 0
  const seeded = await seedIteration0(input.seed);

  // Phase A — lock global theme
  const themeRes = await lockGlobalTheme({
    runner: input.runner,
    profile: seeded,
    targetScreenshots: input.targetScreenshots,
    model: input.model,
  });
  await input.store.updateRun(input.runId, { themeLocked: true });

  // Phase A.5 — lock shared atoms
  const atomRes = await lockSharedAtoms({
    runner: input.runner,
    profile: themeRes.profile,
    targetScreenshots: input.targetScreenshots,
    model: input.model,
  });
  await input.store.updateRun(input.runId, { atomsLocked: true });

  return { profile: atomRes.profile, theme: themeRes.theme, atoms: atomRes.atoms };
}
