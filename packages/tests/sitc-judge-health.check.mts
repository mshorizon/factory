#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I7 (judge-drift gate).
 * No model — a fake WorkerRunner returns canned pairwise verdicts.
 *
 * Run: pnpm tsx packages/tests/sitc-judge-health.check.mts
 *
 * Covers:
 *   A. judgeHealthGate — passes on a healthy report; fails on low agreement, low
 *      order-stability, or too few confident triples (fail-closed).
 *   B. checkJudgeHealth — loads triples, replays through the judge, gates, and maps
 *      durable rows; skips (report=null) on an empty store.
 *   C. calibrationRowsFromReport — judge answer + agreement persisted per triple.
 */
import {
  judgeHealthGate,
  checkJudgeHealth,
  calibrationRowsFromReport,
  InMemoryJudgeCalibrationStore,
} from "../sitc-core/src/scorer/judge-health.js";
import type { CalibrationReport, CalibrationTriple } from "../sitc-core/src/scorer/calibration.js";
import type { WorkerRunner } from "../sitc-core/src/types.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const report = (over: Partial<CalibrationReport>): CalibrationReport => ({
  n: 6, confidentN: 6, agreement: 1, orderStability: 1, items: [], ...over,
});

// ── A. judgeHealthGate ───────────────────────────────────────────────────────
console.log("A. judgeHealthGate");
{
  ok(judgeHealthGate(report({})).ok, "healthy report passes");
  ok(!judgeHealthGate(report({ agreement: 0.8 })).ok, "low agreement fails");
  ok(!judgeHealthGate(report({ orderStability: 0.8 })).ok, "low order-stability fails");
  const few = judgeHealthGate(report({ confidentN: 2 }));
  ok(!few.ok && /not validated/.test(few.reasons[0]), "too few confident triples → fail-closed");
  ok(judgeHealthGate(report({}), { minAgreement: 0.95, minOrderStability: 0.95, minConfident: 6 }).ok, "custom thresholds honored (perfect report passes)");
}

// ── B + C. checkJudgeHealth + row mapping over a fake judge ──────────────────
console.log("B+C. checkJudgeHealth + calibrationRowsFromReport");
{
  // Fake judge: pairwiseJudge prompts with FIRST/SECOND slot paths and expects
  // {closer:"first"|"second"}. We answer toward whichever slot holds the "good"
  // image (path contains "good") — so it's order-stable (always the good image) AND
  // agrees with the human label (the good image == the human's pick). Mirrors how a
  // healthy judge behaves; a drifting one is simulated separately below.
  const goodSlotVerdict = (prompt: string): { closer: "first" | "second" } => {
    const first = /FIRST:\s+(\S+)/.exec(prompt)?.[1] ?? "";
    return { closer: first.includes("good") ? "first" : "second" };
  };
  const fake: WorkerRunner = {
    run: async () => "",
    runJson: async (prompt: string) => goodSlotVerdict(prompt) as any,
  };

  // The image NAMED "good*" is the one closer to target (== the human's answer).
  const triples: CalibrationTriple[] = [
    { id: "t1", championImg: "champ1.png", challengerImg: "good-chal1.png", targetImg: "tgt1.png", human: "challenger" },
    { id: "t2", championImg: "good-champ2.png", challengerImg: "chal2.png", targetImg: "tgt2.png", human: "champion" },
    { id: "t3", championImg: "champ3.png", challengerImg: "good-chal3.png", targetImg: "tgt3.png", human: "challenger" },
    { id: "t4", championImg: "good-champ4.png", challengerImg: "chal4.png", targetImg: "tgt4.png", human: "champion" },
  ];
  const store = new InMemoryJudgeCalibrationStore(triples);
  const now = new Date("2026-06-25T00:00:00Z");
  const health = await checkJudgeHealth(fake, store, { now, thresholds: { minAgreement: 0.9, minOrderStability: 0.9, minConfident: 4 } });

  ok(health.report !== null, "replayed (report present)");
  ok(health.report!.agreement === 1, `judge agrees with human ground truth (got ${health.report!.agreement})`);
  ok(health.gate!.ok, "gate passes for a healthy judge");
  ok(health.rows.length === 4, "produced a durable row per triple");
  const r1 = health.rows.find((r) => r.championImg === "champ1.png")!;
  ok(r1.judgeAnswer === "challenger" && r1.agreed === true && r1.checkedAt === now, "row carries judge answer + agreement + timestamp");

  // empty store → gate skipped, not failed
  const empty = await checkJudgeHealth(fake, new InMemoryJudgeCalibrationStore([]), { now });
  ok(empty.report === null && empty.gate === null && empty.rows.length === 0, "empty store → gate skipped (graceful)");

  // recordResults persists
  await store.recordResults(health.rows);
  ok(store.recorded.length === 4, "store.recordResults persisted rows");

  // pure mapper sanity
  const rows = calibrationRowsFromReport(triples, health.report!, now);
  ok(rows.every((r) => r.humanAnswer && r.checkedAt === now), "calibrationRowsFromReport maps all triples");

  // DRIFT: a positionally-biased judge that always answers "first". Order-symmetric
  // voting → champion in one order, challenger in the other → tie everywhere →
  // agreement 0 + order-stability 0 → gate must FAIL closed.
  const biased: WorkerRunner = { run: async () => "", runJson: async () => ({ closer: "first" }) as any };
  const drift = await checkJudgeHealth(biased, new InMemoryJudgeCalibrationStore(triples), { now });
  ok(drift.report!.orderStability === 0, "biased judge → 0 order-stability");
  ok(drift.report!.agreement === 0, "biased judge → 0 agreement");
  ok(!drift.gate!.ok && drift.gate!.reasons.length >= 1, "drift gate FAILS closed (run would be refused)");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
