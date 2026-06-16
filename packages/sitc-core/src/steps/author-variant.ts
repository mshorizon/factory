/**
 * authorVariant — the per-section generative worker (DESIGN §5.2 / §6).
 *
 * Mutates the section (JSON and/or component code) toward the target, inside an
 * isolated worktree, then returns a structured verdict (§4.2). The worker is
 * given the *warm authoring kit* (existing variant sources, dispatch wiring,
 * schema slice, locked tokens) surfaced directly in the prompt so it authors
 * instead of exploring, plus the per-strategy write boundary so it never even
 * attempts an edit the sanity gate would reject.
 *
 * Trust model: this returns the worker's self-reported verdict, but the loop
 * (section-iteration.ts) derives the *authoritative* changedFiles from the git
 * diff and re-checks them against the allowlist in the SANITY gate. The verdict
 * is steering signal (summary/risks/selfAssessment), never a security boundary.
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
  /** Retrieved lessons block (DESIGN §9.2) — advisory hints, not rules. */
  lessons?: string;
  /** Isolated git worktree the worker may write in (DESIGN §5.4). */
  workdir: string;
  model?: string;
  /** Max chars of a single source file to inline before truncating. */
  maxSourceChars?: number;
}

const HARD_RULES = `HARD RULES (a violation FAILS the sanity gate and the attempt is discarded — DESIGN §12/§15):
- Additive only: introduce NEW variant names / NEW optional fields. NEVER change an existing variant's behavior or an existing field's meaning.
- Semantic theme tokens ONLY — no hardcoded colors (e.g. bg-blue-500) or hardcoded spacing (e.g. py-40). Use bg-primary / text-foreground / py-spacing-* etc.
- Consume the LOCKED theme/atom tokens below as-is; never redefine them.
- packages/ui must NEVER import from apps/engine, and you must NEVER add a dependency (no package.json edits).`;

/**
 * Per-strategy guidance, coarsest→riskiest (DESIGN §6). Each entry states the
 * intent AND the exact write boundary the sanity gate enforces for that
 * strategy (mirrors loop/allowlist.ts), so the worker stays in-bounds.
 */
const STRATEGY_GUIDE: Record<MutationStrategy, { intent: string; writeBoundary: string }> = {
  "tune-json": {
    intent:
      "Cheapest move FIRST: change ONLY the section's content/props in the template JSON — swap an existing variant, adjust copy, image refs, ordering, or token-driven props. Do NOT touch any component code. If the gap genuinely cannot be closed by JSON alone, do nothing and say so in the verdict (a higher strategy will be tried).",
    writeBoundary: "You may edit ONLY: templates/<name>/<name>.json",
  },
  "extend-variant": {
    intent:
      "Extend an EXISTING variant component with new OPTIONAL, token-driven props (defaulting to current behavior), then use them from the template JSON. Existing usages must render identically when the new props are absent.",
    writeBoundary:
      "You may edit ONLY: templates/<name>/<name>.json, packages/ui/src/{sections,atoms}/**, and the matching apps/engine/src/components/sections/<Type>Section.astro dispatch branch.",
  },
  "new-variant": {
    intent:
      "Author a NEW variant component (new file) alongside the existing ones, wire it into the <Type>Section.astro dispatch, and select it from the template JSON. Follow the dispatch wiring pattern shown below exactly. Do not modify existing variants.",
    writeBoundary:
      "You may edit ONLY: templates/<name>/<name>.json, packages/ui/src/{sections,atoms}/** (new files preferred), and the matching apps/engine/src/components/sections/<Type>Section.astro dispatch.",
  },
  "new-section": {
    intent:
      "Riskiest, LAST resort: introduce a new section type. This requires an additive schema change, a new section component + dispatch branch, dispatcher registry wiring, and page defaults. Prefer any cheaper strategy if it can close the gap.",
    writeBoundary:
      "You may edit ONLY (all additive): templates/<name>/<name>.json, packages/ui/src/{sections,atoms}/**, apps/engine/src/components/sections/<Type>Section.astro, apps/engine/src/components/SectionDispatcher.astro, apps/engine/src/lib/pages.ts, and packages/schema/src/business.schema.json.",
  },
};

function truncate(src: string, max: number): string {
  if (src.length <= max) return src;
  return `${src.slice(0, max)}\n/* …truncated (${src.length - max} more chars) — open the file to see the rest… */`;
}

