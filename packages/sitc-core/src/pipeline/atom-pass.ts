/**
 * Phase A.5 — shared-atom pass (DESIGN §5.1b).
 *
 * Between global tokens and whole sections sits the atom tier: a target's
 * distinctive button/card/badge treatment is shared by every section, so it's
 * resolved once and locked before per-section work. Per-section workers then
 * consume the locked atoms (they may CHOOSE a variant, never redefine one).
 *
 * Phase 3 scope: lock the JSON/token-expressible atom decisions (corner radius,
 * badge variant). Authoring NEW atom component variants is codegen, deferred to
 * the per-section phases under the additive sandbox (§15).
 */
import type { BusinessProfile, WorkerRunner } from "../types.js";
import { validateProfile } from "../steps/validate.js";

export interface ProposedAtoms {
  /** Small radius used by buttons/cards/inputs. */
  controlRadius: string;
  badgeVariant: "accent" | "outline" | "solid" | "soft";
  buttonFill: "solid" | "outline" | "ghost";
  cardElevation: "flat" | "raised" | "bordered";
  notes?: string;
}

export interface LockSharedAtomsInput {
  runner: WorkerRunner;
  profile: BusinessProfile;
  targetScreenshots: string[];
  model?: string;
}

export interface LockSharedAtomsResult {
  profile: BusinessProfile;
  atoms: ProposedAtoms;
}

async function proposeAtoms(runner: WorkerRunner, screenshots: string[], model?: string): Promise<ProposedAtoms> {
  const prompt = `From the website screenshot(s), describe the SHARED ATOM treatment used across sections.
Output NOTHING except one JSON object:
{"controlRadius":"<e.g. 6px|12px|9999px>","badgeVariant":"accent"|"outline"|"solid"|"soft","buttonFill":"solid"|"outline"|"ghost","cardElevation":"flat"|"raised"|"bordered","notes":"<short>"}`;
  return runner.runJson<ProposedAtoms>(prompt, { images: screenshots, allowedTools: ["Read"], model });
}

/**
 * Apply only SCHEMA-VALID atom tokens to the profile (`ui.radiusSm`). The
 * richer atom decisions (buttonFill, cardElevation, badgeVariant) are NOT forced
 * into the profile schema — they flow to per-section workers via the authoring
 * kit (returned in `atoms`), so the locked profile stays valid.
 */
function applyAtoms(profile: BusinessProfile, a: ProposedAtoms): BusinessProfile {
  const next = structuredClone(profile) as any;
  const theme = (next.theme = next.theme ?? {});
  theme.ui = { ...(theme.ui ?? {}), radiusSm: a.controlRadius };
  return next as BusinessProfile;
}

export async function lockSharedAtoms(input: LockSharedAtomsInput): Promise<LockSharedAtomsResult> {
  const atoms = await proposeAtoms(input.runner, input.targetScreenshots, input.model);
  const candidate = applyAtoms(input.profile, atoms);
  const before = validateProfile(input.profile);
  const after = validateProfile(candidate);
  const profile = !after.valid && before.valid ? input.profile : candidate;
  return { profile, atoms };
}
