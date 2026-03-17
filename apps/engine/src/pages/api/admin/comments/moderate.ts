import type { APIRoute } from "astro";
import { moderateComment, deleteComment } from "@mshorizon/db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { commentId, action, moderatedBy } = body;

    if (!commentId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      await deleteComment(commentId);
      return new Response(
        JSON.stringify({ success: true, message: "Comment deleted" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate action
    const validActions = ["approved", "rejected", "spam"];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be: approved, rejected, spam, or delete" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = await moderateComment(
      commentId,
      action as "approved" | "rejected" | "spam",
      moderatedBy || "admin"
    );

    return new Response(
      JSON.stringify({ success: true, comment: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error moderating comment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to moderate comment" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
