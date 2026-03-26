import type { APIRoute } from "astro";
import { deleteBlog } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { blogId } = body;

    if (!blogId) {
      return new Response(
        JSON.stringify({ error: "Missing blogId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await deleteBlog(blogId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/blogs/delete" }, "Error deleting blog");
    return new Response(
      JSON.stringify({ error: "Failed to delete blog" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
