import type { APIRoute } from "astro";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import logger from "../../../lib/logger";

// GET — list template directories from the repo's templates/ folder.
// Templates are the Git-based source of truth (see CLAUDE.md). The admin
// task form uses this so newly added templates appear without code changes.
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const templatesDir = resolve(process.cwd(), "../../templates"); // monorepo root from apps/engine
    const entries = await readdir(templatesDir, { withFileTypes: true });
    const templates = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort();

    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    (locals.logger ?? logger).error(
      { err: error, endpoint: "/api/admin/templates" },
      "Error listing templates"
    );
    return new Response(JSON.stringify({ error: "Failed to list templates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
