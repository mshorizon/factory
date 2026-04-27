import type { APIRoute } from "astro";
import { getDb, initDb, insertHealthCheck, sites } from "@mshorizon/db";
import { eq, sql } from "drizzle-orm";
import { processHealthAlert } from "../../../lib/alerts";
import logger from "../../../lib/logger";

/**
 * Uptime monitoring cron endpoint.
 * Call every 5 minutes via external cron (e.g. cron-job.org):
 *   GET https://specialist.hazelgrouse.pl/api/cron/uptime?secret=CRON_SECRET
 *
 * Checks: DB connectivity, R2 config, per-site HTTP reachability.
 * Records results to health_checks table. Triggers alerts on failure.
 */
export const GET: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get("secret");
  const expectedSecret = import.meta.env.CRON_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const runStart = Date.now();
  initDb(import.meta.env.DATABASE_URL);

  // --- Infrastructure checks ---
  const infraChecks: Record<string, { status: "up" | "down"; latencyMs: number; error?: string }> = {};

  try {
    const dbStart = Date.now();
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    infraChecks.database = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (error) {
    infraChecks.database = { status: "down", latencyMs: 0, error: String(error) };
    logger.error({ err: error }, "Uptime check: database down");
  }

  infraChecks.r2 = {
    status: import.meta.env.R2_ENDPOINT ? "up" : "down",
    latencyMs: 0,
    ...(import.meta.env.R2_ENDPOINT ? {} : { error: "R2_ENDPOINT not configured" }),
  };

  // Can't check sites if DB is down
  if (infraChecks.database.status === "down") {
    logger.error("Uptime check aborted: database unreachable");
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        infraChecks,
        sites: {},
        latencyMs: Date.now() - runStart,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // --- Per-site checks ---
  const db = getDb();
  const releasedSites = await db
    .select()
    .from(sites)
    .where(eq(sites.status, "released"));

  const siteResults: Record<string, { status: string; latencyMs: number }> = {};
  const baseUrl = import.meta.env.PROD
    ? "https://{sub}.hazelgrouse.pl"
    : "https://{sub}.dev.hazelgrouse.pl";

  for (const site of releasedSites) {
    const siteStart = Date.now();
    const checks = { ...infraChecks } as Record<string, { status: "up" | "down"; latencyMs: number; error?: string }>;

    // HTTP check — verifies Traefik routing + Astro server responds
    const siteUrl = baseUrl.replace("{sub}", site.subdomain);
    try {
      const httpStart = Date.now();
      const res = await fetch(`${siteUrl}/api/health?business=${site.subdomain}`, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "HazelgrouseUptimeBot/1.0" },
      });
      checks.http = {
        status: res.ok ? "up" : "down",
        latencyMs: Date.now() - httpStart,
        ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
      };
    } catch (error) {
      checks.http = { status: "down", latencyMs: 0, error: String(error) };
      logger.warn({ subdomain: site.subdomain, err: error }, "HTTP uptime check failed");
    }

    const allUp = Object.values(checks).every((c) => c.status === "up");
    const criticalDown = checks.database.status === "down" || checks.http?.status === "down";
    const status: "healthy" | "degraded" | "unhealthy" = allUp
      ? "healthy"
      : criticalDown
        ? "unhealthy"
        : "degraded";

    const healthCheck = await insertHealthCheck({
      siteId: site.id,
      status,
      checks,
      latencyMs: Date.now() - siteStart,
    });

    if (status !== "healthy") {
      processHealthAlert(site.subdomain, healthCheck).catch((err) =>
        logger.error({ err, subdomain: site.subdomain }, "processHealthAlert failed")
      );
    }

    siteResults[site.subdomain] = { status, latencyMs: Date.now() - siteStart };
    logger.info({ subdomain: site.subdomain, status }, "Uptime check recorded");
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      infraChecks,
      sites: siteResults,
      latencyMs: Date.now() - runStart,
      checkedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
