import type { APIRoute } from "astro";
import { getBlogsBySiteId, getSiteBySubdomain } from "@mshorizon/db";

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

    // Get all blogs (including drafts) for admin, optionally filtered by lang
    const blogs = await getBlogsBySiteId(site.id, false, lang);

    return new Response(
      JSON.stringify({ blogs }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error listing blogs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to list blogs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
