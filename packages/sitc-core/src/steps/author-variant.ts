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

/** Phase-1 output: a concrete, groundable edit plan (DESIGN §5.2). */
interface EditPlan {
  /** False iff the section already matches OR this strategy genuinely can't help. */
  feasible: boolean;
  summary: string;
  /** Concrete edits — each names a file and a precise, exact-string-level instruction. */
  edits: { file: string; instruction: string }[];
  newVariantNames?: string[];
  risks?: string[];
}

function normalizePlan(raw: unknown): EditPlan {
  const v = (raw ?? {}) as Partial<EditPlan>;
  const edits = Array.isArray(v.edits)
    ? v.edits.filter((e): e is { file: string; instruction: string } => !!e && typeof e.file === "string" && typeof e.instruction === "string")
    : [];
  return {
    feasible: v.feasible !== false && edits.length > 0,
    summary: typeof v.summary === "string" ? v.summary : "",
    edits,
    newVariantNames: Array.isArray(v.newVariantNames) ? v.newVariantNames.filter((s): s is string => typeof s === "string") : [],
    risks: Array.isArray(v.risks) ? v.risks.filter((s): s is string => typeof s === "string") : [],
  };
}

/**
 * Two-phase worker (DESIGN §5.2):
 *   1. ANALYZE — read the target (+ current render) and the kit, produce a
 *      concrete, file-grounded edit PLAN. Read-only, vision — what the model is
 *      reliably good at. feasible:false ⇒ no actionable change (the loop escalates).
 *   2. APPLY — a directive "make exactly these edits" pass with Edit/Bash/Grep —
 *      the mechanical mode that reliably lands on-disk edits.
 * Decoupling "decide" from "do" fixes the failure where a single open-ended
 * prompt analyzes the target then narrates instead of editing. The loop reads
 * the AUTHORITATIVE changedFiles from the git diff, so the returned verdict is
 * advisory and a parse failure in either phase degrades to a safe no-op.
 */
export async function authorVariant(
  runner: WorkerRunner,
  input: AuthorVariantInput,
): Promise<WorkerVerdict> {
  const { kit, strategy } = input;
  const guide = STRATEGY_GUIDE[strategy];
  const maxChars = input.maxSourceChars ?? 6000;
  const images = [input.targetImage, ...(input.currentImage ? [input.currentImage] : [])];

  // ── Phase 1: ANALYZE → plan ────────────────────────────────────────────────
  const planPrompt = [
    `You are planning how to improve the "${kit.sectionType}" section of a website toward a TARGET design.`,
    `Strategy for THIS attempt: ${strategy}.`,
    `Intent: ${guide.intent}`,
    `Write boundary: ${guide.writeBoundary}`,
    "",
    `Read the TARGET screenshot${input.currentImage ? " and the CURRENT render" : ""} (Read tool), and use Grep/Read to ground your plan in the ACTUAL file contents (find the exact current values you'd change).`,
    input.critique ? `\nScorer critique to address:\n${input.critique}` : "",
    input.lessons ? `\n${input.lessons}` : "",
    "",
    renderKit(kit, maxChars),
    "",
    HARD_RULES,
    "",
    `Produce the SMALLEST set of concrete edits that move our section toward the target under this strategy. Each edit must name a file and an EXACT, unambiguous instruction (the precise current value/string and what to change it to). Prefer one or two high-impact edits.`,
    `Set feasible:false ONLY if our section already essentially matches the target, OR this strategy genuinely cannot help (a higher strategy will then be tried). Otherwise propose at least one concrete edit.`,
    `Output NOTHING except ONE JSON object on the last line:`,
    `{"feasible":true,"summary":"<one line>","edits":[{"file":"templates/.../x.json","instruction":"in the home services section, change \\"variant\\":\\"grid\\" to \\"ServicesDarkCards\\""}],"newVariantNames":[],"risks":[]}`,
  ].join("\n");

  let plan: EditPlan;
  try {
    plan = normalizePlan(await runner.runJson<unknown>(planPrompt, {
      images,
      allowedTools: ["Read", "Grep", "Glob"],
      workdir: input.workdir,
      model: input.model,
    }));
  } catch (e) {
    return normalizeVerdict({ summary: `plan phase produced no JSON (no-op): ${String(e).slice(0, 90)}` }, kit, strategy);
  }

  if (!plan.feasible || !plan.edits.length) {
    return normalizeVerdict({ summary: plan.summary || "no actionable change under this strategy", risks: plan.risks }, kit, strategy);
  }

  // ── Phase 2: APPLY the plan ─────────────────────────────────────────────────
  const applyPrompt = [
    `Apply the following edit plan to the working tree EXACTLY. Make the real on-disk edits NOW — do not just describe them.`,
    `Use Grep/Read to locate the exact current strings, then Edit/Write to change them. ${guide.writeBoundary}`,
    HARD_RULES,
    "",
    `EDIT PLAN:`,
    ...plan.edits.map((e, i) => `${i + 1}. [${e.file}] ${e.instruction}`),
    plan.newVariantNames?.length ? `New variant(s) to add: ${plan.newVariantNames.join(", ")}` : "",
    "",
    `Make every edit above. When finished, briefly state what you changed (free text — no specific format required).`,
  ].filter(Boolean).join("\n");

  try {
    await runner.run(applyPrompt, {
      allowedTools: ["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
      workdir: input.workdir,
      model: input.model,
    });
  } catch (e) {
    // Apply errored — the loop's git diff still captures any partial edits; just
    // record it. Not fatal.
    return normalizeVerdict({ summary: `apply phase error (git diff is authoritative): ${String(e).slice(0, 90)}`, risks: plan.risks }, kit, strategy);
  }

  return normalizeVerdict({
    summary: plan.summary,
    changedFiles: plan.edits.map((e) => e.file),
    newVariantNames: plan.newVariantNames,
    risks: plan.risks,
    selfAssessment: 0.6,
  }, kit, strategy);
}
