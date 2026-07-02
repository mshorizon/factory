/**
 * sitc-core — shared step contracts.
 *
 * These types define the seams between the composable steps that BOTH the
 * one-shot `clone-template` skill and the convergence loop build on
 * (DESIGN §4.5). Deterministic steps (validate, render, assembleAuthoringKit)
 * are implemented here; AI-driven steps (analyzeTarget, segment, mapSection,
 * authorVariant) are typed orchestration over an injected {@link WorkerRunner}
 * so the package never hard-codes how `claude -p` is invoked.
 */
import type { BusinessProfile, Section, Theme } from "@mshorizon/schema";

export type { BusinessProfile, Section, Theme };

/** Per-section mutation strategies, coarsest→riskiest (DESIGN §6). */
export type MutationStrategy =
  | "tune-json"
  | "extend-variant"
  | "new-variant"
  | "new-section";

/** Viewport the scorer optimizes / guards (DESIGN §4.3). */
export interface Breakpoint {
  label: string;
  width: number;
  height: number;
  /** "score" = optimization target; "guard" = regression-only. */
  role: "score" | "guard";
}

// ─── Target ingestion (DESIGN §4.3) ──────────────────────────────────────────

/** Coarse design traits used to seed lesson retrieval + variant choice. */
export interface DesignTraits {
  mode: "light" | "dark";
  /** e.g. "split", "centered", "minimal", "editorial". */
  layoutFamily: string;
  /** Free-form descriptors: "saas", "luxury", "brutalist", ... */
  descriptors: string[];
  palette: { primary?: string; background?: string; accent?: string };
  typographyFeel?: string;
}

/** One labeled, ordered band of the segmented target page. */
export interface SectionBand {
  index: number;
  /** Best-guess engine section type ("hero", "services", ...). */
  type: string;
  /** Pixel y-range in the full-page target screenshot. */
  yStart: number;
  yEnd: number;
  notes?: string;
}

export interface TargetManifest {
  url: string;
  traits: DesignTraits;
  bands: SectionBand[];
  /** Paths to the frozen, de-noised target screenshots, per breakpoint. */
  screenshots: Record<string, string>;
}

/** Correspondence between a target band and one of our rendered sections. */
export interface AlignmentEntry {
  targetBandIndex: number | null;
  /** Index into the business page's `sections[]`, or null if unmatched. */
  ourSectionIndex: number | null;
  /** "matched" | "target-only" (candidate new-section) | "ours-only". */
  status: "matched" | "target-only" | "ours-only";
}

export type AlignmentMap = AlignmentEntry[];

// ─── Authoring kit (DESIGN §4.2 warm start) ──────────────────────────────────

/** Everything a worker needs to author a section WITHOUT exploring the repo. */
export interface AuthoringKit {
  sectionType: string;
  /** Variant name → source of the existing variant component. */
  existingVariants: Record<string, string>;
  availableVariants: string[];
  /** The `{Type}Section.astro` dispatch source (the wiring pattern to follow). */
  dispatchSource: string;
  /** The JSON-schema slice for this section type (additive edits target this). */
  schemaSlice: unknown;
  /** Locked theme + atom tokens the variant must consume as-is (DESIGN §5.1). */
  lockedTokens: Partial<Theme> & Record<string, unknown>;
}

// ─── Worker verdict (DESIGN §4.2) ────────────────────────────────────────────

export interface WorkerVerdict {
  sectionId: string;
  strategy: MutationStrategy;
  changedFiles: string[];
  /** Additive variant names introduced (empty if none). */
  newVariantNames: string[];
  summary: string;
  /** Worker's own 0..1 guess — advisory only; the scorer is authoritative. */
  selfAssessment: number;
  risks: string[];
}

// ─── Render + validate ───────────────────────────────────────────────────────

export interface RenderResult {
  /** PNG bytes of the isolated section node. */
  png: Buffer;
  box: { width: number; height: number };
  url: string;
  breakpoint: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: { instancePath: string; message?: string }[];
}

// ─── Worker runner (the injected `claude -p` substrate) ───────────────────────

export interface WorkerRunOptions {
  /** Absolute paths to image files the worker should Read (screenshots). */
  images?: string[];
  model?: string;
  /** Tools to pre-authorize (e.g. ["Read"] for vision, ["Read","Edit","Write"] for authoring). */
  allowedTools?: string[];
  cwd?: string;
  /** Worktree the worker mutates in (DESIGN §5.4); defaults to cwd. */
  workdir?: string;
  retries?: number;
}

/**
 * Abstraction over a headless `claude -p` invocation. Injected into AI steps so
 * the orchestrator controls model/env/worktree and so steps are testable.
 */
export interface WorkerRunner {
  /** Run a prompt, return the final text. */
  run(prompt: string, opts?: WorkerRunOptions): Promise<string>;
  /** Run a prompt that must emit one JSON object; parse + return it. */
  runJson<T = unknown>(prompt: string, opts?: WorkerRunOptions): Promise<T>;
}
