import type { APIRoute } from "astro";
import { getSiteBySubdomain, getBusinessFilesBySiteId } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const businessId = url.searchParams.get("business");

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

    const files = await getBusinessFilesBySiteId(site.id);

    return new Response(
      JSON.stringify({ files }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/files/list" }, "Error listing files");
    return new Response(
      JSON.stringify({ error: "Failed to list files" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
