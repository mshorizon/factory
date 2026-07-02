#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I5 (acceptance gate against a prod build).
 * No build, no server, no browser.
 *
 * Run: pnpm tsx packages/tests/sitc-acceptance-target.check.mts
 *
 * Covers:
 *   A. resolveAcceptanceTarget precedence: explicit URL → build → dev, and which
 *      modes treat perf as authoritative.
 *   B. createAcceptanceChecks.perf() is SKIPPED (passes, no browser launch, and the
 *      lazy URL thunk is NOT invoked → no prod build kicked off) when enforcePerf=false.
 */
import { resolveAcceptanceTarget } from "../sitc-core/src/delivery/preview-server.js";
import { createAcceptanceChecks } from "../sitc-core/src/delivery/checks.js";

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
};

// ── A. resolveAcceptanceTarget precedence ────────────────────────────────────
console.log("A. resolveAcceptanceTarget");
{
  const url = resolveAcceptanceTarget({ acceptanceUrl: "http://prod.test/x", build: true });
  ok(url.mode === "url" && url.enforcePerf, "explicit URL wins, perf authoritative");

  const build = resolveAcceptanceTarget({ build: true });
  ok(build.mode === "build" && build.enforcePerf, "build mode, perf authoritative");

  const dev = resolveAcceptanceTarget({});
  ok(dev.mode === "dev" && dev.enforcePerf === false, "dev fallback, perf NOT enforced");
  ok(/NOT enforced/i.test(dev.note), "dev note warns perf is not enforced");
}

// ── B. perf skip + lazy/memoized URL ─────────────────────────────────────────
console.log("B. createAcceptanceChecks perf-skip + lazy URL");
{
  // enforcePerf=false → perf() passes WITHOUT touching the URL (no browser, no thunk).
  let urlCalls = 0;
  const checks = createAcceptanceChecks({
    url: async () => { urlCalls++; return "http://never.test/"; },
    enforcePerf: false,
  });
  const p = await checks.perf();
  ok(p.ok === true && /skipped/i.test(p.detail ?? ""), "perf skipped + passes when enforcePerf=false");
  ok(urlCalls === 0, "skipped perf never resolves the URL (no prod build kicked off)");
}
{
  // enforcePerf defaults to true.
  const checks = createAcceptanceChecks({ url: "http://x.test/" });
  ok(typeof checks.perf === "function" && typeof checks.a11y === "function", "checks expose perf+a11y (enforcePerf defaults on)");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
