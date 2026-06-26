#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I8 (per-dimension structured scoring).
 * Pure rubric helpers + vlmScore over a fake runner (no model).
 *
 * Run: pnpm tsx packages/tests/sitc-rubric.check.mts
 *
 * Covers:
 *   A. normalizeFindings — drops unknown dimensions / empty items, defaults severity,
 *      clamps gap/fix length, caps count, sorts must-fix first.
 *   B. weakestDimension / renderCritique — lowest dim, checklist leads with weakest +
 *      must-fix items, includes per-dim scores.
 *   C. suggestStrategy — structural must-fix → new-variant; token-only → tune-json.
 *   D. vlmScore — parses structured findings into VlmScore.findings + derives the
 *      steering critique from them; falls back to prose critique when none.
 */
import { normalizeFindings, weakestDimension, renderCritique, suggestStrategy } from "../sitc-core/src/scorer/rubric.js";
import { vlmScore } from "../sitc-core/src/scorer/vlm.js";
import type { WorkerRunner } from "../sitc-core/src/types.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

// ── A. normalizeFindings ─────────────────────────────────────────────────────
console.log("A. normalizeFindings");
{
  const raw = [
    { dimension: "spacing", severity: "minor", gap: "tight", fix: "py-spacing-section" },
    { dimension: "color", severity: "must-fix", gap: "cta outline", fix: "bg-primary" },
    { dimension: "bogus", severity: "must-fix", gap: "x", fix: "y" }, // unknown dim → dropped
    { dimension: "typography" }, // no gap/fix → dropped
    { dimension: "layout", gap: "stacked vs grid" }, // severity defaults must-fix
  ];
  const f = normalizeFindings(raw);
  ok(f.length === 3, `kept 3 valid findings (got ${f.length})`);
  ok(!f.some((x) => (x.dimension as string) === "bogus"), "unknown dimension dropped");
  ok(f[0].severity === "must-fix" && f[f.length - 1].severity === "minor", "sorted must-fix first");
  ok(f.find((x) => x.dimension === "layout")!.severity === "must-fix", "severity defaults to must-fix");
  ok(normalizeFindings("nope").length === 0, "non-array → []");
  const many = normalizeFindings(Array.from({ length: 20 }, () => ({ dimension: "color", gap: "g", fix: "f" })), 8);
  ok(many.length === 8, "caps at max (8)");
  const long = normalizeFindings([{ dimension: "color", gap: "x".repeat(500), fix: "y".repeat(500) }]);
  ok(long[0].gap.length <= 240 && long[0].fix.length <= 240, "gap/fix clamped to 240");
}

// ── B. weakestDimension / renderCritique ─────────────────────────────────────
console.log("B. weakestDimension / renderCritique");
{
  const breakdown = { layout: 0.9, color: 0.55, typography: 0.8, spacing: 0.4, imagery: 0.7 };
  ok(weakestDimension(breakdown)!.dimension === "spacing", "weakest = spacing (0.40)");
  ok(weakestDimension({}) === null, "empty breakdown → null");
  const findings = normalizeFindings([
    { dimension: "spacing", severity: "must-fix", gap: "too tight", fix: "py-spacing-section" },
    { dimension: "typography", severity: "minor", gap: "light", fix: "font-semibold" },
  ]);
  const c = renderCritique(findings, breakdown);
  ok(/^Weakest dimension: spacing/m.test(c), "critique leads with weakest dimension");
  ok(c.indexOf("[must-fix] spacing") < c.indexOf("[minor] typography"), "must-fix listed before minor");
  ok(c.includes("0.40") && c.includes("→ py-spacing-section"), "includes score + concrete fix");
}

// ── C. suggestStrategy ───────────────────────────────────────────────────────
console.log("C. suggestStrategy");
{
  const structural = suggestStrategy(
    normalizeFindings([{ dimension: "layout", severity: "must-fix", gap: "needs split grid", fix: "new layout" }]),
    { layout: 0.4 },
  );
  ok(structural.suggested === "new-variant", "structural must-fix → new-variant");

  const tokenOnly = suggestStrategy(
    normalizeFindings([{ dimension: "color", severity: "must-fix", gap: "wrong accent", fix: "bg-primary" }]),
    { color: 0.5 },
  );
  ok(tokenOnly.suggested === "tune-json", "token-level gaps → tune-json");

  const minorStructural = suggestStrategy(
    normalizeFindings([{ dimension: "layout", severity: "minor", gap: "slightly off", fix: "nudge" }]),
    { layout: 0.85 },
  );
  ok(minorStructural.suggested === "tune-json", "MINOR structural gap does not force new-variant");
}

// ── D. vlmScore over a fake runner ───────────────────────────────────────────
console.log("D. vlmScore");
{
  const fakeRunner = (raw: unknown): WorkerRunner => ({
    run: async () => "",
    runJson: async () => raw as any,
  });

  const structured = await vlmScore(
    fakeRunner({
      score: 82,
      breakdown: { layout: 90, color: 55, typography: 80, spacing: 40, imagery: 70 },
      findings: [{ dimension: "spacing", severity: "must-fix", gap: "tight", fix: "py-spacing-section" }],
    }),
    "our.png",
    "target.png",
  );
  ok(Math.abs(structured.score - 0.82) < 1e-9, "score normalized 0..1");
  ok(structured.breakdown.spacing === 0.4, "breakdown normalized 0..1");
  ok(structured.findings.length === 1 && structured.findings[0].dimension === "spacing", "structured findings parsed");
  ok(/Weakest dimension: spacing/.test(structured.critique), "critique derived from findings");

  const proseFallback = await vlmScore(
    fakeRunner({ score: 70, breakdown: { color: 70 }, critique: "make the CTA filled" }),
    "our.png",
    "target.png",
  );
  ok(proseFallback.findings.length === 0 && proseFallback.critique === "make the CTA filled", "falls back to prose critique when no structured findings");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
