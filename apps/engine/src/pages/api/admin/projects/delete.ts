import type { APIRoute } from "astro";
import { deleteProject } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await deleteProject(projectId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/projects/delete" }, "Error deleting project");
    return new Response(
      JSON.stringify({ error: "Failed to delete project" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
