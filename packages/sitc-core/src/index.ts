/**
 * @mshorizon/sitc-core — Self-Improving Template Creator, shared engine.
 *
 * The composable steps that BOTH the one-shot `clone-template` skill and the
 * convergence loop build on (DESIGN §4.5). Status: Phase 0 scaffold —
 * deterministic steps implemented; AI-driven steps are typed orchestration over
 * an injected WorkerRunner with v0 prompts (refine + calibrate in Phase 2);
 * seedRunDb is a Phase-1 seam.
 *
 * See features/sitc/{README,DESIGN}.md and ADR-0020.
 */
export * from "./types.js";

// runner substrate
export { createClaudeWorker, parseClaudeUsage } from "./claude-worker.js";
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
export { DIMENSIONS, normalizeFindings, weakestDimension, renderCritique, suggestStrategy } from "./scorer/rubric.js";
export type { Dimension, Severity, Finding, StrategySuggestion } from "./scorer/rubric.js";
export { MOBILE_SCORE, combineBreakpointScores, mobileGuardVerdict } from "./scorer/breakpoints.js";
export type { BreakpointScore, MobileGuardInput, GuardVerdict } from "./scorer/breakpoints.js";
export { captureTarget, summarizeBandImages } from "./scorer/capture.js";
export type { CaptureTargetOptions, CaptureResult, BandImage, StyleProfile } from "./scorer/capture.js";
export { runCalibration } from "./scorer/calibration.js";
export type { CalibrationTriple, CalibrationReport, CalibrationItemResult } from "./scorer/calibration.js";
export { generateSubtleTriples, shiftHex, colorPerturbation, pxPerturbation } from "./scorer/calibration-gen.js";
export type { PerturbationSpec, GenerateTriplesOptions } from "./scorer/calibration-gen.js";
export { judgeHealthGate, checkJudgeHealth, calibrationRowsFromReport, InMemoryJudgeCalibrationStore, DEFAULT_JUDGE_HEALTH } from "./scorer/judge-health.js";
export type { JudgeHealthThresholds, JudgeHealthResult, JudgeCalibrationStore, CalibrationRow, JudgeHealthCheck } from "./scorer/judge-health.js";

// ─── pipeline: cold start + tier locking (Phase 3) ───────────────────────────
export { seedIteration0 } from "./pipeline/cold-start.js";
export type { SeedOptions } from "./pipeline/cold-start.js";
export { lockGlobalTheme } from "./pipeline/theme-pass.js";
export type { LockGlobalThemeInput, LockGlobalThemeResult, ProposedTheme } from "./pipeline/theme-pass.js";
export { lockSharedAtoms } from "./pipeline/atom-pass.js";
export type { LockSharedAtomsInput, LockSharedAtomsResult, ProposedAtoms } from "./pipeline/atom-pass.js";
export { lockTiers } from "./pipeline/lock-tiers.js";
export type { LockTiersInput, LockTiersResult } from "./pipeline/lock-tiers.js";
export { runFull, startLeaseHeartbeat } from "./pipeline/run.js";
export type { FullRunInput, FullRunResult, RunMetrics } from "./pipeline/run.js";

// ─── loop: per-section sweep (Phase 4) ───────────────────────────────────────
export { checkAllowlist } from "./loop/allowlist.js";
export type { AllowlistResult } from "./loop/allowlist.js";
export { sanityGate } from "./loop/sanity.js";
export type { SanityCheck, SanityInput, SanityResult } from "./loop/sanity.js";
export { STRATEGY_LADDER, STRATEGY_COST, forcesReview, nextStrategy, ladderExhausted } from "./loop/strategy.js";
export { pickNext, gap, inPlay, allSettled, dispatchesOf, isCovered, coverageMet } from "./loop/scheduler.js";
export type { SectionState, PickOptions } from "./loop/scheduler.js";
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
export { WorktreePool } from "./orchestrator/worktree-pool.js";
export type { WorktreeLease } from "./orchestrator/worktree-pool.js";
export { createMutateCollaborator } from "./loop/mutate-collaborator.js";
export type { MutateCollaboratorOptions } from "./loop/mutate-collaborator.js";

