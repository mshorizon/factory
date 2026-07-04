/**
 * Runner configuration (todo I29).
 *
 * THE GAP THIS CLOSES: 27 scattered `SITC_*` env reads, with every quality
 * feature (judge gate, mobile guard, prod acceptance build, delivery PR,
 * escalation) defaulting OFF — so the *recommended* configuration had likely
 * never actually run, and nothing printed what a run was actually configured as.
 *
 * One typed resolver:
 *   • `SITC_PROFILE=live` turns the quality features ON as a bundle;
 *   • an EXPLICIT env value always wins over the profile (e.g. live profile +
 *     `SITC_SCORE_MOBILE=0` keeps the mobile guard off);
 *   • `renderConfigLines` prints the effective config at startup so the operator
 *     sees what the run will do, not what they hoped the flags meant.
 */
export type SitcProfile = "default" | "live";

export interface RunnerConfig {
  profile: SitcProfile;
  /** Autonomous claude -p worker with Edit/Write (governance gate). NEVER profile-implied. */
  workerEnabled: boolean;
  model: string;
  escalationModel: string;
  engineUrl: string;
  worktreeRoot?: string;
  renderTimeoutMs: number;
  // learning
  lessonsDisabled: boolean;
  distillDisabled: boolean;
  // quality features (live profile turns these on)
  judgeGate: boolean;
  /** True only when SITC_JUDGE_GATE=1 was set EXPLICITLY (→ fail-closed, todo I30). */
  judgeGateExplicit: boolean;
  scoreMobile: boolean;
  acceptanceBuild: boolean;
  escalate: boolean;
  prescore: boolean;
  // delivery
  deliveryPush: boolean;
  deliveryPr: boolean;
  gitRemote: string;
  // knobs
  acceptanceUrl?: string;
  maxUsd?: number;
  minCoverage?: number;
  regressionMaxTemplates?: number;
}

type Env = Record<string, string | undefined>;

/** "1" → true, "0" → false, unset → fallback. */
function flag(env: Env, key: string, fallback: boolean): boolean {
  const v = env[key];
  if (v === "1") return true;
  if (v === "0") return false;
  return fallback;
}

function num(env: Env, key: string): number | undefined {
  const v = env[key];
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function resolveRunnerConfig(env: Env): RunnerConfig {
  const profile: SitcProfile = env.SITC_PROFILE === "live" ? "live" : "default";
  const live = profile === "live";
  const model = env.SITC_MODEL ?? "sonnet";
  return {
    profile,
    // Governance: the autonomous worker is an explicit operator action — a profile
    // must never be able to switch it on.
    workerEnabled: env.SITC_ENABLE_WORKER === "1",
    model,
    escalationModel: env.SITC_ESCALATION_MODEL ?? model,
    engineUrl: env.SITC_ENGINE_URL ?? "http://localhost:4321",
    worktreeRoot: env.SITC_WORKTREE_ROOT || undefined,
    renderTimeoutMs: num(env, "SITC_RENDER_TIMEOUT_MS") ?? 60_000,
    lessonsDisabled: env.SITC_DISABLE_LESSONS === "1",
    distillDisabled: env.SITC_DISABLE_DISTILL === "1",
    judgeGate: flag(env, "SITC_JUDGE_GATE", live),
    judgeGateExplicit: env.SITC_JUDGE_GATE === "1",
    scoreMobile: flag(env, "SITC_SCORE_MOBILE", live),
    acceptanceBuild: flag(env, "SITC_ACCEPTANCE_BUILD", live),
    escalate: flag(env, "SITC_ESCALATE", live),
    prescore: flag(env, "SITC_PRESCORE", true),
    // Pushing develop triggers a prod deploy — outward-facing, never profile-implied.
    deliveryPush: env.SITC_DELIVERY_PUSH === "1",
    // A PR is the review-first lane; live profile opens one so needs_review runs
    // stop parking branches for hand cherry-picks (todo #4 evidence).
    deliveryPr: flag(env, "SITC_DELIVERY_PR", live),
    gitRemote: env.SITC_GIT_REMOTE ?? "origin",
    acceptanceUrl: env.SITC_ACCEPTANCE_URL || undefined,
    maxUsd: num(env, "SITC_MAX_USD"),
    minCoverage: num(env, "SITC_MIN_COVERAGE"),
    regressionMaxTemplates: num(env, "SITC_REGRESSION_MAX_TEMPLATES"),
  };
}

/** Effective-config printout for run start (one compact block, operator-facing). */
export function renderConfigLines(c: RunnerConfig): string[] {
  const onOff = (b: boolean) => (b ? "ON" : "off");
  return [
    `profile=${c.profile}  worker=${c.workerEnabled ? "LIVE" : "disabled (plan only)"}  model=${c.model}${c.escalate ? `  escalation=${c.escalationModel}` : ""}`,
    `gates: judge=${onOff(c.judgeGate)}${c.judgeGate ? (c.judgeGateExplicit ? " (explicit → fail-closed)" : " (profile → skip-if-unseeded)") : ""}  mobile-guard=${onOff(c.scoreMobile)}  acceptance=${c.acceptanceUrl ? `url:${c.acceptanceUrl}` : c.acceptanceBuild ? "prod-build" : "dev (perf off)"}`,
    `loop: prescore=${onOff(c.prescore)}  lessons=${c.lessonsDisabled ? "OFF (A/B off-arm)" : "on"}  distill=${onOff(!c.distillDisabled)}  render-timeout=${c.renderTimeoutMs}ms${c.minCoverage != null ? `  min-coverage=${c.minCoverage}` : ""}${c.maxUsd != null ? `  max-usd=$${c.maxUsd}` : ""}`,
    `delivery: push=${onOff(c.deliveryPush)}  pr=${onOff(c.deliveryPr)}  remote=${c.gitRemote}`,
  ];
}
