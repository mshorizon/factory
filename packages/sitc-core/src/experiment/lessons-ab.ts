/**
 * Lessons-on vs lessons-off A/B (tasks I1 — does the learning store actually
 * compound? DESIGN §9 / §18-G).
 *
 * The whole reason SITC exists over a single `clone-template` pass is the claim
 * "run 5 converges faster than run 1." That claim has never been measured. This
 * module turns two finished runs against the SAME target — one with lessons
 * retrieved into the worker prompt, one with retrieval disabled
 * (SITC_DISABLE_LESSONS=1) — into a transparent verdict on iterations-to-threshold.
 *
 * Pure + deterministic (no IO, no model) → unit-testable with synthetic metrics;
 * the operator feeds it two real `metrics.json` artifacts via scripts/sitc-lessons-ab.mts.
 */
import type { RunMetrics } from "../pipeline/run.js";

export type Arm = "lessons-on" | "lessons-off";

/** One arm of the experiment — a finished run's metrics tagged with its condition. */
export interface ArmMetrics extends RunMetrics {
  arm: Arm;
  runId?: number;
  template?: string;
  targetUrl?: string;
}

/** Turn a finished run's `RunMetrics` (FullRunResult.metrics) into an arm. */
export function toArmMetrics(arm: Arm, metrics: RunMetrics, meta?: { runId?: number; template?: string; targetUrl?: string }): ArmMetrics {
  return { arm, ...metrics, ...meta };
}

export interface SectionDelta {
  sectionId: string;
  /** Round each arm first locked the section; null = never reached threshold. */
  onIters: number | null;
  offIters: number | null;
  /** offIters − onIters when both locked: positive = lessons converged FASTER. */
  itersSaved: number | null;
  /** Final score per arm (for the "not worse" guard). */
  onScore: number;
  offScore: number;
  /** onScore − offScore (positive = lessons ended higher). */
  scoreDelta: number;
  /** "only-on" / "only-off": a section one arm locked and the other never did. */
  lockedAdvantage: "both" | "only-on" | "only-off" | "neither";
}

export type Verdict = "lessons-help" | "lessons-hurt" | "inconclusive";

export interface AbComparison {
  perSection: SectionDelta[];
  /** off-arm id → on-arm id pairs unified by positional match (I32 identity drift). */
  renames: Record<string, string>;
  /** Sections both arms locked. */
  bothLocked: string[];
  /** Mean rounds saved over sections both arms locked (positive = lessons faster). */
  meanItersSaved: number | null;
  /** Median rounds saved over sections both arms locked. */
  medianItersSaved: number | null;
  /** Sections only the lessons arm managed to lock (− the reverse). */
  netExtraLocked: number;
  /** Worker-invocation delta (off − on): positive = lessons used fewer = cheaper. */
  invocationsSaved: number;
  /** Mean final-score delta (on − off) over all shared sections. */
  meanScoreDelta: number;
  verdict: Verdict;
  /** Human-readable justification of the verdict. */
  rationale: string;
}

export interface CompareOptions {
  /** A section is "worse" only if its final score drops by more than this (scoring noise). */
  scoreEpsilon?: number;
  /** Mean rounds-saved must exceed this to count as a real speedup. */
  itersEpsilon?: number;
}

/**
 * todo I32 — section identity `type#index` is NOT stable across runs: as the
 * template JSON evolves, section 3 can read `about#3` in one run and `features#3`
 * in the next, so a naive id union treats one unit as two half-empty rows and
 * corrupts every per-section delta. Align the OFF arm's ids onto the ON arm's:
 * exact matches first; then a leftover off-id pairs with the UNIQUE leftover
 * on-id sharing its positional `#index` (position is stable unless sections are
 * added/removed — and an ambiguous position is left alone rather than guessed).
 * Chrome units (`navbar`/`footer`, no `#index`) only ever match exactly.
 */
