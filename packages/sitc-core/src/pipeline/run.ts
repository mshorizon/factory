/**
 * Real run driver (DESIGN §5 end-to-end) — sequences the verified phases into
 * one run:
 *   Phase 0/A/A.5 lockTiers → Phase B runSweep → §7.3/§7.4 gates → §13.4 delivery.
 *
 * Collaborators (worker bundle, gate checks) are injected, so this is the single
 * place the pipeline is composed and is verifiable with fakes. The `Orchestrator`
 * (lease + command handling) wraps this for a managed run.
 */
import type { BusinessProfile, MutationStrategy, WorkerRunner } from "../types.js";
import type { RunStore } from "../orchestrator/store.js";
import type { WorktreeManager } from "../orchestrator/worktree.js";
import { lockTiers } from "./lock-tiers.js";
import type { SeedOptions } from "./cold-start.js";
import { runSweep, type SweepInput } from "../loop/sweep.js";
import type { SectionCollaborators } from "../loop/section-iteration.js";
import type { SectionState } from "../loop/scheduler.js";
import { allSettled } from "../loop/scheduler.js";
import { regressionGate, acceptanceGate, type RegressionChecks, type AcceptanceChecks } from "../delivery/gates.js";
import { decideDelivery, landDelivery, type DeliveryRouting, type LandingOptions } from "../delivery/delivery.js";
import type { BudgetCaps } from "../delivery/budget.js";
import { applyEvent } from "../orchestrator/state-machine.js";

export interface FullRunInput {
  runId: number;
  store: RunStore;
  worktree: WorktreeManager;
  runner: WorkerRunner;
  /** Single-owner lease holder ("vps" | "local"); guards against concurrent drivers (§13.1). */
  owner: string;
  leaseTtlMs?: number;
  seed: SeedOptions;
  /** Frozen target screenshot paths (from captureTarget). */
  targetScreenshots: string[];
  /** Measured ground-truth CSS from the target — feeds the global theme pass. */
  groundTruthStyle?: import("../scorer/capture.js").StyleProfile | null;
  /** Target image per section id (aligned crop) for the sweep's scorer/judge. */
  targetImgFor: (sectionId: string) => string;
  /** Per-section worker bundle (mutate/sanity/render/score/judge). */
  collab: SectionCollaborators;
  /** Sections to evolve. */
  initialStates: SectionState[];
  championImg?: Record<string, string | null>;
  gates: { regression: RegressionChecks; acceptance: AcceptanceChecks; schemaChanged?: { old: unknown; new: unknown } };
  /** How a converged run lands (merge+push / push+PR). Default: local no-ff merge, no push (I4). */
  landing?: LandingOptions;
  /** Persistent worktree pool (I3) — keeps code-strategy render engines warm. */
  worktreePool?: import("../orchestrator/worktree-pool.js").WorktreePool;
  maxWorkers?: number;
  budget?: BudgetCaps;
  model?: string;
  /** Coverage floor forwarded to the sweep (CONCLUSIONS #6). Default 1. */
  minCoverage?: number;
  /** Per-iteration observability (outcome/score/reason) for logging. */
  onIteration?: SweepInput["onIteration"];
}

export interface FullRunResult {
  profile: BusinessProfile;
  thresholdReached: boolean;
  strategiesUsed: MutationStrategy[];
  /** Final champion render per section (the image that won each section). */
  championImg?: Record<string, string | null>;
  /**
   * Compounding-effect telemetry (DESIGN §18-G / tasks I1). Surfaced so a run can
   * be turned into an `ArmMetrics` for the lessons-on/off A/B (experiment/lessons-ab).
   */
  metrics?: RunMetrics;
  delivery?: DeliveryRouting;
  merged?: { develop: string };
  /** Whether the landing pushed to the remote (auto-merge → develop, review → branch). */
  pushed?: boolean;
  /** PR URL when a needs_review run opened one (I4). */
  prUrl?: string | null;
  finalStatus: "done" | "needs_review" | "paused" | "aborted" | "lease-denied";
}

/** Run-level measurement (the headline I1 / §18-G numbers). */
export interface RunMetrics {
  /** Round each section first reached threshold; null = never locked. */
  iterationsToLock: Record<string, number | null>;
  /** Final absolute score per section at run end. */
  finalScores: Record<string, number>;
  /** Total per-section worker iterations dispatched (cost proxy). */
  workerInvocations: number;
  /** Sweep rounds executed. */
  rounds: number;
  /** Promotions across the run. */
  promotions: number;
  /** Sections that reached threshold / sections in play. */
  lockedCount: number;
  sectionCount: number;
}

