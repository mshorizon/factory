import type { APIRoute } from "astro";
import { deleteBlog } from "@mshorizon/db";

export const DELETE: APIRoute = async ({ request }) => {
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
    console.error("Error deleting blog:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete blog" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
