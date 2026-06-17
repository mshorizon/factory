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
import { decideDelivery, mergeRunToDevelop, type DeliveryRouting } from "../delivery/delivery.js";
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
  /** Target image per section id (aligned crop) for the sweep's scorer/judge. */
  targetImgFor: (sectionId: string) => string;
  /** Per-section worker bundle (mutate/sanity/render/score/judge). */
  collab: SectionCollaborators;
  /** Sections to evolve. */
  initialStates: SectionState[];
  championImg?: Record<string, string | null>;
  gates: { regression: RegressionChecks; acceptance: AcceptanceChecks; schemaChanged?: { old: unknown; new: unknown } };
  maxWorkers?: number;
  budget?: BudgetCaps;
  model?: string;
  /** Per-iteration observability (outcome/score/reason) for logging. */
  onIteration?: SweepInput["onIteration"];
}

export interface FullRunResult {
  profile: BusinessProfile;
  thresholdReached: boolean;
  strategiesUsed: MutationStrategy[];
  /** Final champion render per section (the image that won each section). */
  championImg?: Record<string, string | null>;
  delivery?: DeliveryRouting;
  merged?: { develop: string };
  finalStatus: "done" | "needs_review" | "paused" | "aborted" | "lease-denied";
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
    budget: input.budget,
    store: input.store,
    onIteration: input.onIteration,
  });

  // pause/abort short-circuit delivery (§16) — best-so-far is kept on the branch
  if (sweep.stoppedBy === "aborted") {
    await input.store.updateRun(input.runId, { status: "aborted" });
    return { profile: tiers.profile, thresholdReached: false, strategiesUsed: [], championImg: sweep.championImg, finalStatus: "aborted" };
  }
  if (sweep.stoppedBy === "paused") {
    await input.store.updateRun(input.runId, { status: "paused" });
    return { profile: tiers.profile, thresholdReached: false, strategiesUsed: [], championImg: sweep.championImg, finalStatus: "paused" };
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

  let merged: { develop: string } | undefined;
  if (delivery.decision === "auto-merge") {
    const develop = await mergeRunToDevelop({
      repoRoot: input.worktree.repoRoot,
      runBranch: input.worktree.branchName(input.runId),
    });
    merged = { develop };
  }

  const finalStatus: "done" | "needs_review" = delivery.decision === "auto-merge" ? "done" : "needs_review";
  await input.store.updateRun(input.runId, { status: finalStatus });

  return { profile: tiers.profile, thresholdReached, strategiesUsed, championImg: sweep.championImg, delivery, merged, finalStatus };
}