/** Render the authoring kit as prompt context so the worker doesn't explore. */
function renderKit(kit: AuthoringKit, maxChars: number): string {
  const variantBlocks = Object.entries(kit.existingVariants)
    .map(([name, src]) => `### Existing variant: ${name}\n\`\`\`tsx\n${truncate(src, maxChars)}\n\`\`\``)
    .join("\n\n");

  const parts = [
    `## Authoring kit for section "${kit.sectionType}"`,
    `Available variants: ${kit.availableVariants.join(", ") || "(none yet)"}`,
    variantBlocks || "_(no existing variant components on disk)_",
    kit.dispatchSource
      ? `### Dispatch wiring to follow (<Type>Section.astro)\n\`\`\`astro\n${truncate(kit.dispatchSource, maxChars)}\n\`\`\``
      : "",
    `### Section JSON-schema slice (additive edits target this)\n\`\`\`json\n${truncate(JSON.stringify(kit.schemaSlice ?? null, null, 2), maxChars)}\n\`\`\``,
    `### Locked theme/atom tokens — consume as-is, never redefine (DESIGN §5.1)\n\`\`\`json\n${truncate(JSON.stringify(kit.lockedTokens ?? {}, null, 2), maxChars)}\n\`\`\``,
  ].filter(Boolean);

  return parts.join("\n\n");
}

/** Coerce arbitrary model output into a well-formed verdict (defensive). */
function normalizeVerdict(raw: unknown, kit: AuthoringKit, strategy: MutationStrategy): WorkerVerdict {
  const v = (raw ?? {}) as Partial<WorkerVerdict>;
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);
  const self = typeof v.selfAssessment === "number" && v.selfAssessment >= 0 && v.selfAssessment <= 1 ? v.selfAssessment : 0;
  return {
    sectionId: typeof v.sectionId === "string" && v.sectionId ? v.sectionId : kit.sectionType,
    strategy: (v.strategy as MutationStrategy) ?? strategy,
    changedFiles: arr(v.changedFiles),
    newVariantNames: arr(v.newVariantNames),
    summary: typeof v.summary === "string" ? v.summary : "",
    selfAssessment: self,
    risks: arr(v.risks),
  };
}

export async function authorVariant(
  runner: WorkerRunner,
  input: AuthorVariantInput,
): Promise<WorkerVerdict> {
  const { kit, strategy } = input;
  const guide = STRATEGY_GUIDE[strategy];
  const maxChars = input.maxSourceChars ?? 6000;

  const prompt = [
    `You are improving the "${kit.sectionType}" section of a website so it matches a TARGET design as closely as possible.`,
    `Strategy for THIS attempt: ${strategy}.`,
    `Intent: ${guide.intent}`,
    `Write boundary: ${guide.writeBoundary}`,
    "",
    `You have the TARGET screenshot${input.currentImage ? " and the CURRENT render of our section" : ""} (read them with the Read tool first). Make our section converge toward the target.`,
    input.critique ? `\nScorer critique to address this attempt:\n${input.critique}` : "",
    input.lessons ? `\n${input.lessons}` : "",
    "",
    renderKit(kit, maxChars),
    "",
    HARD_RULES,
    "",
    `Do the work NOW, in this order:`,
    `1. Read the target screenshot${input.currentImage ? " and the current render" : ""} with the Read tool.`,
    `2. ACTUALLY EDIT the files with the Edit/Write tools to move the "${kit.sectionType}" section toward the target. You MUST make real on-disk edits — describing or planning changes without writing them is a FAILURE. Apply at least one concrete change unless the section already matches the target, in which case make no edits.`,
    `3. ONLY after the edits are written, output your final line: ONE JSON object and nothing after it.`,
    `The JSON (its changedFiles will be cross-checked against the actual git diff — a claim with no matching edit is treated as no-op):`,
    `{"sectionId":"${kit.sectionType}","strategy":"${strategy}","changedFiles":["relative/path",...],"newVariantNames":[...],"summary":"<one line>","selfAssessment":0.0,"risks":[...]}`,
  ].join("\n");

  const raw = await runner.runJson<unknown>(prompt, {
    images: [input.targetImage, ...(input.currentImage ? [input.currentImage] : [])],
    // Grep/Glob let the worker locate EXACT strings in large template/component
    // files before editing — without them, Edit's old_string never matches a
    // 100KB+ JSON and the worker silently narrates edits it can't apply.
    allowedTools: ["Read", "Edit", "Write", "Grep", "Glob"],
    workdir: input.workdir,
    model: input.model,
  });

  return normalizeVerdict(raw, kit, strategy);
}
