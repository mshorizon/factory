import type { APIRoute } from "astro";
import { getProjectsBySiteId, getSiteBySubdomain } from "@mshorizon/db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const businessId = url.searchParams.get("business");
    const lang = url.searchParams.get("lang") || undefined;

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

    // Get all projects (including drafts) for admin, optionally filtered by lang
    const projects = await getProjectsBySiteId(site.id, false, lang);

    return new Response(
      JSON.stringify({ projects }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing projects:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list projects" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
