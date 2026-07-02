/**
 * Convergence detection + manual-fix handoff (DESIGN §8.1).
 *
 * The strategy ladder (tune-json → … → new-section) eventually plateaus: a run
 * lands no promotions because every unit "already matches" OR its remaining gap
 * is unreachable by the loop's strategies (needs component code the worker
 * declined, an asset, a layout primitive, etc.). At that point MORE runs just
 * burn tokens on no-ops — the productive next step is targeted MANUAL fixes.
 *
 * This turns the run into a signal: when it converges, emit the residual gaps
 * (the workers' own critiques for the units that didn't reach threshold) as an
 * actionable manual backlog. Pure + deterministic so it's unit-tested.
 */

export interface UnitConvergence {
  sectionId: string;
  /** Promotions this run for the unit. */
  promotions: number;
  /** Best score reached (champion). */
  bestScore?: number;
  /** Lock threshold for the unit. */
  threshold: number;
  /** The worker's latest critique for an un-promoted attempt — the residual gap. */
  lastCritique?: string;
}

/**
 * What KIND of gap a residual critique describes (tasks I13). This decides the
 * handoff: `component-code` is worth ONE escalated pass (a stronger model / explicit
 * permission to author the component may close it); `asset`/`layout-primitive` are
 * genuinely out of the loop's reach → straight to manual; `other` is low-signal.
 */
export type GapCategory = "component-code" | "asset" | "layout-primitive" | "other";

export interface ManualFollowUp {
  sectionId: string;
  /** Why the loop couldn't close it (worker critique), trimmed. */
  gap: string;
  category: GapCategory;
  /** True for component-code gaps — kept for back-compat with existing logs. */
  needsCode: boolean;
  /** Worth one escalated pass (stronger model / explicit component authoring). */
  escalatable: boolean;
}

export interface ConvergenceReport {
  /** No unit improved this run — the loop has nothing left to add. */
  converged: boolean;
  promotions: number;
  /** Units at/above their lock threshold (done). */
  locked: string[];
  /** Residual gaps (units below threshold with a critique). */
  followUps: ManualFollowUp[];
}

/**
 * Classify a residual gap. Order matters: a broken IMAGE/asset or a layout PRIMITIVE
 * is out-of-loop even if the critique also mentions "component"; only a pure
 * declined-component-code gap is escalatable.
 */
export function classifyGap(critique: string): GapCategory {
  const c = critique.toLowerCase();
  if (/\b(asset|image|photo|picture|logo|icon|404|broken (image|img)|placeholder)\b/.test(c)) return "asset";
  if (/\b(layout primitive|grid system|carousel|slider|scroll[- ]?driven|sticky|parallax|animation|marquee|masonry)\b/.test(c)) return "layout-primitive";
  if (/\b(component code|new variant|new component|author .*(component|variant)|requires? .*(code|component)|declined|cannot .*tune-json|tune-json (excludes|cannot)|not reachable)\b/.test(c)) return "component-code";
  return "other";
}

export function summarizeConvergence(units: UnitConvergence[]): ConvergenceReport {
  const promotions = units.reduce((n, u) => n + u.promotions, 0);
  const locked = units.filter((u) => (u.bestScore ?? 0) >= u.threshold).map((u) => u.sectionId);
  const followUps: ManualFollowUp[] = units
    .filter((u) => (u.bestScore ?? 0) < u.threshold && u.lastCritique && u.lastCritique.trim().length > 0)
    .map((u) => {
      const category = classifyGap(u.lastCritique!);
      return {
        sectionId: u.sectionId,
        gap: u.lastCritique!.replace(/\s+/g, " ").trim().slice(0, 400),
        category,
        needsCode: category === "component-code",
        escalatable: category === "component-code",
      };
    });
  return { converged: promotions === 0, promotions, locked, followUps };
}

export interface EscalationPlan {
  /** Component-code gaps worth one escalated pass before manual handoff. */
  escalatable: ManualFollowUp[];
  /** Genuinely out-of-loop gaps (asset / layout-primitive) → manual fix. */
  manual: ManualFollowUp[];
}

/**
 * Partition residual gaps into "try one escalated pass" vs "hand to a human" (§8.1,
 * I13). Low-signal "other" gaps go to neither — they're not actionable. Don't
 * escalate a unit that already exhausted escalation strategies (new-variant/
 * new-section) — pass its last strategy in `exhausted` to force it to manual.
 */
export function planEscalation(report: ConvergenceReport, exhausted: Set<string> = new Set()): EscalationPlan {
  const escalatable = report.followUps.filter((f) => f.escalatable && !exhausted.has(f.sectionId));
  const manual = report.followUps.filter((f) => !f.escalatable || exhausted.has(f.sectionId)).filter((f) => f.category !== "other");
  return { escalatable, manual };
}

/** Render the report as a Markdown backlog the operator can act on. */
export function renderConvergenceReport(runId: number | string, r: ConvergenceReport): string {
  const lines: string[] = [
    `# SITC run #${runId} — ${r.converged ? "CONVERGED" : "in progress"}`,
    "",
    r.converged
      ? `This run landed **0 promotions** — the loop has nothing left to add. Further automated runs will just no-op. **Next step: manual fixes** for the gaps below (each is a unit the loop couldn't push to its ${"threshold"} via its strategies).`
      : `${r.promotions} promotion(s) this run — still improving; keep iterating before switching to manual fixes.`,
    "",
  ];
  if (r.locked.length) lines.push(`✅ At threshold (done): ${r.locked.join(", ")}`, "");
  const plan = planEscalation(r);
  if (plan.escalatable.length) {
    lines.push(
      "## Try escalation first (component-code gaps)",
      "",
      "These plateaued on a gap the worker *declined* to code — one escalated pass (stronger model + explicit component authoring) may close them before any manual work:",
      "",
      ...plan.escalatable.map((f) => `- **${f.sectionId}**: ${f.gap}`),
      "",
      "Run: `SITC_ESCALATE=1 SITC_ESCALATION_MODEL=opus pnpm sitc:runner --run <id> --owner vps`",
      "",
    );
  }
  if (plan.manual.length) {
    lines.push("## Manual follow-ups (out of the loop's reach)", "");
    for (const f of plan.manual) lines.push(`- **${f.sectionId}** _(${f.category})_: ${f.gap}`);
  }
  if (!plan.escalatable.length && !plan.manual.length && r.converged) {
    lines.push("_No actionable residual gaps recorded — everything matched._");
  }
  return lines.join("\n") + "\n";
}
