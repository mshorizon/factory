import type { APIRoute } from "astro";
import {
  getStrategicSuggestions,
  updateStrategicSuggestionStatus,
  createStrategicSuggestion,
} from "@mshorizon/db";
import { createTask } from "@mshorizon/db";
import type { SuggestionStatus } from "@mshorizon/db";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const all = await getStrategicSuggestions();
    return new Response(JSON.stringify(all), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch suggestions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { action: string; id?: number; suggestion?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { action, id, suggestion } = body;

  if (action === "create" && suggestion) {
    try {
      const row = await createStrategicSuggestion({
        title: String(suggestion.title),
        rationale: String(suggestion.rationale),
        category: String(suggestion.category),
        priority: Number(suggestion.priority),
        effort: String(suggestion.effort),
        status: "pending",
        createdBy: "manual",
      });
      return new Response(JSON.stringify(row), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to create suggestion" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!id || !["accepted", "rejected", "done"].includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action or missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updated = await updateStrategicSuggestionStatus(id, action as SuggestionStatus);

    if (action === "accepted" && updated) {
      // Create a task in the task queue so Claude Code picks it up
      await createTask({
        domain: locals.businessId,
        template: "strategy",
        location: `strategy/${updated.id}`,
        page: "strategy",
        section: updated.category,
        isAdminPanel: false,
        description: `[Strategic] ${updated.title}\n\n${updated.rationale}`,
        isSuperAdmin: false,
      });
    }

    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to update suggestion" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
