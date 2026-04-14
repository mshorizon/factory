import type { APIRoute } from "astro";
import { createBlog, getSiteBySubdomain } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId, blog } = body;

    if (!businessId || !blog) {
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

    // Validate required blog fields
    if (!blog.slug || !blog.title || !blog.content) {
      return new Response(
        JSON.stringify({ error: "Missing required blog fields (slug, title, content)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set publishedAt if status is published
    const publishedAt = blog.status === "published" ? new Date() : null;

    // Determine default language from site's primary language setting
    const siteTranslations = (site.translations || {}) as Record<string, any>;
    const sitePrimaryLang = siteTranslations._settings?.primaryLanguage || "pl";

    const newBlog = await createBlog({
      siteId: site.id,
      slug: blog.slug,
      lang: blog.lang || sitePrimaryLang,
      title: blog.title,
      description: blog.description || null,
      content: blog.content,
      image: blog.image || null,
      author: blog.author || null,
      category: blog.category || null,
      tags: blog.tags || [],
      status: blog.status || "draft",
      standalone: blog.standalone || false,
      publishedAt,
      metaTitle: blog.metaTitle || null,
      metaDescription: blog.metaDescription || null,
    });

    return new Response(
      JSON.stringify({ success: true, blog: newBlog }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/blogs/create" }, "Error creating blog");
    return new Response(
      JSON.stringify({ error: "Failed to create blog" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
