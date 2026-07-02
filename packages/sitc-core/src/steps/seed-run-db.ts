/**
 * seedRunDb — seed the isolated, run-scoped render DB (DESIGN §13.2).
 *
 * The working profile is validated against the schema, then handed to an
 * INJECTED seed function so sitc-core never imports a pg driver and the
 * orchestrator controls which server/credentials are used (§13.1). The prod
 * adapter in @mshorizon/db wires this to `initDb(runDbUrl)` + `upsertSiteConfig`.
 *
 * Provisioning (CREATE/DROP DATABASE) is handled separately by
 * orchestrator/run-db.ts and is gated on an explicit operator run.
 */
import type { BusinessProfile } from "../types.js";
import { validateProfile } from "./validate.js";

/** How the working profile is persisted into the run DB. Injected by the caller. */
export type RunDbSeedFn = (args: {
  runDbUrl: string;
  businessId: string;
  profile: BusinessProfile;
}) => Promise<void>;

export interface SeedRunDbOptions {
  /** Connection string for the isolated run DB (NOT the shared dev DB). */
  runDbUrl: string;
  /** Subdomain / template id the profile is stored under. */
  businessId: string;
  profile: BusinessProfile;
  /** Persists the profile into the run DB (e.g. db.upsertSiteConfig). */
  seed: RunDbSeedFn;
  /** Skip schema validation (caller already validated). Default false. */
  skipValidate?: boolean;
}

export async function seedRunDb(opts: SeedRunDbOptions): Promise<void> {
  if (!opts.runDbUrl) throw new Error("seedRunDb: runDbUrl is required");
  if (!opts.businessId) throw new Error("seedRunDb: businessId is required");

  if (!opts.skipValidate) {
    const res = validateProfile(opts.profile);
    if (!res.valid) {
      const detail = res.errors.map((e) => `${e.instancePath} ${e.message ?? ""}`.trim()).join("; ");
      throw new Error(`seedRunDb: profile failed schema validation — ${detail}`);
    }
  }

  await opts.seed({ runDbUrl: opts.runDbUrl, businessId: opts.businessId, profile: opts.profile });
}
