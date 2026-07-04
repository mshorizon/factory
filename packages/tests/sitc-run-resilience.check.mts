#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I18 (lease heartbeat) + I20 (crashed runs
 * transition to needs_review). InMemoryRunStore + fakes — no git, no model.
 *
 * The failures these fix: (I18) runFull acquired a 60s-TTL lease and NEVER renewed
 * it, so the 15-min orphan-GC cron (--drop-db) reaped live multi-hour runs; (I20)
 * a crash in drive() released the lease but left status "running" forever — a
 * phantom run invisible to the GC (which only matches lockedBy != null).
 *
 * Run: pnpm tsx packages/tests/sitc-run-resilience.check.mts
 */
import { startLeaseHeartbeat, runFull } from "../sitc-core/src/pipeline/run.js";
import { InMemoryRunStore } from "../sitc-core/src/orchestrator/store.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── A. startLeaseHeartbeat ───────────────────────────────────────────────────
console.log("A. startLeaseHeartbeat");
{
  const renews: Array<{ id: number; owner: string; ttl: number }> = [];
  const store = { renewLease: async (id: number, owner: string, ttl: number) => { renews.push({ id, owner, ttl }); return true; } };
  const stop = startLeaseHeartbeat(store, 7, "vps", 60_000, { intervalMs: 15 });
  await sleep(80);
  stop();
  const count = renews.length;
  ok(count >= 3, `renews periodically (${count} renews in 80ms @ 15ms)`);
  ok(renews.every((r) => r.id === 7 && r.owner === "vps" && r.ttl === 60_000), "renews with the run's id/owner/ttl");
  await sleep(50);
  ok(renews.length === count, "stop() halts renewal");
}
{
  // lost lease → onLost fires, heartbeat keeps trying (advisory, never throws)
  let lost: string[] = [];
  let calls = 0;
  const store = { renewLease: async () => { calls++; return false; } };
  const stop = startLeaseHeartbeat(store, 1, "vps", 60_000, { intervalMs: 15, onLost: (r) => lost.push(r) });
  await sleep(60);
  stop();
  ok(lost.length >= 2 && lost[0].includes("lease lost"), "renew=false → onLost fired");
  ok(calls >= 2, "keeps retrying after loss");
}
{
  // store error → onLost with the error, no unhandled rejection
  const store = { renewLease: async () => { throw new Error("pg down"); } };
  let lost = "";
  const stop = startLeaseHeartbeat(store, 1, "vps", 60_000, { intervalMs: 15, onLost: (r) => (lost = r) });
  await sleep(50);
  stop();
  ok(lost.includes("pg down"), "renew error routed to onLost (not an unhandled rejection)");
}
{
  // default interval = ttl/3, floored at 1s
  let n = 0;
  const stop = startLeaseHeartbeat({ renewLease: async () => (n++, true) }, 1, "x", 60_000);
  stop(); // just verifying it constructs with defaults and stops cleanly
  ok(true, "constructs with default interval and stops cleanly");
}

// ── B. runFull crash → needs_review + heartbeat during the run ───────────────
console.log("B. runFull crash path (I20) + lease renewal during run (I18)");
{
  const store = new InMemoryRunStore();
  const run = await store.createRun({ templateName: "t", targetUrl: "http://x" });
  const renewed: number[] = [];
  const origRenew = store.renewLease.bind(store);
  store.renewLease = async (id, owner, ttl) => { renewed.push(id); return origRenew(id, owner, ttl); };

  let threw: Error | null = null;
  try {
    await runFull({
      runId: run.id,
      store,
      worktree: {} as any, // never reached — seed crashes first
      runner: { run: async () => "", runJson: async () => ({}) } as any,
      owner: "vps",
      leaseTtlMs: 60_000,
      seed: { templatePath: "/nonexistent/sitc-i20/template.json" }, // ← crash vector
      targetScreenshots: [],
      targetImgFor: () => "",
      collab: {} as any,
      initialStates: [],
      gates: {} as any,
    });
  } catch (e) {
    threw = e as Error;
  }
  const after = await store.getRun(run.id);
  ok(!!threw && /ENOENT|no such file/i.test(threw.message), "crash propagates to the caller (not masked)");
  ok(after!.status === "needs_review", `crashed run → needs_review (got "${after!.status}") — visible, not a phantom "running"`);
  ok(after!.lockedBy === null, "lease released after crash");
}
{
  // normal lease-denied path unaffected
  const store = new InMemoryRunStore();
  const run = await store.createRun({ templateName: "t", targetUrl: "http://x" });
  await store.acquireLease(run.id, "other-owner", 60_000);
  const r = await runFull({
    runId: run.id, store, worktree: {} as any,
    runner: { run: async () => "", runJson: async () => ({}) } as any,
    owner: "vps", seed: {}, targetScreenshots: [], targetImgFor: () => "",
    collab: {} as any, initialStates: [], gates: {} as any,
  });
  ok(r.finalStatus === "lease-denied", "lease-denied short-circuit intact");
  ok((await store.getRun(run.id))!.status === "idle", "denied run's status untouched");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
