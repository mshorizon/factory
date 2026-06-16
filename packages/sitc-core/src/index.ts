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
export { segmentTarget, normalizeBands } from "./steps/segment.js";
export type { SegmentOptions } from "./steps/segment.js";
export { mapSection } from "./steps/map-section.js";
export type { MapDecision } from "./steps/map-section.js";
export { authorVariant } from "./steps/author-variant.js";
export type { AuthorVariantInput } from "./steps/author-variant.js";

// target ingestion: crop bands + align to our sections (DESIGN §4.3)
export { cropBands } from "./steps/crop-bands.js";
export type { CroppedBand, CropBandsOptions } from "./steps/crop-bands.js";
export { alignSections, targetImageMap, newSectionCandidates } from "./steps/align-sections.js";
export type { OurSection } from "./steps/align-sections.js";

// run-scoped DB seed (DESIGN §13.2)
export { seedRunDb } from "./steps/seed-run-db.js";
export type { SeedRunDbOptions, RunDbSeedFn } from "./steps/seed-run-db.js";

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
export { runFull } from "./pipeline/run.js";
export type { FullRunInput, FullRunResult } from "./pipeline/run.js";

// ─── loop: per-section sweep (Phase 4) ───────────────────────────────────────
export { checkAllowlist } from "./loop/allowlist.js";
export type { AllowlistResult } from "./loop/allowlist.js";
export { sanityGate } from "./loop/sanity.js";
export type { SanityCheck, SanityInput, SanityResult } from "./loop/sanity.js";
export { STRATEGY_LADDER, STRATEGY_COST, forcesReview, nextStrategy, ladderExhausted } from "./loop/strategy.js";
export { pickNext, gap, inPlay, allSettled } from "./loop/scheduler.js";
export type { SectionState } from "./loop/scheduler.js";
export { runSectionIteration, createMutex } from "./loop/section-iteration.js";
export type {
  SectionCollaborators,
  SectionIterationInput,
  SectionIterationResult,
  SectionOutcome,
  Mutex,
} from "./loop/section-iteration.js";
export { runSweep } from "./loop/sweep.js";
export type { SweepInput, SweepResult } from "./loop/sweep.js";
export { createMutateCollaborator } from "./loop/mutate-collaborator.js";
export type { MutateCollaboratorOptions } from "./loop/mutate-collaborator.js";

// ─── learning: semantic lessons store (Phase 6) ──────────────────────────────
export { SITC_EMBED_DIM } from "./learning/dims.js";
export { cosineSimilarity, hashingEmbedder, commandEmbedder, defaultEmbedder } from "./learning/embed.js";
export type { EmbedFn } from "./learning/embed.js";
export { computeConfidence, shouldArchive, CONFIDENCE_FLOOR } from "./learning/confidence.js";
export type { ConfidenceInput } from "./learning/confidence.js";
export { InMemoryLessonStore } from "./learning/lesson-store.js";
export type { LessonStore, LessonRecord, NewLesson } from "./learning/lesson-store.js";
export { retrieveLessons, lessonsToPromptBlock } from "./learning/retrieval.js";
export type { RetrievalQuery, RetrievedLesson } from "./learning/retrieval.js";
export { distillLessons, dedupeLessons } from "./learning/distill.js";
export type { IterationDatum, DistilledLesson, DistillInput, DedupeResult } from "./learning/distill.js";
export { renderLessonsDigest } from "./learning/digest.js";
export type { DigestOptions } from "./learning/digest.js";

// ─── cost estimate (Phase 7 / §18-H) ─────────────────────────────────────────
export { estimateRunCost, DEFAULT_COST_MODEL } from "./cost.js";
export type { CostModel, EstimateInput, CostEstimate } from "./cost.js";

// ─── delivery: budget + gates + routing (Phase 8) ────────────────────────────
export { budgetExceeded } from "./delivery/budget.js";
export type { BudgetCaps, BudgetSpent, BudgetCheck } from "./delivery/budget.js";
export { isAdditiveSchemaChange } from "./delivery/schema-additive.js";
export type { AdditiveResult } from "./delivery/schema-additive.js";
export { regressionGate, acceptanceGate } from "./delivery/gates.js";
export type { GateResult, RegressionChecks, RegressionInput, AcceptanceChecks } from "./delivery/gates.js";
export { decideDelivery, mergeRunToDevelop } from "./delivery/delivery.js";
export type { DeliveryDecision, DeliveryInput, DeliveryRouting, MergeOptions } from "./delivery/delivery.js";
