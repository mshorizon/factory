#!/usr/bin/env tsx
/**
 * SITC — Lessons A/B evaluator (tasks I1 / DESIGN §18-G).
 *
 * Compares two finished runs against the SAME target — one with lessons retrieved
 * into the worker prompt, one run with SITC_DISABLE_LESSONS=1 — and prints/writes a
 * verdict on whether the learning store actually compounds (faster convergence /
 * more sections locked, without regressing final quality).
 *
 * No DB, no model — just reads the two `metrics.json` artifacts the runner writes.
 *
 * Usage:
 *   pnpm sitc:lessons-ab --on <runId|path> --off <runId|path> [--out <file.md>]
 *
 * A run id resolves to .sitc/runs/<id>/metrics.json; a path is used as-is.
 *
 * Procedure to produce the two arms (on the VPS, see RUN-ON-VPS.md):
 *   1.  SITC_ENABLE_WORKER=1                       pnpm sitc:runner --run <A>   # lessons-on
 *   2.  SITC_ENABLE_WORKER=1 SITC_DISABLE_LESSONS=1 pnpm sitc:runner --run <B>  # lessons-off
 *   3.  pnpm sitc:lessons-ab --on <A> --off <B>
 * Use the SAME template + target for both runs, and seed the run DB identically.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { compareLessonsAb, renderAbReport, type ArmMetrics } from "../packages/sitc-core/src/experiment/lessons-ab.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

function resolveMetricsPath(ref: string): string {
  // bare integer → run artifact dir; anything else → literal path
  return /^\d+$/.test(ref) ? path.join(REPO_ROOT, ".sitc", "runs", ref, "metrics.json") : path.resolve(ref);
}

async function loadArm(ref: string): Promise<ArmMetrics> {
  const p = resolveMetricsPath(ref);
  let raw: string;
  try {
    raw = await fs.readFile(p, "utf8");
  } catch {
    throw new Error(`metrics not found: ${p} (did the run finish and write metrics.json?)`);
  }
  const arm = JSON.parse(raw) as ArmMetrics;
  if (!arm || typeof arm !== "object" || !arm.finalScores || !arm.iterationsToLock) {
    throw new Error(`malformed metrics file: ${p}`);
  }
  return arm;
}

async function main() {
  const onRef = arg("on");
  const offRef = arg("off");
  if (!onRef || !offRef) {
    console.error("usage: pnpm sitc:lessons-ab --on <runId|path> --off <runId|path> [--out <file.md>]");
    process.exit(2);
  }

  const on = await loadArm(onRef);
  const off = await loadArm(offRef);

  // sanity: warn (don't fail) if arm labels look swapped or targets differ
  if (on.arm !== "lessons-on") console.warn(`⚠ --on metrics are labeled "${on.arm}" (expected lessons-on)`);
  if (off.arm !== "lessons-off") console.warn(`⚠ --off metrics are labeled "${off.arm}" (expected lessons-off)`);
  if (on.targetUrl && off.targetUrl && on.targetUrl !== off.targetUrl) {
    console.warn(`⚠ arms ran against DIFFERENT targets (${on.targetUrl} vs ${off.targetUrl}) — comparison is not apples-to-apples`);
  }

  const cmp = compareLessonsAb(on, off);
  const md = renderAbReport(on, off, cmp);

  const outPath = arg("out") ?? path.join(REPO_ROOT, ".sitc", "lessons-ab-report.md");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md);

  const icon = cmp.verdict === "lessons-help" ? "✅" : cmp.verdict === "lessons-hurt" ? "❌" : "➖";
  console.log(`\n${icon} VERDICT: ${cmp.verdict}`);
  console.log(`   ${cmp.rationale}`);
  console.log(
    `   mean rounds saved=${cmp.meanItersSaved?.toFixed(2) ?? "n/a"}  net extra locked=${cmp.netExtraLocked}  invocations saved=${cmp.invocationsSaved}  mean Δscore=${cmp.meanScoreDelta.toFixed(3)}`,
  );
  console.log(`\n   report → ${outPath}`);
}

main().catch((e) => {
  console.error("sitc-lessons-ab failed:", e.message ?? e);
  process.exit(1);
});
