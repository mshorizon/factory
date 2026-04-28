import type { APIRoute } from "astro";
import {
  getStrategicSuggestions,
  updateStrategicSuggestionStatus,
  createStrategicSuggestion,
  getPendingStrategicSuggestions,
} from "@mshorizon/db";
import { createTask } from "@mshorizon/db";
import type { SuggestionStatus } from "@mshorizon/db";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  if (action === "generate") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const contextPath = resolve(process.cwd(), "../../CONTEXT.md");
      const contextMd = readFileSync(contextPath, "utf-8");
      const pending = await getPendingStrategicSuggestions();
      const pendingList = pending
        .map((s) => `- ${s.title} (${s.category}, priority ${s.priority})`)
        .join("\n");

      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a strategic advisor for a web agency called Hazelgrouse Studio that builds a multi-tenant "Site Factory" for local businesses.

## CONTEXT.md
${contextMd}

## Already pending strategic suggestions (do NOT duplicate these)
${pendingList || "None"}

---

Generate exactly 5 NEW strategic suggestions that will move this project forward the most right now.
Balance across: technical debt, new features, marketing, client acquisition, and infrastructure.
Avoid duplicating any already-pending suggestion listed above.

Return ONLY a valid JSON array with no preamble, no markdown, no backticks. Each element:
{
  "title": "short imperative title (max 60 chars)",
  "rationale": "1-2 sentences on why this is worth doing now",
  "category": "tech_debt" | "feature" | "marketing" | "client_acquisition" | "infrastructure",
  "priority": 1-5,
  "effort": "s" | "m" | "l" | "xl"
}`,
          },
        ],
      });

      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected response type");
      const parsed = JSON.parse(block.text.trim());
      if (!Array.isArray(parsed)) throw new Error("Response is not an array");

      const created = [];
      for (const s of parsed) {
        const row = await createStrategicSuggestion({
          title: String(s.title),
          rationale: String(s.rationale),
          category: String(s.category),
          priority: Number(s.priority),
          effort: String(s.effort),
          status: "pending",
          createdBy: "claude_manual",
        });
        created.push(row);
      }

      return new Response(JSON.stringify(created), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (action === "create" && suggestion) {
    try {
      const row = await createStrategicSuggestion({
        title: String(suggestion.title),
        rationale: String(suggestion.rationale),
        category: String(suggestion.category),
        priority: Number(suggestion.priority),
        effort: String(suggestion.effort),
        status: "pending",
        createdBy: suggestion.createdBy ? String(suggestion.createdBy) : "manual",
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
