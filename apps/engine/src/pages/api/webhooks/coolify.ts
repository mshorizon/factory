import type { APIRoute } from "astro";
import { initDb, getAllSites, updateSiteLastDeployed, insertHealthCheck, sites } from "@mshorizon/db";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@mshorizon/db";
import { processHealthAlert, sendEmailAlert } from "../../../lib/alerts";
import logger from "../../../lib/logger";

/**
 * Coolify deploy webhook endpoint.
 *
 * In Coolify: Service → Settings → Deploy Webhook
 * Set webhook URL to:
 *   https://specialist.hazelgrouse.pl/api/webhooks/coolify?secret=CRON_SECRET
 *
 * Triggers a health check after every deploy and alerts if the deployment
 * resulted in a degraded or unhealthy state.
 */
export const POST: APIRoute = async ({ url, request }) => {
  const secret = url.searchParams.get("secret");
  const expectedSecret = import.meta.env.CRON_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    // Coolify may send empty body or non-JSON — continue anyway
  }

  logger.info({ payload }, "Coolify deploy webhook received");

  initDb(import.meta.env.DATABASE_URL);

  // Short delay to allow the new container to warm up
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  const db = getDb();
  const runStart = Date.now();

  // Infrastructure checks
  const infraChecks: Record<string, { status: "up" | "down"; latencyMs: number; error?: string }> = {};

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    infraChecks.database = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (error) {
    infraChecks.database = { status: "down", latencyMs: 0, error: String(error) };
    logger.error({ err: error }, "Post-deploy check: database down");
  }

  infraChecks.r2 = {
    status: import.meta.env.R2_ENDPOINT ? "up" : "down",
    latencyMs: 0,
    ...(import.meta.env.R2_ENDPOINT ? {} : { error: "R2_ENDPOINT not configured" }),
  };

  const releasedSites = await db
    .select()
    .from(sites)
    .where(eq(sites.status, "released"));

  const results: Record<string, string> = {};
  let anyUnhealthy = false;

  for (const site of releasedSites) {
    // Update lastDeployedAt for all released sites since Coolify deploys all of them
    await updateSiteLastDeployed(site.subdomain);

    const checks = { ...infraChecks };
    const allUp = Object.values(checks).every((c) => c.status === "up");
    const criticalDown = checks.database.status === "down";
    const status: "healthy" | "degraded" | "unhealthy" = allUp
      ? "healthy"
      : criticalDown
        ? "unhealthy"
        : "degraded";

    const healthCheck = await insertHealthCheck({
      siteId: site.id,
      status,
      checks,
      latencyMs: Date.now() - runStart,
    });

    if (status !== "healthy") {
      anyUnhealthy = true;
      processHealthAlert(site.subdomain, healthCheck).catch((err) =>
        logger.error({ err, subdomain: site.subdomain }, "processHealthAlert failed")
      );
    }

    results[site.subdomain] = status;
    logger.info({ subdomain: site.subdomain, status }, "Post-deploy health check recorded");
  }

  // Always notify studio owner on deploy
  const studioEmail = import.meta.env.STUDIO_ALERT_EMAIL || process.env.STUDIO_ALERT_EMAIL;
  if (studioEmail) {
    const deployStatus = anyUnhealthy ? "DEGRADED/UNHEALTHY" : "HEALTHY";
    const statusColor = anyUnhealthy ? "#ef4444" : "#22c55e";
    await sendEmailAlert(
      studioEmail,
      `Deploy: ${deployStatus} — Hazelgrouse Factory`,
      `<h2 style="color:${statusColor}">Deploy zakończony — ${deployStatus}</h2>
       <p>Czas: ${new Date().toLocaleString("pl-PL")}</p>
       <table border="1" cellpadding="6" style="border-collapse:collapse">
         <tr><th>Serwis</th><th>Status</th></tr>
         ${Object.entries(results).map(([sub, s]) => `<tr><td>${sub}</td><td style="color:${s === "healthy" ? "#22c55e" : "#ef4444"}">${s.toUpperCase()}</td></tr>`).join("")}
       </table>`
    );
  }

  return new Response(
    JSON.stringify({
      status: anyUnhealthy ? "degraded" : "ok",
      sites: results,
      latencyMs: Date.now() - runStart,
      checkedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
