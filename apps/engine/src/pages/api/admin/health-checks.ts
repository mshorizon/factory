import type { APIRoute } from "astro";
import { getSiteBySubdomain, getHealthChecksBySiteId, getHealthCheckStats, getLatestHealthCheck } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const businessId = url.searchParams.get("business");
    const hours = parseInt(url.searchParams.get("hours") || "24", 10);

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

    const [stats, latest, history] = await Promise.all([
      getHealthCheckStats(site.id, hours),
      getLatestHealthCheck(site.id),
      getHealthChecksBySiteId(site.id, 200),
    ]);

    return new Response(
      JSON.stringify({ stats, latest, history }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/health-checks" }, "Error fetching health checks");
    return new Response(
      JSON.stringify({ error: "Failed to fetch health checks" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
