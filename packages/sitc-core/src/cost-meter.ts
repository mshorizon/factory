/**
 * Live cost / ROI meter (tasks I9 / §18-H, CONCLUSIONS #7).
 *
 * The pre-launch `estimateRunCost` guesses €/time; this measures the REAL burn as
 * the run proceeds. `claude -p --output-format json` reports `total_cost_usd` +
 * token usage per call (previously discarded — see claude-worker `onUsage`); the
 * meter accumulates it, attributes each call to a label (mutate / score / judge /
 * other) via AsyncLocalStorage so attribution is correct even under concurrent
 * workers, and exposes a snapshot for live logging + end-of-run ROI
 * (cost-per-promotion, cost-per-locked-section, cache-read share for I10).
 */
import { AsyncLocalStorage } from "node:async_hooks";

export interface CallUsage {
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  /** Prompt-cache reads — high share ⇒ the warm authoring kit is being reused (I10). */
  cacheReadTokens: number;
  durationMs: number;
}

interface LabelTotals {
  calls: number;
  costUsd: number;
  totalTokens: number;
  /** Tracked per-label so cache-read share is computable per call-type (I10). */
  inputTokens: number;
  cacheReadTokens: number;
}

export interface CostSnapshot {
  calls: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  durationMs: number;
  byLabel: Record<string, LabelTotals>;
}

export class CostMeter {
  private readonly als = new AsyncLocalStorage<string>();
  private calls = 0;
  private costUsd = 0;
  private inputTokens = 0;
  private outputTokens = 0;
  private cacheReadTokens = 0;
  private durationMs = 0;
  private readonly byLabel = new Map<string, LabelTotals>();

  /** Run `fn` tagged with `label`; any `record()` during it is attributed there. */
  scope<T>(label: string, fn: () => Promise<T>): Promise<T> {
    return this.als.run(label, fn);
  }

  /** Record one worker call's usage (called from the worker's onUsage sink). */
  record(u: CallUsage): void {
    this.calls++;
    this.costUsd += u.costUsd;
    this.inputTokens += u.inputTokens;
    this.outputTokens += u.outputTokens;
    this.cacheReadTokens += u.cacheReadTokens;
    this.durationMs += u.durationMs;
    const label = this.als.getStore() ?? "other";
    const t = this.byLabel.get(label) ?? { calls: 0, costUsd: 0, totalTokens: 0, inputTokens: 0, cacheReadTokens: 0 };
    t.calls++;
    t.costUsd += u.costUsd;
    t.totalTokens += u.inputTokens + u.outputTokens;
    t.inputTokens += u.inputTokens;
    t.cacheReadTokens += u.cacheReadTokens;
    this.byLabel.set(label, t);
  }

  snapshot(): CostSnapshot {
    return {
      calls: this.calls,
      costUsd: Math.round(this.costUsd * 1e6) / 1e6,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      cacheReadTokens: this.cacheReadTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      durationMs: this.durationMs,
      byLabel: Object.fromEntries([...this.byLabel].map(([k, v]) => [k, { ...v, costUsd: Math.round(v.costUsd * 1e6) / 1e6 }])),
    };
  }

  /** Compact one-line live-burn string. */
  line(): string {
    const s = this.snapshot();
    return `$${s.costUsd.toFixed(4)} · ${(s.totalTokens / 1000).toFixed(1)}k tok · ${s.calls} calls`;
  }
}

export interface RunCostRoi {
  costUsd: number;
  totalTokens: number;
  calls: number;
  /** Share of input that hit the prompt cache (0..1) — proxy for warm-kit reuse (I10). */
  cacheReadShare: number;
  /** USD per promotion / per locked section — the ROI the budget should optimize. */
  usdPerPromotion: number | null;
  usdPerLockedSection: number | null;
}

/**
 * Cache-read share per call-type (I10): cacheRead / (input + cacheRead). The
 * `mutate` label carries the big static authoring kit (§4.2), so a high share there
 * means the warm kit IS being prompt-cached across `claude -p` spawns; ~0 means each
 * spawn re-sends it uncached (a per-iteration token tax to fix by front-loading the
 * stable prefix). Run the direct cross-spawn probe with `scripts/sitc-cache-probe.mts`.
 */
export function cacheReadShareByLabel(snapshot: CostSnapshot): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [label, t] of Object.entries(snapshot.byLabel)) {
    const denom = t.inputTokens + t.cacheReadTokens;
    out[label] = denom > 0 ? Math.round((t.cacheReadTokens / denom) * 1000) / 1000 : 0;
  }
  return out;
}

/** Derive end-of-run ROI from the meter + the run's I1 metrics counts. */
export function runCostRoi(snapshot: CostSnapshot, counts: { promotions: number; lockedCount: number }): RunCostRoi {
  const denomInput = snapshot.inputTokens + snapshot.cacheReadTokens;
  return {
    costUsd: snapshot.costUsd,
    totalTokens: snapshot.totalTokens,
    calls: snapshot.calls,
    cacheReadShare: denomInput > 0 ? Math.round((snapshot.cacheReadTokens / denomInput) * 1000) / 1000 : 0,
    usdPerPromotion: counts.promotions > 0 ? Math.round((snapshot.costUsd / counts.promotions) * 1e4) / 1e4 : null,
    usdPerLockedSection: counts.lockedCount > 0 ? Math.round((snapshot.costUsd / counts.lockedCount) * 1e4) / 1e4 : null,
  };
}
