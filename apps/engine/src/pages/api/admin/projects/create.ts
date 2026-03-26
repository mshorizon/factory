import type { APIRoute } from "astro";
import { createProject, getSiteBySubdomain } from "@mshorizon/db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { businessId, project } = body;

    if (!businessId || !project) {
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

    if (!project.slug || !project.title) {
      return new Response(
        JSON.stringify({ error: "Missing required project fields (slug, title)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const publishedAt = project.status === "published" ? new Date() : null;

    const newProject = await createProject({
      siteId: site.id,
      slug: project.slug,
      lang: project.lang || "en",
      title: project.title,
      description: project.description || null,
      image: project.image || null,
      category: project.category || null,
      tags: project.tags || [],
      status: project.status || "draft",
      publishedAt,
    });

    return new Response(
      JSON.stringify({ success: true, project: newProject }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create project" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
