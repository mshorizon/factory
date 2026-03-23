import type { APIRoute } from "astro";
import { updateBlog, getBlogBySlug, getSiteBySubdomain } from "@mshorizon/db";

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { businessId, blogId, blog } = body;

    if (!businessId || !blogId || !blog) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Get existing blog to check status change
    const existingBlog = await getBlogBySlug(site.id, blog.slug || "");

    // If status changed to published and publishedAt is not set, set it now
    let publishedAt = blog.publishedAt;
    if (blog.status === "published" && (!existingBlog || existingBlog.status !== "published")) {
      publishedAt = new Date();
    }

    const updated = await updateBlog(blogId, {
      slug: blog.slug,
      lang: blog.lang || "en",
      title: blog.title,
      description: blog.description || null,
      content: blog.content,
      image: blog.image || null,
      author: blog.author || null,
      category: blog.category || null,
      tags: blog.tags || [],
      status: blog.status || "draft",
      publishedAt,
      metaTitle: blog.metaTitle || null,
      metaDescription: blog.metaDescription || null,
    });

    return new Response(
      JSON.stringify({ success: true, blog: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating blog:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update blog" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
