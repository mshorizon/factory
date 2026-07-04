/**
 * Pre-score-then-lock (todo I23).
 *
 * THE COST THIS REMOVES: units were only scored when a challenger rendered, so
 * the scheduler kept re-rolling sections whose champion ALREADY matched the
 * target — run 41 spent $7.78 of $8.65 on 15 mutate calls, 4/6 units repeatedly
 * self-reporting "already matches", and `metrics.json` showed finalScore 0 for
 * sections that actually matched.
 *
 * Before the sweep: render each unit's CURRENT champion once, score it against
 * the target crop, and
 *   • lock units already ≥ threshold (no mutate tokens spent on them, and their
 *     metrics carry a real score instead of a misleading 0);
 *   • seed `championImg` for the rest, so their FIRST challenger must WIN the
 *     pairwise judgment instead of auto-promoting (previously any first render
 *     was promoted even if worse than the seed);
 *   • seed the section's first critique with the champion's VLM gap description,
 *     so the first mutate starts steered instead of blind.
 *
 * Failures degrade per-unit: a render/score error leaves that unit exactly as it
 * was (score 0, unlocked, no champion image) — the sweep then treats it as before.
 */
import type { SectionState } from "./scheduler.js";
import type { HybridScore } from "../scorer/score.js";

export interface PreScoreDeps {
  /** Render the CURRENT champion of a unit (e.g. via the I2 base worktree engine). */
  renderChampion: (sectionId: string) => Promise<string>;
  score: (ctx: { ourImg: string; targetImg: string }) => Promise<HybridScore>;
  targetImgFor: (sectionId: string) => string;
  log?: (m: string) => void;
}

export interface PreScoreResult {
  /** Same array (mutated states) for chaining into the sweep input. */
  states: SectionState[];
  /** Champion render per unit — feeds runSweep's `championImg` seed. */
  championImg: Record<string, string | null>;
  /** Champion critique per unit — feeds the unit's first mutate. */
  critiques: Record<string, string>;
  /** Units locked without spending a single mutate call. */
  locked: string[];
}

export async function preScoreAndLock(states: SectionState[], deps: PreScoreDeps): Promise<PreScoreResult> {
  const log = deps.log ?? (() => {});
  const championImg: Record<string, string | null> = {};
  const critiques: Record<string, string> = {};
  const locked: string[] = [];
  for (const st of states) {
    if (st.locked || st.frozen) continue;
    try {
      const img = await deps.renderChampion(st.sectionId);
      const score = await deps.score({ ourImg: img, targetImg: deps.targetImgFor(st.sectionId) });
      st.score = score.score;
      championImg[st.sectionId] = img;
      if (score.vlm?.critique) critiques[st.sectionId] = score.vlm.critique;
      if (st.score >= st.threshold) {
        st.locked = true;
        locked.push(st.sectionId);
        log(`prescore: ${st.sectionId} already matches (${st.score.toFixed(3)} ≥ ${st.threshold}) — locked, no mutate spend`);
      } else {
        log(`prescore: ${st.sectionId} ${st.score.toFixed(3)} < ${st.threshold} — in play`);
      }
    } catch (e) {
      // Per-unit degrade: unit stays exactly as seeded (sweep behaves as before).
      log(`prescore: ${st.sectionId} skipped (${String(e).slice(0, 120)})`);
    }
  }
  return { states, championImg, critiques, locked };
}
