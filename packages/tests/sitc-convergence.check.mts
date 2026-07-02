#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I13 (smarter convergence handoff).
 * Pure classification + plan + report (the escalated sweep is operator-run).
 *
 * Run: pnpm tsx packages/tests/sitc-convergence.check.mts
 *
 * Covers:
 *   A. classifyGap — asset / layout-primitive / component-code / other, with the
 *      right precedence (asset/layout win even if "component" appears).
 *   B. summarizeConvergence — converged flag, locked units, follow-up categories.
 *   C. planEscalation — component-code → escalatable; asset/layout → manual; other →
 *      neither; an exhausted unit is forced to manual.
 *   D. renderConvergenceReport — splits "Try escalation" vs "Manual" + the command.
 */
import {
  classifyGap,
  summarizeConvergence,
  planEscalation,
  renderConvergenceReport,
  type UnitConvergence,
} from "../sitc-core/src/loop/convergence.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

// ── A. classifyGap ───────────────────────────────────────────────────────────
console.log("A. classifyGap");
ok(classifyGap("the about.jpg image is broken / 404") === "asset", "broken image → asset");
ok(classifyGap("needs a scroll-driven carousel primitive") === "layout-primitive", "carousel/scroll → layout-primitive");
ok(classifyGap("worker declined; this needs new component code") === "component-code", "declined component → component-code");
ok(classifyGap("already matches; minor polish") === "other", "generic → other");
ok(classifyGap("needs a new component but the hero image is also broken") === "asset", "asset precedence over component mention");

// ── B. summarizeConvergence ──────────────────────────────────────────────────
console.log("B. summarizeConvergence");
{
  const units: UnitConvergence[] = [
    { sectionId: "hero#0", promotions: 0, bestScore: 0.92, threshold: 0.85 }, // locked
    { sectionId: "about#1", promotions: 0, bestScore: 0.7, threshold: 0.85, lastCritique: "needs new component code for split layout" },
    { sectionId: "gallery#2", promotions: 0, bestScore: 0.6, threshold: 0.85, lastCritique: "the gallery image assets are placeholders / 404" },
    { sectionId: "cta#3", promotions: 0, bestScore: 0.5, threshold: 0.85, lastCritique: "already close, minor spacing" },
  ];
  const r = summarizeConvergence(units);
  ok(r.converged, "0 promotions → converged");
  ok(r.locked.length === 1 && r.locked[0] === "hero#0", "hero locked");
  ok(r.followUps.find((f) => f.sectionId === "about#1")!.category === "component-code", "about → component-code");
  ok(r.followUps.find((f) => f.sectionId === "gallery#2")!.category === "asset", "gallery → asset");
  ok(r.followUps.find((f) => f.sectionId === "about#1")!.escalatable === true, "component-code is escalatable");
  ok(r.followUps.find((f) => f.sectionId === "gallery#2")!.escalatable === false, "asset is NOT escalatable");

  // ── C. planEscalation ──────────────────────────────────────────────────────
  console.log("C. planEscalation");
  const plan = planEscalation(r);
  ok(plan.escalatable.length === 1 && plan.escalatable[0].sectionId === "about#1", "only component-code unit is escalatable");
  ok(plan.manual.some((f) => f.sectionId === "gallery#2"), "asset unit → manual");
  ok(!plan.manual.some((f) => f.sectionId === "cta#3"), "low-signal 'other' → neither (not manual)");

  const planEx = planEscalation(r, new Set(["about#1"])); // already exhausted escalation
  ok(planEx.escalatable.length === 0 && planEx.manual.some((f) => f.sectionId === "about#1"), "exhausted unit forced to manual");

  // ── D. report ──────────────────────────────────────────────────────────────
  console.log("D. renderConvergenceReport");
  const md = renderConvergenceReport(7, r);
  ok(/Try escalation first/.test(md), "report has escalation section");
  ok(/about#1/.test(md.split("Manual follow-ups")[0]), "about#1 listed under escalation (before Manual)");
  ok(/SITC_ESCALATE=1/.test(md), "report prints the escalation command");
  ok(/Manual follow-ups[\s\S]*gallery#2/.test(md), "gallery#2 listed under manual");
}

// converged with no actionable gaps
{
  const r = summarizeConvergence([{ sectionId: "h", promotions: 0, bestScore: 0.95, threshold: 0.85 }]);
  ok(/everything matched/.test(renderConvergenceReport(1, r)), "all-locked converged → 'everything matched'");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
