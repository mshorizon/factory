import { getDb, getAllSubdomains, getSiteBySubdomain, insertHealthCheck, getLatestHealthCheck } from "@mshorizon/db";
import { sql } from "drizzle-orm";
import logger from "./logger";
import { processHealthAlert } from "./alerts";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let initialized = false;

async function runHealthCheck(subdomain: string) {
  const start = Date.now();
  const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: "down", latencyMs: Date.now() - start, error: String(error) };
  }

  const dbUp = checks.database.status === "up";
  const allUp = Object.values(checks).every((c) => c.status === "up");
  const status = !dbUp ? "unhealthy" : allUp ? "healthy" : "degraded";

  // Get siteId and store result
  try {
    const site = await getSiteBySubdomain(subdomain);
    if (site) {
      const check = await insertHealthCheck({
        siteId: site.id,
        status,
        checks,
        latencyMs: Date.now() - start,
      });

      // Trigger alert if unhealthy/degraded
      if (status !== "healthy" && check) {
        processHealthAlert(subdomain, check).catch((err) =>
          logger.error({ err, subdomain }, "Failed to process health alert")
        );
      }
    }
  } catch (error) {
    logger.error({ err: error, subdomain }, "Failed to store health check result");
  }

  return status;
}

async function runAllChecks() {
  try {
    const subdomains = await getAllSubdomains();
    for (const subdomain of subdomains) {
      const status = await runHealthCheck(subdomain);
      if (status === "unhealthy") {
        logger.warn({ subdomain, status }, "Site health check failed");
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Health cron: failed to run checks");
  }
}

export function initHealthCron() {
  if (initialized) return;
  initialized = true;

  // Run first check after 30 seconds (let the server start)
  setTimeout(() => {
    runAllChecks();
    setInterval(runAllChecks, INTERVAL_MS);
  }, 30_000);

  logger.info({ intervalMs: INTERVAL_MS }, "Health check cron initialized");
}
