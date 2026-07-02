/**
 * Pairwise A/B judge with order-symmetric voting (DESIGN §7.2 / §7.2a).
 *
 * Productionized from the Phase −1 spike (which measured 100% order-stability,
 * 90% agreement). The SELECT decision: show champion + challenger + target and
 * ask which is closer — in BOTH slot orders. Promote only when both orders
 * agree; disagreement ("too close to call") keeps the champion. Absolute scores
 * (scorer/vlm) are for tracking/threshold, NOT promotion.
 */
import type { WorkerRunner } from "../types.js";

export type PairwiseWinner = "champion" | "challenger" | "tie";

export interface PairwiseResult {
  winner: PairwiseWinner;
  /** True iff both slot orders agreed (positional-bias-free for this triple). */
  orderStable: boolean;
  verdicts: { order: "AB" | "BA"; closer: "champion" | "challenger"; reason?: string }[];
}

export interface PairwiseInput {
  champion: string;
  challenger: string;
  target: string;
}

interface RawVerdict {
  closer: "first" | "second";
  reason?: string;
}

function prompt(targetPath: string, firstPath: string, secondPath: string): string {
  return `You are judging website-section DESIGN similarity. Read three screenshots:
TARGET:  ${targetPath}
FIRST:   ${firstPath}
SECOND:  ${secondPath}
Which candidate (FIRST or SECOND) is closer to TARGET in DESIGN LANGUAGE — layout/composition, color system, typography, structure, overall style? Ignore exact photo content, copy text, and vertical position/cropping.
Output NOTHING except one JSON object on the final line: {"closer":"first"|"second","reason":"<short>"}`;
}

export async function pairwiseJudge(
  runner: WorkerRunner,
  input: PairwiseInput,
  opts: { model?: string } = {},
): Promise<PairwiseResult> {
  const { champion, challenger, target } = input;
  const ask = async (firstIsChampion: boolean) => {
    const first = firstIsChampion ? champion : challenger;
    const second = firstIsChampion ? challenger : champion;
    const v = await runner.runJson<RawVerdict>(prompt(target, first, second), {
      images: [target, first, second],
      allowedTools: ["Read"],
      model: opts.model,
    });
    // map "first"/"second" → champion/challenger
    const closer: "champion" | "challenger" =
      v.closer === "first" ? (firstIsChampion ? "champion" : "challenger") : firstIsChampion ? "challenger" : "champion";
    return { closer, reason: v.reason };
  };

  const ab = await ask(true); // FIRST=champion
  const ba = await ask(false); // FIRST=challenger
  const orderStable = ab.closer === ba.closer;
  const winner: PairwiseWinner = orderStable ? ab.closer : "tie";

  return {
    winner,
    orderStable,
    verdicts: [
      { order: "AB", closer: ab.closer, reason: ab.reason },
      { order: "BA", closer: ba.closer, reason: ba.reason },
    ],
  };
}
