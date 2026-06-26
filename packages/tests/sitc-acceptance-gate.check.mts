#!/usr/bin/env tsx
/**
 * Verification for the acceptanceGate resilience fix (live-run finding): a check that
 * THROWS (unreachable preview) must fail the gate → needs_review, not crash the run.
 *
 * Run: pnpm tsx packages/tests/sitc-acceptance-gate.check.mts
 */
import { acceptanceGate, type AcceptanceChecks } from "../sitc-core/src/delivery/gates.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const passing = { ok: true, detail: "ok" };

// all pass
{
  const checks: AcceptanceChecks = { perf: async () => passing, a11y: async () => passing, responsive: async () => passing, hygiene: async () => passing };
  const r = await acceptanceGate(checks);
  ok(r.pass && r.failures.length === 0, "all checks ok → gate passes");
}

// a throwing check (e.g. ERR_CONNECTION_REFUSED) → gate FAILS, does not throw
{
  const checks: AcceptanceChecks = {
    perf: async () => passing,
    a11y: async () => { throw new Error("page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4321/"); },
    responsive: async () => { throw new Error("net::ERR_CONNECTION_REFUSED"); },
    hygiene: async () => passing,
  };
  let threw = false;
  const r = await acceptanceGate(checks).catch(() => { threw = true; return null as any; });
  ok(!threw, "acceptanceGate does NOT propagate the throw (no run crash)");
  ok(r && !r.pass, "throwing checks → gate fails (→ needs_review)");
  ok(r.failures.some((f: string) => /a11y: errored/.test(f)) && r.failures.some((f: string) => /responsive: errored/.test(f)), "errored checks reported by name");
}

// a normal non-ok result still fails the gate
{
  const checks: AcceptanceChecks = { perf: async () => ({ ok: false, detail: "LCP too high" }), a11y: async () => passing, responsive: async () => passing, hygiene: async () => passing };
  const r = await acceptanceGate(checks);
  ok(!r.pass && r.failures[0].includes("LCP too high"), "non-ok result still fails with its detail");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
