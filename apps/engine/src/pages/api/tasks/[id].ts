import type { APIRoute } from "astro";
import {
  getTaskById,
  updateTaskStatus,
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
    const { status } = body ?? {};

    if (!status || !TASK_STATUSES.includes(status as TaskStatus)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status. Must be one of: ${TASK_STATUSES.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = await updateTaskStatus(id, status as TaskStatus);
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
