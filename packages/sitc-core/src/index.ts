/**
 * @mshorizon/sitc-core — Self-Improving Template Creator, shared engine.
 *
 * The composable steps that BOTH the one-shot `clone-template` skill and the
 * convergence loop build on (DESIGN §4.5). Status: Phase 0 scaffold —
 * deterministic steps implemented; AI-driven steps are typed orchestration over
 * an injected WorkerRunner with v0 prompts (refine + calibrate in Phase 2);
 * seedRunDb is a Phase-1 seam.
 *
 * See features/self-improving-template-creator/{README,DESIGN}.md and ADR-0020.
 */
export * from "./types.js";

// runner substrate
export { createClaudeWorker } from "./claude-worker.js";
export type { ClaudeWorkerConfig } from "./claude-worker.js";

// deterministic steps
export { validateProfile } from "./steps/validate.js";
export {
  renderSection,
  HARNESS_ROUTE,
  DESKTOP_SCORE,
  MOBILE_GUARD,
} from "./steps/render.js";
export type { RenderSectionOptions } from "./steps/render.js";
export { assembleAuthoringKit } from "./steps/authoring-kit.js";
export type { AssembleKitOptions } from "./steps/authoring-kit.js";

// AI-driven steps (v0 scaffolds)
export { analyzeTarget } from "./steps/analyze-target.js";
export { segmentTarget } from "./steps/segment.js";
export { mapSection } from "./steps/map-section.js";
export type { MapDecision } from "./steps/map-section.js";
export { authorVariant } from "./steps/author-variant.js";
export type { AuthorVariantInput } from "./steps/author-variant.js";

// phase-1 seam
export { seedRunDb } from "./steps/seed-run-db.js";
export type { SeedRunDbOptions } from "./steps/seed-run-db.js";

// ─── orchestrator (Phase 1) ──────────────────────────────────────────────────
export {
  RUN_STATUSES,
  TERMINAL_STATUSES,
  isTerminal,
  canTransition,
  assertTransition,
  applyEvent,
} from "./orchestrator/state-machine.js";
export type { RunStatus, RunEvent } from "./orchestrator/state-machine.js";

export { WorktreeManager } from "./orchestrator/worktree.js";
export type { WorktreeManagerOptions } from "./orchestrator/worktree.js";

export { InMemoryRunStore } from "./orchestrator/store.js";
export type {
  RunStore,
  RunRecord,
  CreateRunInput,
  IterationRecord,
  CommandRecord,
  SectionScoreInput,
  ChampionInput,
} from "./orchestrator/store.js";

export { Orchestrator } from "./orchestrator/orchestrator.js";
export type {
  OrchestratorOptions,
  SectionWorker,
  IterationContext,
  IterationResult,
  RunOutcome,
} from "./orchestrator/orchestrator.js";

export { runDbName, runDbUrl, provisionRunDb, dropRunDb } from "./orchestrator/run-db.js";
export type { SqlExec } from "./orchestrator/run-db.js";

export { sweepOrphans } from "./orchestrator/orphan-gc.js";
export type { SweepOptions, SweepReport } from "./orchestrator/orphan-gc.js";

// ─── scorer (Phase 2) ────────────────────────────────────────────────────────
export { pairwiseJudge } from "./scorer/pairwise.js";
export type { PairwiseResult, PairwiseInput, PairwiseWinner } from "./scorer/pairwise.js";
export { vlmScore } from "./scorer/vlm.js";
export type { VlmScore } from "./scorer/vlm.js";
export { pixelScore } from "./scorer/pixel.js";
export type { PixelScore } from "./scorer/pixel.js";
export { scoreSection } from "./scorer/score.js";
export type { HybridScore, ScoreSectionInput } from "./scorer/score.js";
export { captureTarget } from "./scorer/capture.js";
export type { CaptureTargetOptions, CaptureResult } from "./scorer/capture.js";
export { runCalibration } from "./scorer/calibration.js";
export type { CalibrationTriple, CalibrationReport, CalibrationItemResult } from "./scorer/calibration.js";

// ─── pipeline: cold start + tier locking (Phase 3) ───────────────────────────
export { seedIteration0 } from "./pipeline/cold-start.js";
export type { SeedOptions } from "./pipeline/cold-start.js";
export { lockGlobalTheme } from "./pipeline/theme-pass.js";
export type { LockGlobalThemeInput, LockGlobalThemeResult, ProposedTheme } from "./pipeline/theme-pass.js";
export { lockSharedAtoms } from "./pipeline/atom-pass.js";
export type { LockSharedAtomsInput, LockSharedAtomsResult, ProposedAtoms } from "./pipeline/atom-pass.js";
export { lockTiers } from "./pipeline/lock-tiers.js";
export type { LockTiersInput, LockTiersResult } from "./pipeline/lock-tiers.js";
