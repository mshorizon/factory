/**
 * SANITY gate (DESIGN §5.2a).
 *
 * Runs BEFORE render/score so broken or out-of-bounds challengers revert
 * instantly without burning a render + VLM call:
 *   1. write-allowlist (§15) — non-negotiable, runs first
 *   2. workspace-boundary grep — packages/ui must not import apps/engine
 *   3. build/type-check + schema validate — injected (wrap real toolchain)
 * Returns a structured failure so the orchestrator can feed it back as the
 * worker's next-attempt critique.
 */
import type { MutationStrategy } from "../types.js";
import { checkAllowlist } from "./allowlist.js";

export interface SanityCheck {
  /** Build + type-check the changed files in the worktree. */
  build(worktreePath: string): Promise<{ ok: boolean; output?: string }>;
  /** Schema-validate the touched template JSON(s) in the worktree. */
  validate(worktreePath: string): Promise<{ ok: boolean; output?: string }>;
  /** Grep for forbidden imports (packages/ui → apps/engine). */
  importBoundary(worktreePath: string, changedFiles: string[]): Promise<{ ok: boolean; output?: string }>;
}

export interface SanityInput {
  worktreePath: string;
  changedFiles: string[];
  strategy: MutationStrategy;
  checks: SanityCheck;
  /** Scope template-JSON writes to the run's own template (other templates → violation). */
  templateName?: string;
}

export interface SanityResult {
  ok: boolean;
  stage?: "allowlist" | "import-boundary" | "build" | "validate";
  reason?: string;
}

export async function sanityGate(input: SanityInput): Promise<SanityResult> {
  // 1. allowlist (first, non-negotiable)
  const allow = checkAllowlist(input.changedFiles, input.strategy, { templateName: input.templateName });
  if (!allow.allowed) {
    return { ok: false, stage: "allowlist", reason: `write-allowlist violation: ${allow.violations.join(", ")}` };
  }
  // 2. import boundary
  const imp = await input.checks.importBoundary(input.worktreePath, input.changedFiles);
  if (!imp.ok) return { ok: false, stage: "import-boundary", reason: imp.output ?? "forbidden import" };
  // 3. build/type-check
  const build = await input.checks.build(input.worktreePath);
  if (!build.ok) return { ok: false, stage: "build", reason: build.output ?? "build failed" };
  // 4. schema validate
  const val = await input.checks.validate(input.worktreePath);
  if (!val.ok) return { ok: false, stage: "validate", reason: val.output ?? "schema invalid" };
  return { ok: true };
}