// ─── learning: semantic lessons store (Phase 6) ──────────────────────────────
export { SITC_EMBED_DIM } from "./learning/dims.js";
export { cosineSimilarity, hashingEmbedder, commandEmbedder, defaultEmbedder, probeEmbedder } from "./learning/embed.js";
export type { EmbedFn, CommandEmbedderOptions, EmbedProbe } from "./learning/embed.js";
export { computeConfidence, shouldArchive, CONFIDENCE_FLOOR } from "./learning/confidence.js";
export type { ConfidenceInput } from "./learning/confidence.js";
export { InMemoryLessonStore } from "./learning/lesson-store.js";
export type { LessonStore, LessonRecord, NewLesson } from "./learning/lesson-store.js";
export { retrieveLessons, lessonsToPromptBlock } from "./learning/retrieval.js";
export type { RetrievalQuery, RetrievedLesson } from "./learning/retrieval.js";
export { distillLessons, dedupeLessons, serializeHistory } from "./learning/distill.js";
export type { IterationDatum, DistilledLesson, DistillInput, DedupeResult } from "./learning/distill.js";
export { createLessonWritePath, traitTagsFromStyle, sampleHistory, TRAIT_VOCAB } from "./learning/write-path.js";
export type { LessonWritePath, LessonWritePathOpts, DistillOutcome } from "./learning/write-path.js";
export { renderLessonsDigest } from "./learning/digest.js";
export type { DigestOptions } from "./learning/digest.js";

// ─── experiment: lessons-on vs lessons-off A/B (tasks I1 / §18-G) ────────────
export { compareLessonsAb, renderAbReport, toArmMetrics } from "./experiment/lessons-ab.js";
export type { Arm, ArmMetrics, SectionDelta, Verdict, AbComparison, CompareOptions } from "./experiment/lessons-ab.js";

// ─── cost estimate (Phase 7 / §18-H) ─────────────────────────────────────────
export { estimateRunCost, DEFAULT_COST_MODEL } from "./cost.js";
export type { CostModel, EstimateInput, CostEstimate } from "./cost.js";
export { CostMeter, runCostRoi, cacheReadShareByLabel } from "./cost-meter.js";
export type { CallUsage, CostSnapshot, RunCostRoi } from "./cost-meter.js";

// ─── delivery: budget + gates + routing (Phase 8) ────────────────────────────
export { budgetExceeded } from "./delivery/budget.js";
export type { BudgetCaps, BudgetSpent, BudgetCheck } from "./delivery/budget.js";
export { isAdditiveSchemaChange } from "./delivery/schema-additive.js";
export type { AdditiveResult } from "./delivery/schema-additive.js";
export { regressionGate, acceptanceGate } from "./delivery/gates.js";
export type { GateResult, RegressionChecks, RegressionInput, AcceptanceChecks } from "./delivery/gates.js";
export { createSanityChecks, createRegressionChecks, createAcceptanceChecks, diffA11yViolations, diffHygiene, normalizeConsoleError } from "./delivery/checks.js";
export type {
  CmdResult,
  SanityToolchainOptions,
  RegressionToolchainOptions,
  AcceptanceToolchainOptions,
  PerfBudgets,
  A11yViolation,
  HygieneProbe,
} from "./delivery/checks.js";
export { decideDelivery, mergeRunToDevelop, landDelivery, ghOpenPr } from "./delivery/delivery.js";
export type { DeliveryDecision, DeliveryInput, DeliveryRouting, MergeOptions, LandingOptions, LandingResult } from "./delivery/delivery.js";
export { listExistingTemplates, createExistingTemplatesSsim, createRealExistingSsim } from "./delivery/existing-ssim.js";
export type { ExistingTemplate, ExistingSsimDeps, ExistingSsimOptions, RealExistingSsimOptions } from "./delivery/existing-ssim.js";
export { resolveAcceptanceTarget, buildAndServePreview } from "./delivery/preview-server.js";
export type { AcceptanceTarget, AcceptanceTargetEnv, PreviewServer, PreviewServerOptions } from "./delivery/preview-server.js";
