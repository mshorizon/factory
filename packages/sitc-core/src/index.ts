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
