import type { APIRoute } from "astro";
import { getAllSubdomains, getSiteBySubdomain, getLatestHealthCheck, getHealthCheckStats } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const hours = parseInt(url.searchParams.get("hours") || "24", 10);
    const subdomains = await getAllSubdomains();

    const businesses = await Promise.all(
      subdomains.map(async (subdomain) => {
        const site = await getSiteBySubdomain(subdomain);
        if (!site) return null;

        const config = site.config as any;
        let stats, latest;

        try {
          [stats, latest] = await Promise.all([
            getHealthCheckStats(site.id, hours),
            getLatestHealthCheck(site.id),
          ]);
        } catch {
          stats = { total: 0, healthy: 0, degraded: 0, unhealthy: 0, uptimePercent: 100, avgLatencyMs: 0 };
          latest = null;
        }

        return {
          subdomain,
          businessName: config?.business?.name || subdomain,
          industry: site.industry,
          status: latest?.status ?? "unknown",
          checks: latest?.checks ?? {},
          stats,
          lastCheckedAt: latest?.checkedAt ?? null,
        };
      })
    );

    return new Response(
      JSON.stringify({ businesses: businesses.filter(Boolean) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/global-status" }, "Error fetching global status");
    return new Response(
      JSON.stringify({ error: "Failed to fetch global status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
