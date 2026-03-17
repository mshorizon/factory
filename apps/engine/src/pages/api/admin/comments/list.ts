import type { APIRoute } from "astro";
import { getCommentsBySiteId, getSiteBySubdomain } from "@mshorizon/db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const businessId = url.searchParams.get("business");
    const status = url.searchParams.get("status") || undefined;

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "Missing business parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get comments with blog info
    const commentsWithBlog = await getCommentsBySiteId(site.id, status);

    // Transform to include blog title
    const comments = commentsWithBlog.map(({ comment, blog }) => ({
      ...comment,
      blogTitle: blog.title,
      blogSlug: blog.slug,
    }));

    return new Response(
      JSON.stringify({ comments }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing comments:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list comments" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
