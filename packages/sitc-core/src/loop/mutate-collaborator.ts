/**
 * createMutateCollaborator — wires the generative core into the loop (DESIGN §5.2).
 *
 * The sweep's `SectionCollaborators.mutate(ctx)` seam is intentionally thin
 * ({worktreePath, sectionId, strategy, critique}). This factory closes over the
 * pieces the real worker needs — repo root, the WorkerRunner, the locked tokens,
 * and per-section target/current image resolvers — and produces a `mutate`
 * implementation that, per attempt:
 *   1. assembles the warm authoring kit for the section (from the worktree),
 *   2. retrieves advisory lessons (optional),
 *   3. calls authorVariant() to edit the worktree toward the target,
 *   4. returns {changedFiles, summary} for the iteration to commit + sanity-check.
 *
 * Note: changedFiles here is the worker's self-report; the loop re-derives the
 * authoritative set from the git diff and enforces the allowlist in SANITY.
 */
import type { MutationStrategy, Theme, WorkerRunner } from "../types.js";
import { assembleAuthoringKit } from "../steps/authoring-kit.js";
import { authorVariant } from "../steps/author-variant.js";
import type { SectionCollaborators } from "./section-iteration.js";

export interface MutateCollaboratorOptions {
  /** Absolute monorepo root (the worker writes inside the per-worker worktree). */
  repoRoot: string;
  runner: WorkerRunner;
  /** Locked theme/atom tokens the worker must consume as-is (DESIGN §5.1). */
  lockedTokens?: Partial<Theme> & Record<string, unknown>;
  /** Resolve the aligned target band screenshot for a section. */
  targetImageFor: (sectionId: string) => string;
  /** Resolve the current champion render for a section (null on first attempt). */
  currentImageFor?: (sectionId: string) => string | null;
  /** Build an advisory lessons block for this section+critique (DESIGN §9.2). */
  lessonsFor?: (ctx: { sectionId: string; strategy: MutationStrategy; critique?: string }) => Promise<string> | string;
  /**
   * Map a (possibly unique) sectionId to the bare engine section TYPE used to
   * locate component sources, e.g. "hero#0" → "hero". Defaults to identity —
   * set it when sectionIds are disambiguated with a suffix.
   */
  sectionTypeFor?: (sectionId: string) => string;
  model?: string;
  maxSourceChars?: number;
}

/**
 * Build the `mutate` collaborator. Assembles the kit from the worktree path the
 * iteration provides (so the worker sees the run's evolving state, not develop).
 */
export function createMutateCollaborator(opts: MutateCollaboratorOptions): SectionCollaborators["mutate"] {
  return async (ctx) => {
    const sectionType = opts.sectionTypeFor ? opts.sectionTypeFor(ctx.sectionId) : ctx.sectionId;
    const kit = await assembleAuthoringKit({
      repoRoot: ctx.worktreePath,
      sectionType,
      lockedTokens: opts.lockedTokens,
    });

    const lessons = opts.lessonsFor
      ? await opts.lessonsFor({ sectionId: ctx.sectionId, strategy: ctx.strategy, critique: ctx.critique })
      : undefined;

    const verdict = await authorVariant(opts.runner, {
      kit,
      strategy: ctx.strategy,
      targetImage: opts.targetImageFor(ctx.sectionId),
      currentImage: opts.currentImageFor?.(ctx.sectionId) ?? undefined,
      critique: ctx.critique,
      lessons: lessons || undefined,
      workdir: ctx.worktreePath,
      model: opts.model,
      maxSourceChars: opts.maxSourceChars,
    });

    return { changedFiles: verdict.changedFiles, summary: verdict.summary };
  };
}
