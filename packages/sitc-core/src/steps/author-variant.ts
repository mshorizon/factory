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
  /** Ground-truth styling measured from the target's computed CSS for THIS section
   *  (exact colors/fonts/radius) — helps the worker pick the right semantic token. */
  targetStyle?: string;
  /** Isolated git worktree the worker may write in (DESIGN §5.4). */
  workdir: string;
  /** The run's template (e.g. "template-sacrum"). The worker may edit ONLY this
   *  template's JSON — editing another template fails the sanity gate (wasted attempt). */
  templateName: string;
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
      "Author a NEW variant component (new file) alongside the existing ones, wire it into the <Type>Section.astro dispatch, and select it from the template JSON. Follow the dispatch wiring pattern shown below exactly. Do not modify existing variants. You are here because cheaper strategies were exhausted — COMMIT to building the new variant; do not decline because it's a big change.",
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

function normalizePlan(raw: unknown, templateName?: string): EditPlan {
  const v = (raw ?? {}) as Partial<EditPlan>;
  // Foreign-template edits (templates/<other>/…) always fail the sanity gate, so
  // drop them from the plan — don't waste the apply+render on a doomed attempt.
  const foreignTemplate = (f: string) =>
    !!templateName && /^templates\//.test(f) && !f.startsWith(`templates/${templateName}/`);
  const edits = Array.isArray(v.edits)
    ? v.edits.filter(
        (e): e is { file: string; instruction: string } =>
          !!e && typeof e.file === "string" && typeof e.instruction === "string" && !foreignTemplate(e.file),
      )
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
/** Phase 1 in isolation (read-only) — returns the normalized plan + the raw model output (for diagnostics). */
export async function planEdits(
  runner: WorkerRunner,
  input: AuthorVariantInput,
): Promise<{ plan: EditPlan; raw: unknown }> {
  const { kit, strategy } = input;
  const guide = STRATEGY_GUIDE[strategy];
  const maxChars = input.maxSourceChars ?? 6000;
  const images = [input.targetImage, ...(input.currentImage ? [input.currentImage] : [])];
  const scopedGuide = { ...guide, writeBoundary: guide.writeBoundary.replace(/<name>/g, input.templateName) };
  const planPrompt = buildPlanPrompt(kit, strategy, scopedGuide, maxChars, input);
  const raw = await runner.runJson<unknown>(planPrompt, {
    images,
    allowedTools: ["Read", "Grep", "Glob"],
    workdir: input.workdir,
    model: input.model,
  });
  return { plan: normalizePlan(raw, input.templateName), raw };
}

function buildPlanPrompt(
  kit: AuthoringKit,
  strategy: MutationStrategy,
  guide: { intent: string; writeBoundary: string },
  maxChars: number,
  input: AuthorVariantInput,
): string {
  return [
    `You are planning how to improve the "${kit.sectionType}" section of a website toward a TARGET design.`,
    `This run's template is "${input.templateName}". You may edit ONLY templates/${input.templateName}/${input.templateName}.json — NEVER any other template (e.g. template-specialist, template-restaurant). Editing a foreign template FAILS the sanity gate and wastes the attempt. Every JSON edit path you propose MUST start with "templates/${input.templateName}/".`,
    `Strategy for THIS attempt: ${strategy}.`,
    `Intent: ${guide.intent}`,
    `Write boundary: ${guide.writeBoundary}`,
    "",
    `Read the TARGET screenshot${input.currentImage ? " and the CURRENT render" : ""} (Read tool), and use Grep/Read to ground your plan in the ACTUAL file contents (find the exact current values you'd change).`,
    input.critique ? `\nScorer critique to address:\n${input.critique}` : "",
    input.targetStyle
      ? `\nGROUND-TRUTH target styling (MEASURED from the target's computed CSS — exact, not guessed):\n${input.targetStyle}\nThe theme is already locked to the target's palette, so DON'T hardcode these hex values — instead choose the SEMANTIC TOKEN that matches each (brand/gold → primary, page bg → background, cards → card/muted, etc.). Use this to fix color/font/radius mismatches precisely (e.g. an icon badge that should be a light tinted circle vs a dark fill).`
      : "",
    input.lessons ? `\n${input.lessons}` : "",
    "",
    renderKit(kit, maxChars),
    "",
    HARD_RULES,
    "",
    `Produce the SMALLEST set of concrete edits that move our section toward the target under this strategy. Each edit must name a file and an EXACT, unambiguous instruction (the precise current value/string and what to change it to). Prefer one or two high-impact edits.`,
    `Set feasible:false ONLY if our section ALREADY essentially matches the target. Do NOT set feasible:false merely because the change is large, structural, or requires new component code — at ${strategy}, authoring that code IS the job (cheaper strategies were already tried and exhausted). "Needs a component change" is a reason to MAKE the edit here, not to decline.`,
    `Output NOTHING except ONE JSON object on the last line:`,
    `{"feasible":true,"summary":"<one line>","edits":[{"file":"templates/${input.templateName}/${input.templateName}.json","instruction":"in the home services section, change \\"variant\\":\\"grid\\" to \\"ServicesDarkCards\\""}],"newVariantNames":[],"risks":[]}`,
  ].join("\n");
}

export async function authorVariant(
  runner: WorkerRunner,
  input: AuthorVariantInput,
): Promise<WorkerVerdict> {
  const { kit, strategy } = input;

  // ── Phase 1: ANALYZE → plan (read-only) ────────────────────────────────────
  let plan: EditPlan;
  try {
    ({ plan } = await planEdits(runner, input));
  } catch (e) {
    return normalizeVerdict({ summary: `plan phase produced no JSON (no-op): ${String(e).slice(0, 90)}` }, kit, strategy);
  }

  if (!plan.feasible || !plan.edits.length) {
    return normalizeVerdict({ summary: plan.summary || "no actionable change under this strategy", risks: plan.risks }, kit, strategy);
  }

  // ── Phase 2: APPLY the plan ─────────────────────────────────────────────────
  // Purely MECHANICAL — no design framing/hard-rules here (the plan already
  // respected them; the sanity gate re-enforces on the diff). Re-introducing
  // analysis here makes the model re-deliberate and skip the edits, so this is
  // an imperative "execute these exact edits now" prompt, mirroring the proven
  // direct-edit invocation.
  const applyPrompt = [
    `You are a code editor executing a fixed edit list. Do NOT re-evaluate whether the edits are good — just apply them exactly.`,
    `This run's template is "${input.templateName}". The ONLY template JSON you may touch is templates/${input.templateName}/${input.templateName}.json — never any other template.`,
    `For EACH edit below: use Grep to find the exact current string in the named file, then use the Edit tool to change it. Make every edit on disk now. Do not skip any.`,
    "",
    `EDITS:`,
    ...plan.edits.map((e, i) => `${i + 1}. File: ${e.file}\n   Change: ${e.instruction}`),
    plan.newVariantNames?.length ? `\nAlso create new variant component(s): ${plan.newVariantNames.join(", ")} (new file under packages/ui/src/sections/${kit.sectionType}/, wired into the dispatch).` : "",
    "",
    `When done, list the files you actually edited.`,
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
