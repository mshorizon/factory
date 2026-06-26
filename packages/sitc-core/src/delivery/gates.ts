/**
 * Delivery gates (DESIGN §7.3 regression + §7.4 acceptance).
 *
 * Both run once on the assembled template before delivery. Heavy/external checks
 * (build, render-diff, Lighthouse, axe) are injected so the gates are pure
 * orchestration and unit-testable; prod wires the real toolchain.
 */
import { isAdditiveSchemaChange } from "./schema-additive.js";

export interface GateResult {
  pass: boolean;
  failures: string[];
}

// ─── §7.3 backward-compat regression gate ────────────────────────────────────

export interface RegressionChecks {
  build(): Promise<{ ok: boolean; output?: string }>;
  validate(): Promise<{ ok: boolean; output?: string }>;
  /** Min SSIM across re-rendered existing templates vs their `develop` baseline. */
  existingTemplatesMinSsim(): Promise<number>;
}

export interface RegressionInput {
  /** Present iff the run changed business.schema.json (additive check applies). */
  schema?: { old: unknown; new: unknown };
  checks: RegressionChecks;
  /** Not pixel-identity — screenshots aren't byte-deterministic (§7.3). */
  ssimThreshold?: number;
}

export async function regressionGate(input: RegressionInput): Promise<GateResult> {
  const failures: string[] = [];
  if (input.schema) {
    const a = isAdditiveSchemaChange(input.schema.old, input.schema.new);
    if (!a.additive) failures.push(...a.violations.map((v) => `schema non-additive: ${v}`));
  }
  const build = await input.checks.build();
  if (!build.ok) failures.push(`build: ${build.output ?? "failed"}`);
  const val = await input.checks.validate();
  if (!val.ok) failures.push(`validate: ${val.output ?? "failed"}`);
  const ssim = await input.checks.existingTemplatesMinSsim();
  const thr = input.ssimThreshold ?? 0.99;
  if (ssim < thr) failures.push(`existing-template SSIM ${ssim.toFixed(3)} < ${thr}`);
  return { pass: failures.length === 0, failures };
}

// ─── §7.4 acceptance gate (non-visual) ───────────────────────────────────────

export interface AcceptanceChecks {
  perf(): Promise<{ ok: boolean; detail?: string }>;
  a11y(): Promise<{ ok: boolean; detail?: string }>;
  responsive(): Promise<{ ok: boolean; detail?: string }>;
  hygiene(): Promise<{ ok: boolean; detail?: string }>;
}

export async function acceptanceGate(checks: AcceptanceChecks): Promise<GateResult> {
  const failures: string[] = [];
  const entries: [string, () => Promise<{ ok: boolean; detail?: string }>][] = [
    ["perf", checks.perf],
    ["a11y", checks.a11y],
    ["responsive", checks.responsive],
    ["hygiene", checks.hygiene],
  ];
  for (const [name, fn] of entries) {
    // A check that THROWS (e.g. the preview URL is unreachable) must fail the gate,
    // never crash the whole run mid-delivery — route to needs_review with the branch
    // intact (consistent with the I4 safe-downgrade philosophy).
    try {
      const r = await fn();
      if (!r.ok) failures.push(`${name}: ${r.detail ?? "failed"}`);
    } catch (e) {
      failures.push(`${name}: errored — ${String((e as Error)?.message ?? e).slice(0, 160)}`);
    }
  }
  return { pass: failures.length === 0, failures };
}
