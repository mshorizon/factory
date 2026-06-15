/**
 * seedRunDb — provision + seed the isolated, run-scoped render DB (DESIGN §13.2).
 *
 * PHASE-1 SEAM. Run-scoped DB provisioning/teardown is Phase 1 work; this typed
 * stub fixes the contract now so the loop and the skill code against it. It will
 * wrap the existing `packages/db` seed against a per-run DATABASE_URL.
 */
import type { BusinessProfile } from "../types.js";

export interface SeedRunDbOptions {
  /** Connection string for the isolated run DB (NOT the shared dev DB). */
  runDbUrl: string;
  profile: BusinessProfile;
}

export async function seedRunDb(_opts: SeedRunDbOptions): Promise<void> {
  throw new Error(
    "seedRunDb: not implemented — Phase 1 seam (run-scoped DB provisioning + seed, DESIGN §13.2)",
  );
}
