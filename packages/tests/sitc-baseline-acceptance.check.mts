#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I16 (baseline-relative a11y/hygiene gates).
 * Pure diff helpers only — no browser. The exact regression this fixes: runs 40/41
 * failed FOREVER on pre-existing footer-iframe a11y violations + a google.com
 * console error that exist on develop, so auto-merge could never fire.
 *
 * Run: pnpm tsx packages/tests/sitc-baseline-acceptance.check.mts
 */
import { diffA11yViolations, diffHygiene, normalizeConsoleError, type A11yViolation, type HygieneProbe } from "../sitc-core/src/delivery/checks.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const v = (id: string, impact = "serious", nodes = 1): A11yViolation => ({ id, impact, nodes });
const probe = (p: Partial<HygieneProbe> = {}): HygieneProbe => ({ title: "Site", lang: "pl", imgsNoAlt: 0, leaked: 0, consoleErrors: [], ...p });

// ── A. diffA11yViolations ────────────────────────────────────────────────────
console.log("A. diffA11yViolations");
{
  ok(!diffA11yViolations([v("color-contrast")]).ok, "absolute mode: any violation fails");
  ok(diffA11yViolations([]).ok, "absolute mode: clean passes");

  // the run-40/41 case: identical pre-existing violations on both sides
  const preExisting = [v("color-contrast"), v("frame-title"), v("list")];
  const r = diffA11yViolations(preExisting, preExisting);
  ok(r.ok, "pre-existing violations (also on baseline) pass");
  ok(r.detail.includes("3 pre-existing suppressed"), "detail reports suppression");

  ok(!diffA11yViolations([...preExisting, v("image-alt")], preExisting).ok, "NEW rule id vs baseline fails");
  ok(diffA11yViolations([v("color-contrast", "serious", 9)], [v("color-contrast", "serious", 2)]).ok, "same rule id, more nodes → tolerated (rule-id granularity)");
  ok(diffA11yViolations([], preExisting).ok, "challenger cleaner than baseline passes");
}

// ── B. normalizeConsoleError ─────────────────────────────────────────────────
console.log("B. normalizeConsoleError");
{
  const a = normalizeConsoleError("Failed to load resource: https://google.com/maps?x=123 (port 4321)");
  const b = normalizeConsoleError("Failed to load resource: https://google.com/maps?x=999 (port 5000)");
  ok(a === b, "URLs + numbers normalized to match across renders");
  ok(normalizeConsoleError("x".repeat(300)).length === 100, "capped at 100 chars");
}

// ── C. diffHygiene ───────────────────────────────────────────────────────────
console.log("C. diffHygiene");
{
  ok(diffHygiene(probe()).ok, "absolute: clean passes");
  ok(!diffHygiene(probe({ imgsNoAlt: 2 })).ok, "absolute: any img-without-alt fails");

  // the google.com iframe console error present on develop too
  const err = "Failed to load https://google.com/frame";
  const r = diffHygiene(probe({ consoleErrors: [err] }), probe({ consoleErrors: [err] }));
  ok(r.ok, "pre-existing console error (also on baseline) passes");
  ok(r.detail.includes("suppressed"), "detail reports suppression");

  ok(!diffHygiene(probe({ consoleErrors: [err, "TypeError: boom"] }), probe({ consoleErrors: [err] })).ok, "NEW console error vs baseline fails");
  ok(diffHygiene(probe({ imgsNoAlt: 3, leaked: 2 }), probe({ imgsNoAlt: 3, leaked: 2 })).ok, "equal pre-existing counts pass");
  ok(!diffHygiene(probe({ imgsNoAlt: 4 }), probe({ imgsNoAlt: 3 })).ok, "count grew vs baseline → fails");
  ok(diffHygiene(probe({ imgsNoAlt: 1 }), probe({ imgsNoAlt: 3 })).ok, "count shrank → passes");
  ok(!diffHygiene(probe({ title: "" }), probe()).ok, "title lost vs baseline → fails");
  ok(diffHygiene(probe({ title: "" }), probe({ title: "" })).ok, "title empty on both → pre-existing, passes");
  ok(!diffHygiene(probe({ lang: "" })).ok, "absolute: missing lang fails");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
