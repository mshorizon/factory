/**
 * Judge calibration (DESIGN §7.2a, spike caveat #1).
 *
 * Runs the order-symmetric pairwise judge over human-labeled triples and reports
 * agreement-with-human + order-stability. This is the harness that grows the
 * `sitc_judge_calibration` set and gates the loop on judge reliability for the
 * SUBTLE champion-vs-challenger deltas the real loop faces (not just the gross
 * cross-template differences the spike used).
 */
import type { WorkerRunner } from "../types.js";
import { pairwiseJudge, type PairwiseWinner } from "./pairwise.js";

export interface CalibrationTriple {
  id: string;
  championImg: string;
  challengerImg: string;
  targetImg: string;
  /** Human ground truth: which slot is closer to target. */
  human: "champion" | "challenger";
  /** Count toward agreement (default true). Set false for deliberately ambiguous triples. */
  confident?: boolean;
}

export interface CalibrationItemResult {
  id: string;
  winner: PairwiseWinner;
  orderStable: boolean;
  correct: boolean | null; // null for non-confident triples
}

export interface CalibrationReport {
  n: number;
  confidentN: number;
  agreement: number; // 0..1 over confident triples
  orderStability: number; // 0..1 over all triples
  items: CalibrationItemResult[];
}

async function pool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

export async function runCalibration(
  runner: WorkerRunner,
  triples: CalibrationTriple[],
  opts: { model?: string; concurrency?: number } = {},
): Promise<CalibrationReport> {
  const items = await pool(triples, opts.concurrency ?? 4, async (t): Promise<CalibrationItemResult> => {
    const r = await pairwiseJudge(
      runner,
      { champion: t.championImg, challenger: t.challengerImg, target: t.targetImg },
      { model: opts.model },
    );
    const correct = t.confident === false ? null : r.winner === t.human;
    return { id: t.id, winner: r.winner, orderStable: r.orderStable, correct };
  });

  const confident = items.filter((i) => i.correct !== null);
  const agree = confident.filter((i) => i.correct === true).length;
  const stable = items.filter((i) => i.orderStable).length;
  return {
    n: items.length,
    confidentN: confident.length,
    agreement: confident.length ? agree / confident.length : 0,
    orderStability: items.length ? stable / items.length : 0,
    items,
  };
}