export async function runFull(input: FullRunInput): Promise<FullRunResult> {
  const ttl = input.leaseTtlMs ?? 60_000;
  // single-owner lease (§13.1) — refuse if another driver holds the run
  if (!(await input.store.acquireLease(input.runId, input.owner, ttl))) {
    return { profile: {} as BusinessProfile, thresholdReached: false, strategiesUsed: [], finalStatus: "lease-denied" };
  }
  const cur = await input.store.getRun(input.runId);
  if (cur && cur.status === "idle") await input.store.updateRun(input.runId, { status: applyEvent("idle", "start") });

  try {
    return await drive(input);
  } finally {
    await input.store.releaseLease(input.runId, input.owner);
  }
}

async function drive(input: FullRunInput): Promise<FullRunResult> {
  // ── Phase 0/A/A.5: seed + lock theme + atoms ──────────────────────────────
  const tiers = await lockTiers({
    runner: input.runner,
    store: input.store,
    runId: input.runId,
    seed: input.seed,
    targetScreenshots: input.targetScreenshots,
    groundTruth: input.groundTruthStyle,
    model: input.model,
  });

  // ── Phase B: per-section sweep (controllable: polls pause/abort) ──────────
  const sweep = await runSweep({
    worktree: input.worktree,
    runId: input.runId,
    collab: input.collab,
    targetImgFor: input.targetImgFor,
    initialStates: input.initialStates,
    championImg: input.championImg,
    maxWorkers: input.maxWorkers,
    minCoverage: input.minCoverage,
    budget: input.budget,
    store: input.store,
    worktreePool: input.worktreePool,
    onIteration: input.onIteration,
  });

  const metrics = buildMetrics(sweep);

  // pause/abort short-circuit delivery (§16) — best-so-far is kept on the branch
  if (sweep.stoppedBy === "aborted") {
    await input.store.updateRun(input.runId, { status: "aborted" });
    return { profile: tiers.profile, thresholdReached: false, strategiesUsed: [], championImg: sweep.championImg, metrics, finalStatus: "aborted" };
  }
  if (sweep.stoppedBy === "paused") {
    await input.store.updateRun(input.runId, { status: "paused" });
    return { profile: tiers.profile, thresholdReached: false, strategiesUsed: [], championImg: sweep.championImg, metrics, finalStatus: "paused" };
  }

  const thresholdReached = allSettled(sweep.states) && sweep.states.every((s) => s.locked);
  const strategiesUsed = [...new Set(sweep.states.map((s) => s.strategy))] as MutationStrategy[];

  // ── §7.3 + §7.4 gates ─────────────────────────────────────────────────────
  const regression = await regressionGate({
    schema: input.gates.schemaChanged,
    checks: input.gates.regression,
  });
  const acceptance = await acceptanceGate(input.gates.acceptance);

  // ── §13.4 strategy-routed delivery ────────────────────────────────────────
  const delivery = decideDelivery({ strategiesUsed, thresholdReached, regression, acceptance });

  // Land it (merge+push / push+PR), downgrading auto-merge → needs_review on any
  // git failure instead of crashing the run (I4). This closes the flywheel: a clean
  // run lands on `develop` so the NEXT run seeds from the improved template.
  const landed = await landDelivery({
    repoRoot: input.worktree.repoRoot,
    runBranch: input.worktree.branchName(input.runId),
    routing: delivery,
    landing: input.landing,
  });

  const finalStatus: "done" | "needs_review" =
    delivery.decision === "auto-merge" && !landed.downgradedToReview ? "done" : "needs_review";
  await input.store.updateRun(input.runId, { status: finalStatus });

  return {
    profile: tiers.profile,
    thresholdReached,
    strategiesUsed,
    championImg: sweep.championImg,
    metrics,
    delivery: { ...delivery, reasons: [...delivery.reasons, ...landed.notes] },
    merged: landed.merged,
    pushed: landed.pushed,
    prUrl: landed.prUrl,
    finalStatus,
  };
}

/** Derive run-level I1 / §18-G telemetry from a finished sweep. */
function buildMetrics(sweep: import("../loop/sweep.js").SweepResult): RunMetrics {
  const finalScores: Record<string, number> = {};
  const iterationsToLock: Record<string, number | null> = {};
  for (const s of sweep.states) {
    finalScores[s.sectionId] = s.score;
    iterationsToLock[s.sectionId] = sweep.iterationsToLock[s.sectionId] ?? null;
  }
  return {
    iterationsToLock,
    finalScores,
    workerInvocations: sweep.workerInvocations,
    rounds: sweep.rounds,
    promotions: sweep.promotions,
    lockedCount: sweep.states.filter((s) => s.locked).length,
    sectionCount: sweep.states.length,
  };
}