export function alignArmSectionIds(on: ArmMetrics, off: ArmMetrics): { off: ArmMetrics; renames: Record<string, string> } {
  const idxOf = (id: string) => id.match(/#(\d+)$/)?.[1] ?? null;
  const onIds = Object.keys(on.finalScores);
  const offIds = Object.keys(off.finalScores);
  const leftoverOn = onIds.filter((id) => !offIds.includes(id));
  const leftoverOff = offIds.filter((id) => !onIds.includes(id));
  const renames: Record<string, string> = {};
  for (const offId of leftoverOff) {
    const i = idxOf(offId);
    if (i == null) continue;
    const candidates = leftoverOn.filter((onId) => idxOf(onId) === i);
    if (candidates.length === 1) renames[offId] = candidates[0];
  }
  if (!Object.keys(renames).length) return { off, renames };
  const remap = <T,>(rec: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(rec).map(([k, v]) => [renames[k] ?? k, v]));
  return {
    off: { ...off, finalScores: remap(off.finalScores), iterationsToLock: remap(off.iterationsToLock) },
    renames,
  };
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/**
 * Compare the two arms. Conservative by design: lessons must show a real
 * iterations speedup (or lock strictly more sections) AND not regress final
 * quality beyond scoring noise. Anything ambiguous returns `inconclusive` — the
 * point is an honest falsification test, not to flatter the feature.
 */
export function compareLessonsAb(on: ArmMetrics, offRaw: ArmMetrics, opts: CompareOptions = {}): AbComparison {
  const scoreEps = opts.scoreEpsilon ?? 0.02;
  const itersEps = opts.itersEpsilon ?? 0.5;

  // I32 — unify drifted section identities before any per-section math.
  const { off, renames } = alignArmSectionIds(on, offRaw);

  const sectionIds = [...new Set([...Object.keys(on.finalScores), ...Object.keys(off.finalScores)])].sort();
  const perSection: SectionDelta[] = sectionIds.map((id) => {
    const onIters = on.iterationsToLock[id] ?? null;
    const offIters = off.iterationsToLock[id] ?? null;
    const onScore = on.finalScores[id] ?? 0;
    const offScore = off.finalScores[id] ?? 0;
    const bothLocked = onIters != null && offIters != null;
    let lockedAdvantage: SectionDelta["lockedAdvantage"];
    if (onIters != null && offIters != null) lockedAdvantage = "both";
    else if (onIters != null) lockedAdvantage = "only-on";
    else if (offIters != null) lockedAdvantage = "only-off";
    else lockedAdvantage = "neither";
    return {
      sectionId: id,
      onIters,
      offIters,
      itersSaved: bothLocked ? (offIters as number) - (onIters as number) : null,
      onScore,
      offScore,
      scoreDelta: onScore - offScore,
      lockedAdvantage,
    };
  });

  const bothLocked = perSection.filter((d) => d.lockedAdvantage === "both").map((d) => d.sectionId);
  const savedArr = perSection.filter((d) => d.itersSaved != null).map((d) => d.itersSaved as number);
  const meanItersSaved = mean(savedArr);
  const medianItersSaved = median(savedArr);
  const netExtraLocked =
    perSection.filter((d) => d.lockedAdvantage === "only-on").length -
    perSection.filter((d) => d.lockedAdvantage === "only-off").length;
  const invocationsSaved = off.workerInvocations - on.workerInvocations;
  const meanScoreDelta = mean(perSection.map((d) => d.scoreDelta)) ?? 0;

  // ── verdict ────────────────────────────────────────────────────────────────
  const regressedQuality = perSection.some((d) => d.scoreDelta < -scoreEps);
  const fasterConvergence = meanItersSaved != null && meanItersSaved > itersEps;
  const locksMore = netExtraLocked > 0;
  const locksFewer = netExtraLocked < 0;
  const slowerConvergence = meanItersSaved != null && meanItersSaved < -itersEps;

  let verdict: Verdict;
  let rationale: string;
  if ((locksMore || fasterConvergence) && !locksFewer && !regressedQuality) {
    verdict = "lessons-help";
    const bits: string[] = [];
    if (locksMore) bits.push(`locked ${netExtraLocked} more section(s)`);
    if (fasterConvergence) bits.push(`converged ${meanItersSaved!.toFixed(1)} round(s) faster on average`);
    if (invocationsSaved > 0) bits.push(`used ${invocationsSaved} fewer worker invocation(s)`);
    rationale = `Lessons helped: ${bits.join(", ")}; no section regressed beyond ±${scoreEps} score noise.`;
  } else if (locksFewer || slowerConvergence || regressedQuality) {
    verdict = "lessons-hurt";
    const bits: string[] = [];
    if (locksFewer) bits.push(`locked ${-netExtraLocked} fewer section(s)`);
    if (slowerConvergence) bits.push(`converged ${(-meanItersSaved!).toFixed(1)} round(s) slower on average`);
    if (regressedQuality) bits.push(`at least one section's final score dropped > ${scoreEps}`);
    rationale = `Lessons hurt or were net-negative: ${bits.join(", ")}.`;
  } else {
    verdict = "inconclusive";
    rationale =
      `No meaningful difference: mean rounds saved ${meanItersSaved == null ? "n/a" : meanItersSaved.toFixed(1)} ` +
      `(< ±${itersEps} threshold), net extra locked ${netExtraLocked}, mean score delta ${meanScoreDelta.toFixed(3)}. ` +
      `Run more arms/targets, or the lessons store may not be earning its complexity.`;
  }

  return {
    perSection,
    renames,
    bothLocked,
    meanItersSaved,
    medianItersSaved,
    netExtraLocked,
    invocationsSaved,
    meanScoreDelta,
    verdict,
    rationale,
  };
}

/** Markdown report for the operator / Git review. */
export function renderAbReport(on: ArmMetrics, off: ArmMetrics, cmp: AbComparison): string {
  const ctx = on.template || off.template || "?";
  const tgt = on.targetUrl || off.targetUrl || "?";
  const verdictIcon = cmp.verdict === "lessons-help" ? "✅" : cmp.verdict === "lessons-hurt" ? "❌" : "➖";
  const fmt = (n: number | null, d = 0) => (n == null ? "—" : n.toFixed(d));

  const rows = cmp.perSection
    .map((d) => {
      const flag =
        d.lockedAdvantage === "only-on" ? " 🟢on-only" : d.lockedAdvantage === "only-off" ? " 🔴off-only" : "";
      return `| ${d.sectionId} | ${d.onIters ?? "—"} | ${d.offIters ?? "—"} | ${fmt(d.itersSaved)} | ${d.onScore.toFixed(3)} | ${d.offScore.toFixed(3)} | ${d.scoreDelta >= 0 ? "+" : ""}${d.scoreDelta.toFixed(3)}${flag} |`;
    })
    .join("\n");

  return `# SITC — Lessons A/B report

**Target:** ${tgt}  ·  **Template:** ${ctx}
**Arms:** lessons-on = run #${on.runId ?? "?"} · lessons-off = run #${off.runId ?? "?"}

## Verdict: ${verdictIcon} ${cmp.verdict}

${cmp.rationale}

### Aggregate
| Metric | lessons-on | lessons-off |
| :-- | --: | --: |
| sections locked | ${on.lockedCount}/${on.sectionCount} | ${off.lockedCount}/${off.sectionCount} |
| worker invocations | ${on.workerInvocations} | ${off.workerInvocations} |
| rounds | ${on.rounds} | ${off.rounds} |
| promotions | ${on.promotions} | ${off.promotions} |

- **Mean rounds saved (lessons-on):** ${fmt(cmp.meanItersSaved, 2)}  ·  **median:** ${fmt(cmp.medianItersSaved, 1)}
- **Net extra sections locked:** ${cmp.netExtraLocked >= 0 ? "+" : ""}${cmp.netExtraLocked}
- **Worker invocations saved:** ${cmp.invocationsSaved >= 0 ? "+" : ""}${cmp.invocationsSaved}
- **Mean final-score delta (on − off):** ${cmp.meanScoreDelta >= 0 ? "+" : ""}${cmp.meanScoreDelta.toFixed(3)}

### Per-section (iterations-to-threshold)
| section | on iters | off iters | rounds saved | on score | off score | Δ score |
| :-- | --: | --: | --: | --: | --: | --: |
${rows}

> "rounds saved" = off − on over sections **both** arms locked (positive = lessons converged faster).
> A section locked by only one arm is flagged (🟢on-only / 🔴off-only) and excluded from the rounds-saved mean.
${Object.keys(cmp.renames).length ? `> Identity drift unified (I32): ${Object.entries(cmp.renames).map(([o, n]) => `${o}→${n}`).join(", ")} (matched by position).\n` : ""}`;
}
