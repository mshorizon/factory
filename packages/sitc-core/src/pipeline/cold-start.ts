/**
 * Phase 0 — cold start (DESIGN §5.0).
 *
 * The loop never begins on a blank template: iteration 0 is a `clone-template`
 * pass (~70% match) whose output becomes the first champion for every section.
 * This seam returns that starting profile. Until the `clone-template` skill is
 * refactored to call sitc-core directly (it currently runs as a Claude skill),
 * the orchestrator seeds from either a provided profile or the closest existing
 * template file.
 */
import { promises as fs } from "node:fs";
import type { BusinessProfile } from "../types.js";

export interface SeedOptions {
  /** Use this profile as-is (e.g. the output of a clone-template run). */
  baseProfile?: BusinessProfile;
  /** ...or read a template JSON from disk (the "closest template" cold start). */
  templatePath?: string;
}

export async function seedIteration0(opts: SeedOptions): Promise<BusinessProfile> {
  if (opts.baseProfile) return structuredClone(opts.baseProfile);
  if (opts.templatePath) {
    const raw = await fs.readFile(opts.templatePath, "utf8");
    return JSON.parse(raw) as BusinessProfile;
  }
  throw new Error("seedIteration0: provide baseProfile or templatePath");
}
