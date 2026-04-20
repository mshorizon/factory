import type { APIRoute } from "astro";
import {
  listTasks,
  createTask,
  TASK_STATUSES,
  type TaskStatus,
} from "@mshorizon/db";
import { getAuthFromCookies } from "../../../lib/auth";
import logger from "../../../lib/logger";

export const GET: APIRoute = async ({ cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const allTasks = await listTasks();
    const visible =
      auth.role === "super-admin"
        ? allTasks
        : allTasks.filter((t) => t.domain === auth.businessId);
    return new Response(JSON.stringify({ tasks: visible }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    (locals.logger ?? logger).error(
      { err: error, endpoint: "/api/tasks" },
      "Error listing tasks"
    );
    return new Response(JSON.stringify({ error: "Failed to list tasks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { domain, template, page, section, isAdminPanel, description } = body ?? {};

    if (!domain || !template || !page || !description) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields (domain, template, page, description)",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof description !== "string" || description.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Description too short" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isSuperAdmin = auth.role === "super-admin";

    if (!isSuperAdmin && auth.businessId && domain !== auth.businessId) {
      return new Response(
        JSON.stringify({ error: "Cannot create task for another domain" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const adminFlag = Boolean(isAdminPanel);
    const derivedLocation = adminFlag
      ? `admin:${page}${section ? `/${section}` : ""}`
      : `${page}${section ? `/${section}` : ""}`;

    const task = await createTask({
      domain: String(domain),
      template: String(template),
      location: derivedLocation,
      page: String(page),
      section: section ? String(section) : null,
      isAdminPanel: adminFlag,
      description: String(description).trim(),
      isSuperAdmin,
    });

    return new Response(JSON.stringify({ task }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    (locals.logger ?? logger).error(
      { err: error, endpoint: "/api/tasks" },
      "Error creating task"
    );
    return new Response(JSON.stringify({ error: "Failed to create task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export { TASK_STATUSES };
export type { TaskStatus };
