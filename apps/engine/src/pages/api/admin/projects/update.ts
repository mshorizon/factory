import type { APIRoute } from "astro";
import { updateProject, getProjectBySlug, getSiteBySubdomain } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId, projectId, project } = body;

    if (!businessId || !projectId || !project) {
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

    const existingProject = await getProjectBySlug(site.id, project.slug || "");

    let publishedAt = project.publishedAt;
    if (project.status === "published" && (!existingProject || existingProject.status !== "published")) {
      publishedAt = new Date();
    }

    const updated = await updateProject(projectId, {
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
      JSON.stringify({ success: true, project: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/projects/update" }, "Error updating project");
    return new Response(
      JSON.stringify({ error: "Failed to update project" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
