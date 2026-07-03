#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I29 (config profiles), I31 (cross-run
 * report), I32 (section-identity drift alignment), I33 (target-context assembly
 * extracted from the runner). Pure — no IO, no model. (I30 fail-closed is a
 * runner control-flow change over I29's judgeGateExplicit, verified here at the
 * config level + by the runner load-test.)
 *
 * Run: pnpm tsx packages/tests/sitc-ops-trust.check.mts
 */
import { resolveRunnerConfig, renderConfigLines } from "../sitc-core/src/orchestrator/config.js";
import { aggregateRuns, renderRunsReport } from "../sitc-core/src/experiment/report.js";
import { alignArmSectionIds, compareLessonsAb, toArmMetrics, renderAbReport } from "../sitc-core/src/experiment/lessons-ab.js";
import { buildTargetContext, fmtMeasuredStyle } from "../sitc-core/src/steps/ingest.js";
import type { RunMetrics } from "../sitc-core/src/pipeline/run.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

// ── A. config resolver (I29/I30) ─────────────────────────────────────────────
console.log("A. resolveRunnerConfig");
{
  const def = resolveRunnerConfig({});
  ok(!def.judgeGate && !def.scoreMobile && !def.acceptanceBuild && !def.deliveryPr && !def.escalate, "default profile: quality features off (back-compat)");
  ok(def.prescore && !def.workerEnabled && def.renderTimeoutMs === 60_000 && def.model === "sonnet", "sane defaults (prescore on, worker off, 60s render)");

  const live = resolveRunnerConfig({ SITC_PROFILE: "live" });
  ok(live.judgeGate && live.scoreMobile && live.acceptanceBuild && live.deliveryPr && live.escalate, "live profile: quality bundle ON");
  ok(!live.workerEnabled && !live.deliveryPush, "live profile NEVER implies the autonomous worker or a prod push");
  ok(!live.judgeGateExplicit, "profile-implied judge gate is not 'explicit' (→ skip-if-unseeded, not fail-closed)");

  const overridden = resolveRunnerConfig({ SITC_PROFILE: "live", SITC_SCORE_MOBILE: "0", SITC_JUDGE_GATE: "1" });
  ok(!overridden.scoreMobile, "explicit env 0 beats the live profile");
  ok(overridden.judgeGate && overridden.judgeGateExplicit, "explicit SITC_JUDGE_GATE=1 → fail-closed semantics (I30)");

  const knobs = resolveRunnerConfig({ SITC_MAX_USD: "12.5", SITC_MIN_COVERAGE: "2", SITC_RENDER_TIMEOUT_MS: "30000", SITC_ESCALATION_MODEL: "opus", SITC_MODEL: "sonnet" });
  ok(knobs.maxUsd === 12.5 && knobs.minCoverage === 2 && knobs.renderTimeoutMs === 30000 && knobs.escalationModel === "opus", "numeric knobs + escalation model parsed");
  ok(resolveRunnerConfig({ SITC_MAX_USD: "banana" }).maxUsd === undefined, "junk numeric env → undefined, not NaN");

  const lines = renderConfigLines(resolveRunnerConfig({ SITC_PROFILE: "live", SITC_ENABLE_WORKER: "1" }));
  ok(lines.length === 4 && lines[0].includes("profile=live") && lines[0].includes("worker=LIVE"), "config printout leads with profile + worker mode");
  ok(lines.some((l) => l.includes("judge=ON")), "printout shows gate states");
}

// ── B. cross-run report (I31) ────────────────────────────────────────────────
console.log("B. aggregateRuns / renderRunsReport");
{
  const m = (over: Partial<RunMetrics> = {}) => ({
    arm: "lessons-on", template: "sacrum", targetUrl: "http://t",
    iterationsToLock: {}, finalScores: {}, workerInvocations: 15, rounds: 8, promotions: 1, lockedCount: 1, sectionCount: 6, ...over,
  });
  const report = aggregateRuns([
    { runId: "41", metrics: m(), cost: { costUsd: 8.65, roi: { usdPerPromotion: 7.78 } }, delivery: { finalStatus: "needs_review", reasons: ["existing-template SSIM 0.703 < 0.99"] } },
    { runId: "7", metrics: null, cost: null, delivery: null }, // pre-telemetry run
    { runId: "40", metrics: m({ lockedCount: 0 }), cost: { costUsd: 12.1 }, delivery: { finalStatus: "needs_review" } },
  ]);
  ok(report.rows.map((r) => r.runId).join(",") === "40,41", "rows sorted numerically by run id");
  ok(report.skipped.join(",") === "7", "artifact-less runs reported as skipped, not silently dropped");
  const trend = report.trends.find((t) => t.template === "sacrum")!;
  ok(trend.runs === 2 && trend.firstCostUsd === 12.1 && trend.lastCostUsd === 8.65, "per-template cost trend first → latest");
  ok(trend.firstLockedShare === 0 && Math.abs((trend.lastLockedShare ?? 0) - 1 / 6) < 1e-9, "locked-share trend");
  const md = renderRunsReport(report);
  ok(md.includes("| 41 |") && md.includes("$8.65") && md.includes("SSIM 0.703"), "report table carries cost + first gate reason");
  ok(md.includes("pre-telemetry"), "report mentions skipped runs");
}

