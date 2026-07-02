/**
 * Per-dimension scoring rubric (DESIGN §7; tasks I8 / CONCLUSIONS #5).
 *
 * One holistic VLM number is a weak steering signal. This rubric structures the
 * critique into a per-dimension breakdown + a severity-tagged must-fix checklist,
 * so the worker gets sharp, actionable guidance ("spacing 0.40 — sections too
 * tight, use py-spacing-section") instead of a prose blob. The same structure also
 * yields a cheap strategy HINT: token-level gaps (color/typography/spacing) are
 * reachable by `tune-json`; structural gaps (layout/imagery) usually need a new
 * variant. Pure → unit-tested.
 */
import type { MutationStrategy } from "../types.js";

export const DIMENSIONS = ["layout", "color", "typography", "spacing", "imagery"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type Severity = "must-fix" | "minor";

export interface Finding {
  dimension: Dimension;
  severity: Severity;
  /** What's wrong. */
  gap: string;
  /** Concrete suggested fix (semantic tokens / variant choice). */
  fix: string;
}

/** Dimensions whose gaps usually need new component STRUCTURE, not just tokens/fields. */
const STRUCTURAL: ReadonlySet<Dimension> = new Set<Dimension>(["layout", "imagery"]);

const isDimension = (s: unknown): s is Dimension => typeof s === "string" && (DIMENSIONS as readonly string[]).includes(s);

/** Coerce a model's raw findings array into validated, bounded `Finding`s. */
export function normalizeFindings(raw: unknown, max = 8): Finding[] {
  if (!Array.isArray(raw)) return [];
  const out: Finding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (!isDimension(o.dimension)) continue;
    const severity: Severity = o.severity === "minor" ? "minor" : "must-fix";
    const gap = String(o.gap ?? "").slice(0, 240).trim();
    const fix = String(o.fix ?? "").slice(0, 240).trim();
    if (!gap && !fix) continue;
    out.push({ dimension: o.dimension, severity, gap, fix });
    if (out.length >= max) break;
  }
  // must-fix first, so the rendered checklist leads with what matters.
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "must-fix" ? -1 : 1));
}

/** The lowest-scoring dimension in a breakdown (null if empty). */
export function weakestDimension(breakdown: Record<string, number>): { dimension: string; score: number } | null {
  const entries = Object.entries(breakdown);
  if (!entries.length) return null;
  let lo = entries[0];
  for (const e of entries) if (e[1] < lo[1]) lo = e;
  return { dimension: lo[0], score: lo[1] };
}

/**
 * Render findings + breakdown into the steering critique the next worker reads.
 * Must-fix items lead; the weakest dimension is called out explicitly.
 */
export function renderCritique(findings: Finding[], breakdown: Record<string, number>): string {
  const lines: string[] = [];
  const weak = weakestDimension(breakdown);
  if (weak) lines.push(`Weakest dimension: ${weak.dimension} (${weak.score.toFixed(2)}). Fix the must-fix items first.`);
  for (const f of findings) {
    const s = breakdown[f.dimension];
    const sc = typeof s === "number" ? ` ${s.toFixed(2)}` : "";
    lines.push(`[${f.severity}] ${f.dimension}${sc}: ${f.gap}${f.fix ? ` → ${f.fix}` : ""}`);
  }
  return lines.join("\n");
}

export interface StrategySuggestion {
  /** A strategy the dominant gap argues for — advisory, the orchestrator's plateau ladder still governs. */
  suggested: MutationStrategy;
  rationale: string;
}

/**
 * Cheap strategy hint from the structured gaps (the I8 "new angle"). Advisory only:
 * token-level gaps (color/typography/spacing) → cheapest `tune-json`; structural
 * gaps (layout/imagery) that are must-fix → `new-variant`. Never suggests
 * `new-section` (reserved for genuinely absent layouts, §6).
 */
export function suggestStrategy(findings: Finding[], breakdown: Record<string, number>): StrategySuggestion {
  const mustFix = findings.filter((f) => f.severity === "must-fix");
  const structuralMustFix = mustFix.filter((f) => STRUCTURAL.has(f.dimension));
  if (structuralMustFix.length) {
    return {
      suggested: "new-variant",
      rationale: `structural must-fix gap(s) in ${[...new Set(structuralMustFix.map((f) => f.dimension))].join(", ")} — likely needs new component structure`,
    };
  }
  const weak = weakestDimension(breakdown);
  return {
    suggested: "tune-json",
    rationale: weak ? `gaps are token-level (weakest: ${weak.dimension}) — reachable by JSON/field tuning` : "token-level gaps — tune JSON first",
  };
}
