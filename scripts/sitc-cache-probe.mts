#!/usr/bin/env tsx
/**
 * SITC — prompt-cache cross-spawn probe (tasks I10).
 *
 * Answers the question DESIGN §4.2 assumes but never tested: does a `claude -p`
 * spawn reuse the prompt cache populated by a PREVIOUS, separate `claude -p` spawn?
 * If yes, the warm authoring kit is (mostly) free to re-send each iteration; if no,
 * every spawn pays the full kit again — a large silent per-iteration token tax.
 *
 * Method: send the SAME large stable prefix twice, back-to-back, and read
 * `cache_read_input_tokens` from each call's JSON envelope. Spawn 1 primes the
 * cache (≈0 reads); spawn 2 should report large cache reads IF cross-spawn caching
 * works. A tiny unique suffix per call keeps the answer cheap/non-cached.
 *
 * Operator-run (needs `claude` authenticated on the box):
 *   pnpm tsx scripts/sitc-cache-probe.mts [--repeats 3] [--model sonnet]
 */
import { execFile } from "node:child_process";
import { parseClaudeUsage } from "../packages/sitc-core/src/claude-worker.js";

const arg = (n: string, d?: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const repeats = Math.max(2, Number(arg("repeats", "3")));
const model = arg("model", "sonnet")!;

// ~stable prefix: a chunk big enough to exceed the cache's min-cacheable size and
// make cache reads unmistakable. Identical across spawns (that's the whole point).
const STABLE_PREFIX = Array.from({ length: 120 }, (_, i) =>
  `Rule ${i}: components are industry-agnostic; use semantic tokens only (bg-primary, py-spacing-section); never hardcode colors or spacing; new variants are additive; respect locked theme/atom tiers.`,
).join("\n");

function runClaude(prompt: string): Promise<ReturnType<typeof parseClaudeUsage>> {
  return new Promise((resolve, reject) => {
    execFile("claude", ["-p", prompt, "--output-format", "json", "--model", model], { maxBuffer: 1024 * 1024 * 32 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`claude -p failed: ${stderr || err.message}`));
      try {
        resolve(parseClaudeUsage(JSON.parse(stdout)));
      } catch (e) {
        reject(new Error(`unparseable claude output: ${String(e)}`));
      }
    });
  });
}

async function main() {
  console.log(`probing prompt-cache reuse across ${repeats} sequential claude -p spawns (model=${model}) …\n`);
  const rows: Array<{ i: number; input: number; cacheRead: number; share: number }> = [];
  for (let i = 0; i < repeats; i++) {
    // identical stable prefix + a tiny unique suffix (varies only the cheap tail)
    const u = await runClaude(`${STABLE_PREFIX}\n\nReply with exactly: ok#${i}`);
    const denom = u.inputTokens + u.cacheReadTokens;
    const share = denom > 0 ? u.cacheReadTokens / denom : 0;
    rows.push({ i, input: u.inputTokens, cacheRead: u.cacheReadTokens, share });
    console.log(`spawn ${i + 1}: input=${u.inputTokens}  cache_read=${u.cacheReadTokens}  share=${(share * 100).toFixed(0)}%`);
  }

  // verdict from spawns AFTER the first (which primes the cache)
  const primed = rows.slice(1);
  const maxShare = Math.max(0, ...primed.map((r) => r.share));
  console.log("");
  if (maxShare >= 0.5) {
    console.log(`✅ CROSS-SPAWN CACHING WORKS (up to ${(maxShare * 100).toFixed(0)}% of input served from cache).`);
    console.log(`   → injecting the static authoring kit per spawn is cheap; keep the stable prefix identical + first.`);
  } else if (maxShare > 0) {
    console.log(`➖ PARTIAL caching (${(maxShare * 100).toFixed(0)}%). Some prefix is shared; tighten the stable prefix to raise it.`);
  } else {
    console.log(`❌ NO cross-spawn caching. Every spawn re-sends the full prompt uncached — a per-iteration token tax.`);
    console.log(`   → front-load the stable kit as an identical prefix, or keep a long-lived session, to recover it.`);
  }
}

main().catch((e) => { console.error("cache-probe failed:", e.message ?? e); process.exit(1); });
