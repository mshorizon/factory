import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./client.js";
import { goals, goalSteps, STEP_STATUSES, STEP_TYPES } from "./schema.js";
import type { Goal, GoalStep, StepStatus, StepType } from "./schema.js";

// ── Goals ──────────────────────────────────────────────────────────────────

export async function getActiveGoal(): Promise<Goal | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(goals)
    .where(eq(goals.status, "active"))
    .orderBy(desc(goals.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * Set the single active north-star goal. Updates the existing active goal in
 * place (preserving its attached steps) or inserts a new one if none exists.
 */
export async function upsertActiveGoal(data: {
  title: string;
  avoidList?: string | null;
}): Promise<Goal> {
  const db = getDb();
  const existing = await getActiveGoal();
  if (existing) {
    const [row] = await db
      .update(goals)
      .set({
        title: data.title,
        ...(data.avoidList !== undefined ? { avoidList: data.avoidList } : {}),
        updatedAt: new Date(),
      })
      .where(eq(goals.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(goals)
    .values({ title: data.title, avoidList: data.avoidList ?? null, status: "active" })
    .returning();
  return row;
}

export async function updateGoalAvoidList(
  goalId: string,
  avoidList: string | null
): Promise<Goal | null> {
  const db = getDb();
  const [row] = await db
    .update(goals)
    .set({ avoidList, updatedAt: new Date() })
    .where(eq(goals.id, goalId))
    .returning();
  return row ?? null;
}

// ── Steps ──────────────────────────────────────────────────────────────────

/** The one live step for a goal — the latest `proposed` or `accepted` row. */
export async function getCurrentStep(goalId: string): Promise<GoalStep | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(goalSteps)
    .where(
      and(
        eq(goalSteps.goalId, goalId),
        inArray(goalSteps.status, ["proposed", "accepted"])
      )
    )
    .orderBy(desc(goalSteps.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * Persist a freshly-computed step. Enforces the single-active-step invariant:
 * any prior `proposed` step for this goal is superseded (→ `skipped`) first.
 */
export async function createGoalStep(data: {
  goalId: string;
  title: string;
  type: StepType;
  rationale?: string | null;
  milestoneLabel?: string | null;
}): Promise<GoalStep> {
  if (!STEP_TYPES.includes(data.type)) {
    throw new Error(`Invalid step type: ${data.type}`);
  }
  const db = getDb();
  await db
    .update(goalSteps)
    .set({ status: "skipped", resolvedAt: new Date() })
    .where(and(eq(goalSteps.goalId, data.goalId), eq(goalSteps.status, "proposed")));
  const [row] = await db
    .insert(goalSteps)
    .values({
      goalId: data.goalId,
      title: data.title,
      type: data.type,
      rationale: data.rationale ?? null,
      milestoneLabel: data.milestoneLabel ?? null,
      status: "proposed",
    })
    .returning();
  return row;
}

export async function updateGoalStepStatus(
  id: string,
  status: StepStatus
): Promise<GoalStep | null> {
  if (!STEP_STATUSES.includes(status)) {
    throw new Error(`Invalid step status: ${status}`);
  }
  const db = getDb();
  const [row] = await db
    .update(goalSteps)
    .set({ status, ...(status === "resolved" ? { resolvedAt: new Date() } : {}) })
    .where(eq(goalSteps.id, id))
    .returning();
  return row ?? null;
}
