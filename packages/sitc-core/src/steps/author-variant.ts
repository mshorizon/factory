/**
 * authorVariant — the per-section worker (DESIGN §5.2 / §6).
 *
 * Mutates the section (JSON and/or component code) toward the target, inside an
 * isolated worktree, then returns a structured verdict (§4.2). The worker is
 * given the warm authoring kit so it authors instead of exploring.
 *
 * v0 scaffold — Phase 2 must: (a) refine the prompt, (b) enforce the write
 * allowlist / sandbox (DESIGN §15) on the worktree diff via the SANITY gate,
 * not just rely on the prompt rules below.
 */
import type {
  AuthoringKit,
  MutationStrategy,
  WorkerRunner,
  WorkerVerdict,
} from "../types.js";

export interface AuthorVariantInput {
  kit: AuthoringKit;
  strategy: MutationStrategy;
  /** Target band screenshot to converge toward. */
  targetImage: string;
  /** Current rendered section screenshot (omit on first attempt). */
  currentImage?: string;
  /** Latest scorer critique — the steering signal. */
  critique?: string;
  /** Isolated git worktree the worker may write in (DESIGN §5.4). */
  workdir: string;
  model?: string;
}

const HARD_RULES = `HARD RULES (a violation fails the sanity gate, DESIGN §12/§15):
- Additive only: new variant names / new optional fields. NEVER change an existing variant's behavior.
- Use semantic theme tokens; no hardcoded colors or spacing.
- Consume locked theme/atom tokens as-is; do not redefine them.
- Write only under packages/ui/src/{sections,atoms}, templates/, packages/schema (additive). NEVER import apps/engine. NEVER add dependencies.`;

export async function authorVariant(
  runner: WorkerRunner,
  input: AuthorVariantInput,
): Promise<WorkerVerdict> {
  const { kit, strategy } = input;
  const prompt = `You are improving the "${kit.sectionType}" section of a website toward a TARGET design using strategy="${strategy}".
Available variants: ${kit.availableVariants.join(", ") || "(none)"}.
You are given the target screenshot${input.currentImage ? " and the current render" : ""}; the authoring kit (existing variant sources, dispatch wiring, schema slice, locked tokens) is available in the working tree.
${input.critique ? `Scorer critique to address: ${input.critique}\n` : ""}${HARD_RULES}

Make the edits in the working tree, then output NOTHING except one JSON verdict:
{"sectionId":"${kit.sectionType}","strategy":"${strategy}","changedFiles":["..."],"newVariantNames":["..."],"summary":"<short>","selfAssessment":0.0,"risks":["..."]}`;

  return runner.runJson<WorkerVerdict>(prompt, {
    images: [input.targetImage, ...(input.currentImage ? [input.currentImage] : [])],
    allowedTools: ["Read", "Edit", "Write"],
    workdir: input.workdir,
    model: input.model,
  });
}
