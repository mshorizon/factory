/**
 * Judge-health gate (tasks I7; DESIGN §7.2a, DEPLOY gap #3).
 *
 * The ENTIRE correctness of the loop rests on the pairwise judge being right — and
 * the model behind it can drift between runs. So before a run drives any promotions
 * (whose worst case auto-merges to `develop`), replay a durable set of human-labeled
 * calibration triples through the judge and GATE the run on agreement + order-
 * stability. A drop means the judge would confidently converge on the wrong design;
 * better to refuse the run than to corrupt the template library.
 *
 * `runCalibration` (scorer/calibration.ts) already produces the report; this adds
 * the gate decision, a pluggable durable store, and the persistence mapper. Pure /
 * injectable → unit-tested without a DB or a model.
 */
import type { WorkerRunner } from "../types.js";
import { runCalibration, type CalibrationTriple, type CalibrationReport } from "./calibration.js";

export interface JudgeHealthThresholds {
  /** Min agreement-with-human over confident triples. Spike bar = 0.90. */
  minAgreement: number;
  /** Min order-stability over all triples (positional-bias guard). */
  minOrderStability: number;
  /** Min confident triples required to TRUST the gate at all. */
  minConfident: number;
}

export const DEFAULT_JUDGE_HEALTH: JudgeHealthThresholds = {
  minAgreement: 0.9,
  minOrderStability: 0.9,
  minConfident: 4,
};

export interface JudgeHealthResult {
  ok: boolean;
  agreement: number;
  orderStability: number;
  confidentN: number;
  reasons: string[];
}

/**
 * Decide whether the judge is healthy enough to drive the run. Fails CLOSED on too
 * few labeled triples — an unvalidated judge is not a trusted judge.
 */
export function judgeHealthGate(report: CalibrationReport, thr: JudgeHealthThresholds = DEFAULT_JUDGE_HEALTH): JudgeHealthResult {
  const reasons: string[] = [];
  if (report.confidentN < thr.minConfident) {
    reasons.push(`only ${report.confidentN} confident triples (< ${thr.minConfident}) — judge not validated for this run`);
  }
  if (report.agreement < thr.minAgreement) {
    reasons.push(`agreement ${report.agreement.toFixed(2)} < ${thr.minAgreement} — judge drifting from human ground truth`);
  }
  if (report.orderStability < thr.minOrderStability) {
    reasons.push(`order-stability ${report.orderStability.toFixed(2)} < ${thr.minOrderStability} — positional bias`);
  }
  return { ok: reasons.length === 0, agreement: report.agreement, orderStability: report.orderStability, confidentN: report.confidentN, reasons };
}

// ─── durable store (pluggable; Drizzle impl in @mshorizon/db) ─────────────────

/** One persisted calibration verdict — mirrors the `sitc_judge_calibration` row. */
export interface CalibrationRow {
  championImg: string;
  challengerImg: string;
  targetImg: string;
  humanAnswer: "champion" | "challenger";
  judgeAnswer: string | null;
  agreed: boolean | null;
  checkedAt: Date | null;
}

export interface JudgeCalibrationStore {
  /** Load the durable labeled triples (R2/disk-backed image paths). */
  loadTriples(): Promise<CalibrationTriple[]>;
  /** Persist the replay verdicts (judge answer + agreement + timestamp). */
  recordResults(rows: CalibrationRow[]): Promise<void>;
}

export class InMemoryJudgeCalibrationStore implements JudgeCalibrationStore {
  recorded: CalibrationRow[] = [];
  constructor(private triples: CalibrationTriple[] = []) {}
  async loadTriples(): Promise<CalibrationTriple[]> {
    return this.triples;
  }
  async recordResults(rows: CalibrationRow[]): Promise<void> {
    this.recorded.push(...rows);
  }
}

/** Map a replay report back to durable rows (judge answer + agreement). Pure. */
export function calibrationRowsFromReport(triples: CalibrationTriple[], report: CalibrationReport, checkedAt: Date): CalibrationRow[] {
  const byId = new Map(report.items.map((i) => [i.id, i]));
  return triples.map((t) => {
    const item = byId.get(t.id);
    return {
      championImg: t.championImg,
      challengerImg: t.challengerImg,
      targetImg: t.targetImg,
      humanAnswer: t.human,
      judgeAnswer: item?.winner ?? null,
      agreed: item?.correct ?? null,
      checkedAt,
    };
  });
}

export interface JudgeHealthCheck {
  /** null when there were no triples to replay (gate skipped, not failed). */
  report: CalibrationReport | null;
  gate: JudgeHealthResult | null;
  rows: CalibrationRow[];
}

/**
 * Run-start replay: load durable triples, replay through the judge, gate, and
 * produce persistence rows. Skips (report=null) when the store has no triples, so
 * the gate degrades gracefully on a fresh deployment with an empty set.
 */
export async function checkJudgeHealth(
  runner: WorkerRunner,
  store: JudgeCalibrationStore,
  opts: { model?: string; concurrency?: number; thresholds?: JudgeHealthThresholds; now: Date },
): Promise<JudgeHealthCheck> {
  const triples = await store.loadTriples();
  if (!triples.length) return { report: null, gate: null, rows: [] };
  const report = await runCalibration(runner, triples, { model: opts.model, concurrency: opts.concurrency });
  const gate = judgeHealthGate(report, opts.thresholds);
  const rows = calibrationRowsFromReport(triples, report, opts.now);
  return { report, gate, rows };
}
