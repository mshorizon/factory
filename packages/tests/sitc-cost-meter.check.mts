#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I9 (live cost/ROI telemetry).
 * No model — pure usage parsing + meter accumulation/attribution.
 *
 * Run: pnpm tsx packages/tests/sitc-cost-meter.check.mts
 *
 * Covers:
 *   A. parseClaudeUsage — pulls cost/tokens/cache/duration from a claude -p JSON
 *      envelope; missing fields → 0.
 *   B. CostMeter — accumulates totals; attributes by label via AsyncLocalStorage,
 *      correctly under CONCURRENT scopes; unscoped → "other".
 *   C. runCostRoi — cost-per-promotion / per-locked-section, cache-read share.
 */
import { parseClaudeUsage } from "../sitc-core/src/claude-worker.js";
import { CostMeter, runCostRoi } from "../sitc-core/src/cost-meter.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const tick = () => new Promise((r) => setTimeout(r, 15));

// ── A. parseClaudeUsage ──────────────────────────────────────────────────────
console.log("A. parseClaudeUsage");
{
  const u = parseClaudeUsage({
    type: "result", total_cost_usd: 0.0123, duration_ms: 8400,
    usage: { input_tokens: 12000, output_tokens: 800, cache_read_input_tokens: 9000 },
    result: "{}",
  });
  ok(u.costUsd === 0.0123, "cost parsed");
  ok(u.inputTokens === 12000 && u.outputTokens === 800, "tokens parsed");
  ok(u.cacheReadTokens === 9000, "cache-read tokens parsed");
  ok(u.durationMs === 8400, "duration parsed");

  const empty = parseClaudeUsage({ result: "x" });
  ok(empty.costUsd === 0 && empty.inputTokens === 0 && empty.cacheReadTokens === 0, "missing fields → 0");
  const junk = parseClaudeUsage({ total_cost_usd: "NaN", usage: { input_tokens: "oops" } });
  ok(junk.costUsd === 0 && junk.inputTokens === 0, "non-numeric → 0");
}

// ── B. CostMeter accumulation + labeled attribution ──────────────────────────
console.log("B. CostMeter");
{
  const m = new CostMeter();
  const usage = (cost: number, inTok: number, outTok: number, cache = 0) => ({ costUsd: cost, inputTokens: inTok, outputTokens: outTok, cacheReadTokens: cache, durationMs: 100 });

  // concurrent scopes — ALS must attribute each record to its own scope
  await Promise.all([
    m.scope("mutate", async () => { await tick(); m.record(usage(0.01, 1000, 100)); }),
    m.scope("score", async () => { await tick(); m.record(usage(0.002, 400, 50)); }),
    m.scope("judge", async () => { await tick(); m.record(usage(0.003, 500, 60, 300)); }),
  ]);
  m.record(usage(0.001, 100, 10)); // unscoped → "other"

  const s = m.snapshot();
  ok(s.calls === 4, `4 calls (got ${s.calls})`);
  ok(Math.abs(s.costUsd - 0.016) < 1e-9, `total cost summed (got ${s.costUsd})`);
  ok(s.totalTokens === 1000 + 100 + 400 + 50 + 500 + 60 + 100 + 10, "total tokens summed");
  ok(s.byLabel.mutate.costUsd === 0.01 && s.byLabel.mutate.calls === 1, "mutate attributed under concurrency");
  ok(s.byLabel.score.costUsd === 0.002, "score attributed correctly (no cross-talk)");
  ok(s.byLabel.judge.totalTokens === 560, "judge tokens attributed");
  ok(s.byLabel.other.calls === 1, "unscoped call → 'other'");
  ok(s.cacheReadTokens === 300, "cache-read tokens accumulated");
  ok(/\$0\.0160 · /.test(m.line()), `line() compact summary (got "${m.line()}")`);
}

// ── C. runCostRoi ────────────────────────────────────────────────────────────
console.log("C. runCostRoi");
{
  const snap = { calls: 10, costUsd: 0.5, inputTokens: 1000, outputTokens: 200, cacheReadTokens: 3000, totalTokens: 1200, durationMs: 0, byLabel: {} };
  const roi = runCostRoi(snap, { promotions: 5, lockedCount: 2 });
  ok(roi.usdPerPromotion === 0.1, "usd/promotion = 0.5/5");
  ok(roi.usdPerLockedSection === 0.25, "usd/locked = 0.5/2");
  ok(roi.cacheReadShare === Math.round((3000 / 4000) * 1000) / 1000, "cache-read share = cache/(input+cache)");

  const none = runCostRoi(snap, { promotions: 0, lockedCount: 0 });
  ok(none.usdPerPromotion === null && none.usdPerLockedSection === null, "no promotions/locked → null (no div-by-zero)");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
