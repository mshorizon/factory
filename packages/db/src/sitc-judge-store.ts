/**
 * Drizzle-backed JudgeCalibrationStore (DESIGN §7.2a; tasks I7) — `sitc_judge_calibration`.
 *
 * Loads the durable human-labeled triples for the run-start judge-health replay and
 * persists the replay verdicts back. Image paths are stored as-is (R2/disk URLs);
 * this layer doesn't fetch them — the scorer reads them when replaying.
 *
 * Type-checked; not yet run against production (gated, like the rest of the DB).
 */
import type { CalibrationTriple } from "@mshorizon/sitc-core";
import type { JudgeCalibrationStore, CalibrationRow } from "@mshorizon/sitc-core";
import { getDb } from "./client.js";
import { sitcJudgeCalibration, type SitcJudgeCalibration } from "./sitc-schema.js";

function toTriple(r: SitcJudgeCalibration): CalibrationTriple {
  return {
    id: String(r.id),
    championImg: r.championImg,
    challengerImg: r.challengerImg,
    targetImg: r.targetImg,
    human: r.humanAnswer === "challenger" ? "challenger" : "champion",
  };
}

export class DrizzleJudgeCalibrationStore implements JudgeCalibrationStore {
  private get db() {
    return getDb();
  }

  async loadTriples(): Promise<CalibrationTriple[]> {
    const rows = await this.db.select().from(sitcJudgeCalibration);
    return rows.map(toTriple);
  }

  /**
   * Append the replay verdicts as an audit log (judge answer + agreement + when).
   * The table is the durable record of judge health over time; the admin "Judge
   * health" panel (DESIGN §11) reads the latest `checkedAt` rows to surface drift.
   */
  async recordResults(rows: CalibrationRow[]): Promise<void> {
    if (!rows.length) return;
    await this.db.insert(sitcJudgeCalibration).values(
      rows.map((r) => ({
        championImg: r.championImg,
        challengerImg: r.challengerImg,
        targetImg: r.targetImg,
        humanAnswer: r.humanAnswer,
        judgeAnswer: r.judgeAnswer,
        agreed: r.agreed,
        checkedAt: r.checkedAt,
      })),
    );
  }
}
