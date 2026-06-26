#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I10 (prompt-cache telemetry).
 * No model — the live cross-spawn answer comes from scripts/sitc-cache-probe.mts.
 *
 * Run: pnpm tsx packages/tests/sitc-cache-share.check.mts
 *
 * Covers:
 *   A. CostMeter tracks input + cache-read tokens PER LABEL.
 *   B. cacheReadShareByLabel = cacheRead / (input + cacheRead) per label, 0 on no data.
 */
import { CostMeter, cacheReadShareByLabel } from "../sitc-core/src/cost-meter.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const usage = (inTok: number, cache: number) => ({ costUsd: 0.001, inputTokens: inTok, outputTokens: 50, cacheReadTokens: cache, durationMs: 100 });

console.log("A. per-label input + cache-read tracking");
const m = new CostMeter();
// mutate carries the big static kit → lots of cache reads; score sends fresh images → none.
await m.scope("mutate", async () => { m.record(usage(2000, 8000)); });
await m.scope("mutate", async () => { m.record(usage(2000, 8000)); });
await m.scope("score", async () => { m.record(usage(1500, 0)); });
const snap = m.snapshot();
ok(snap.byLabel.mutate.inputTokens === 4000, "mutate input tokens summed");
ok(snap.byLabel.mutate.cacheReadTokens === 16000, "mutate cache-read tokens summed");
ok(snap.byLabel.score.cacheReadTokens === 0, "score has no cache reads");

console.log("B. cacheReadShareByLabel");
const share = cacheReadShareByLabel(snap);
ok(share.mutate === Math.round((16000 / 20000) * 1000) / 1000, `mutate share = 0.8 (got ${share.mutate})`);
ok(share.score === 0, "score share = 0 (fresh input each call)");
ok(cacheReadShareByLabel({ byLabel: {} } as any).bogus === undefined, "no labels → empty");
// a label with zero total tokens → 0, not NaN
const z = new CostMeter();
await z.scope("x", async () => z.record({ costUsd: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, durationMs: 0 }));
ok(cacheReadShareByLabel(z.snapshot()).x === 0, "zero-token label → 0 share (no NaN)");

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
