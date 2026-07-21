import type { APIRoute } from "astro";
import {
  getActiveGoal,
  upsertActiveGoal,
  updateGoalAvoidList,
  getCurrentStep,
  updateGoalStepStatus,
} from "@mshorizon/db";
import type { StepStatus } from "@mshorizon/db";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** The canonical response shape: the active goal + its one live step. */
async function snapshot() {
  const goal = await getActiveGoal();
  const currentStep = goal ? await getCurrentStep(goal.id) : null;
  return { goal, currentStep };
}

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth) return new Response("Unauthorized", { status: 401 });
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
  if (!locals.auth) return new Response("Unauthorized", { status: 401 });

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
      default:
        return json({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};
