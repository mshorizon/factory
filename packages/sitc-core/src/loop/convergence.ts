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

export interface ManualFollowUp {
  sectionId: string;
  /** Why the loop couldn't close it (worker critique), trimmed. */
  gap: string;
  /** True when the critique itself says the gap needs out-of-loop work. */
  needsCode: boolean;
}

export interface ConvergenceReport {
  /** No unit improved this run — the loop has nothing left to add. */
  converged: boolean;
  promotions: number;
  /** Units at/above their lock threshold (done). */
  locked: string[];
  /** Residual gaps to fix manually (units below threshold with a critique). */
  followUps: ManualFollowUp[];
}

/** Heuristic: does the critique say the gap is out of the loop's reach? */
function mentionsCodeGap(c: string): boolean {
  return /component code|new variant|new component|requires? .*(code|component)|tune-json (excludes|cannot)|not reachable|out of .*(scope|reach)|asset|image (failed|load)|hardcoded/i.test(c);
}

export function summarizeConvergence(units: UnitConvergence[]): ConvergenceReport {
  const promotions = units.reduce((n, u) => n + u.promotions, 0);
  const locked = units.filter((u) => (u.bestScore ?? 0) >= u.threshold).map((u) => u.sectionId);
  const followUps: ManualFollowUp[] = units
    .filter((u) => (u.bestScore ?? 0) < u.threshold && u.lastCritique && u.lastCritique.trim().length > 0)
    .map((u) => ({
      sectionId: u.sectionId,
      gap: u.lastCritique!.replace(/\s+/g, " ").trim().slice(0, 400),
      needsCode: mentionsCodeGap(u.lastCritique!),
    }));
  return { converged: promotions === 0, promotions, locked, followUps };
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
  if (r.followUps.length) {
    lines.push("## Manual follow-ups", "");
    for (const f of r.followUps) {
      lines.push(`- **${f.sectionId}**${f.needsCode ? " _(needs component code / out-of-loop)_" : ""}: ${f.gap}`);
    }
  } else if (r.converged) {
    lines.push("_No residual gaps recorded — everything matched._");
  }
  return lines.join("\n") + "\n";
}
