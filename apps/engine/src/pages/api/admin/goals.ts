import type { APIRoute } from "astro";
import {
  getActiveGoal,
  upsertActiveGoal,
  updateGoalAvoidList,
  getCurrentStepWithTask,
  updateGoalStepStatus,
  createTask,
  linkStepTask,
} from "@mshorizon/db";
import type { StepStatus } from "@mshorizon/db";
import logger from "../../../lib/logger";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** The canonical response shape: the active goal, its one live step, and that step's task. */
async function snapshot() {
  const goal = await getActiveGoal();
  if (!goal) return { goal: null, currentStep: null, task: null };
  const cur = await getCurrentStepWithTask(goal.id);
  return { goal, currentStep: cur?.step ?? null, task: cur?.task ?? null };
}

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    return json(await snapshot());
  } catch (err) {
    return json({ error: "Failed to load goal" }, 500);
  }
};

const VERB_TO_STATUS: Record<string, StepStatus> = {
  accept: "accepted",
  resolve: "resolved",
  skip: "skipped",
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") {
    return new Response("Forbidden", { status: 403 });
  }

  let body: {
    action: string;
    title?: string;
    avoidList?: string | null;
    id?: string;
    verb?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    switch (body.action) {
      case "set-goal": {
        const title = (body.title ?? "").trim();
        if (!title) return json({ error: "title is required" }, 400);
        await upsertActiveGoal({ title });
        return json(await snapshot());
      }
      case "update-avoidlist": {
        const goal = await getActiveGoal();
        if (!goal) return json({ error: "No active goal" }, 400);
        await updateGoalAvoidList(goal.id, body.avoidList ?? null);
        return json(await snapshot());
      }
      case "step-action": {
        const status = VERB_TO_STATUS[body.verb ?? ""];
        if (!body.id || !status) {
          return json({ error: "Invalid step action or missing id" }, 400);
        }
        await updateGoalStepStatus(body.id, status);
        return json(await snapshot());
      }
      case "run-step": {
        // Enqueue an accepted CODE step into the pnpm tasks runner (FR-012). This is the
        // explicit second action after Accept — the only place a pending task is created.
        if (!body.id) return json({ error: "missing id" }, 400);
        const goal = await getActiveGoal();
        if (!goal) return json({ error: "No active goal" }, 400);
        const cur = await getCurrentStepWithTask(goal.id);
        const step = cur?.step;
        if (!step || step.id !== body.id) return json({ error: "Not the current step" }, 400);
        if (step.type !== "code") return json({ error: "run-step is only for code steps" }, 400);
        if (step.status !== "accepted") return json({ error: "Step must be accepted first" }, 400);
        if (step.taskId) return json({ error: "Step already has a task" }, 400);
        const task = await createTask({
          domain: locals.businessId ?? "studio",
          template: "goals",
          location: `goals/${step.id}`,
          description: `${step.title}\n\n${step.rationale ?? ""}`.trim(),
          isAdminPanel: false,
        });
        await linkStepTask(step.id, task.id);
        return json(await snapshot());
      }
      default:
        return json({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "POST /api/admin/goals failed");
    return json({ error: "Goals action failed" }, 500);
  }
};