// ── C. section-identity drift (I32) ──────────────────────────────────────────
console.log("C. alignArmSectionIds / compareLessonsAb");
{
  // run 40 called section 3 "about#3"; run 41 called it "features#3" (real case)
  const on = toArmMetrics("lessons-on", {
    iterationsToLock: { "hero#0": 2, "about#3": 3 },
    finalScores: { "hero#0": 0.9, "about#3": 0.88, "navbar": 0.9 },
    workerInvocations: 10, rounds: 5, promotions: 3, lockedCount: 2, sectionCount: 3,
  });
  const off = toArmMetrics("lessons-off", {
    iterationsToLock: { "hero#0": 4, "features#3": 5 },
    finalScores: { "hero#0": 0.89, "features#3": 0.87, "navbar": 0.88 },
    workerInvocations: 14, rounds: 7, promotions: 3, lockedCount: 2, sectionCount: 3,
  });
  const { renames } = alignArmSectionIds(on, off);
  ok(renames["features#3"] === "about#3", "drifted id unified by position");
  const cmp = compareLessonsAb(on, off);
  ok(cmp.perSection.length === 3, "3 units, not 4 half-empty rows");
  const unit3 = cmp.perSection.find((d) => d.sectionId === "about#3")!;
  ok(unit3.lockedAdvantage === "both" && unit3.itersSaved === 2, "unified unit compares both arms (5−3 rounds saved)");
  ok(cmp.verdict === "lessons-help", "verdict computed over unified ids");
  ok(renderAbReport(on, off, cmp).includes("features#3→about#3"), "report notes the identity unification");

  // ambiguity is left alone, chrome matches exactly
  const on2 = toArmMetrics("lessons-on", { ...on, finalScores: { "a#1": 1, "b#1": 1 } as any, iterationsToLock: {} });
  const off2 = toArmMetrics("lessons-off", { ...off, finalScores: { "c#1": 1 } as any, iterationsToLock: {} });
  ok(Object.keys(alignArmSectionIds(on2, off2).renames).length === 0, "ambiguous positional match (two candidates) is not guessed");
}

// ── D. buildTargetContext (I33) ──────────────────────────────────────────────
console.log("D. buildTargetContext");
{
  const style = { bg: "#111", text: "#eee", accent: "#7c3aed", headingFont: "Inter", bodyFont: "Inter", radius: "8px" };
  const ctx = buildTargetContext({
    crops: [
      { band: { index: 0, style, images: [{ kind: "background", width: 1440, height: 810, aspect: 16 / 9 } as any] }, path: "/crops/0.png" },
      { band: { index: 1, style }, path: "/crops/1.png" },
      { band: { index: 2 }, path: "/crops/2.png" }, // footer band, no style
    ],
    alignment: [
      { status: "matched", targetBandIndex: 0, ourSectionIndex: 0 } as any,
      { status: "matched", targetBandIndex: 1, ourSectionIndex: 1 } as any,
      { status: "target-only", targetBandIndex: 2 } as any,
      { status: "ours-only", ourSectionIndex: 2 } as any,
    ],
    homeSections: [{ type: "hero" }, { type: "services" }, { type: "cta" }],
    navbar: { cropPath: "/crops/nav.png", style },
  });
  ok(ctx.sectionIds.join(",") === "hero#0,services#1,cta#2", "section ids from home sections");
  ok(ctx.targetFor["hero#0"] === "/crops/0.png" && ctx.targetFor["services#1"] === "/crops/1.png", "matched sections get their crops");
  ok(ctx.evolve.map((e) => e.id).join(",") === "hero#0,services#1", "evolve = matched sections with crops (ours-only excluded)");
  ok(ctx.chromeIds.join(",") === "navbar,footer", "navbar + last target-only band become chrome units");
  ok(ctx.targetFor["navbar"] === "/crops/nav.png" && ctx.targetFor["footer"] === "/crops/2.png", "chrome crops mapped");
  ok((ctx.styleFor["hero#0"] ?? "").includes("#7c3aed") && (ctx.styleFor["hero#0"] ?? "").includes("imagery:"), "measured style + imagery shape (I11) per section");
  ok(ctx.styleFor["footer"] === undefined, "style-less band → no style line (not an empty string)");
  ok(fmtMeasuredStyle(null) === "", "fmtMeasuredStyle null-safe");

  const noChrome = buildTargetContext({ crops: [], alignment: [], homeSections: [] });
  ok(noChrome.chromeIds.length === 0 && noChrome.evolve.length === 0, "empty ingestion → empty context (no crash)");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
