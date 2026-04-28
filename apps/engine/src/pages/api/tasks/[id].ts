import type { APIRoute } from "astro";
import {
  getTaskById,
  updateTask,
  TASK_STATUSES,
  type TaskStatus,
} from "@mshorizon/db";
import { getAuthFromCookies } from "../../../lib/auth";
import logger from "../../../lib/logger";

export const PATCH: APIRoute = async ({ request, cookies, params, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing task id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await getTaskById(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (auth.role !== "super-admin" && existing.domain !== auth.businessId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { status, clarification, answer, summary } = body ?? {};

    // --- Flow: user submits answer to on_hold task ---
    if (answer !== undefined) {
      if (typeof answer !== "string" || answer.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Answer cannot be empty" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const updatedDescription =
        existing.description + `\n\n---\nClarification: ${answer.trim()}`;
      const updated = await updateTask(id, {
        status: "pending",
        description: updatedDescription,
        clarification: null,
      });
      return new Response(JSON.stringify({ task: updated }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Flow: status update (incl. on_hold with clarification) ---
    if (!status || !TASK_STATUSES.includes(status as TaskStatus)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status. Must be one of: ${TASK_STATUSES.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fields: Parameters<typeof updateTask>[1] = {
      status: status as TaskStatus,
      ...(typeof summary === "string" ? { summary: summary.trim() || null } : {}),
    };

    if (status === "on_hold") {
      if (!clarification || typeof clarification !== "string") {
        return new Response(
          JSON.stringify({ error: "clarification required when setting on_hold" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      fields.clarification = clarification.trim();
    } else {
      // Clear clarification when moving out of on_hold
      fields.clarification = null;
    }

    const updated = await updateTask(id, fields);
    return new Response(JSON.stringify({ task: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    (locals.logger ?? logger).error(
      { err: error, endpoint: "/api/tasks/[id]" },
      "Error updating task"
    );
    return new Response(JSON.stringify({ error: "Failed to update task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
