import type { APIRoute } from "astro";
import { getBlogsBySiteId, getSiteBySubdomain } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
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

    // Get all blogs (including drafts and standalone) for admin, optionally filtered by lang
    const blogs = await getBlogsBySiteId(site.id, false, lang, true);

    return new Response(
      JSON.stringify({ blogs }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/blogs/list" }, "Error listing blogs");
    return new Response(
      JSON.stringify({ error: "Failed to list blogs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
