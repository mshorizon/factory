import type { APIRoute } from "astro";
import { getDb, initDb, getSiteBySubdomain } from "@mshorizon/db";
import { sql } from "drizzle-orm";
import logger from "../../lib/logger";

interface CheckResult {
  status: "up" | "down";
  latencyMs: number;
  error?: string;
}

export const GET: APIRoute = async ({ url }) => {
  const start = Date.now();
  const businessId = url.searchParams.get("business") || null;

  const checks: Record<string, CheckResult> = {};

  // Check database
  try {
    const dbStart = Date.now();
    initDb(import.meta.env.DATABASE_URL);
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "up", latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: "down", latencyMs: Date.now() - start, error: String(error) };
    logger.error({ err: error }, "Health check: database down");
  }

  // Check business exists (if specified)
  if (businessId && checks.database.status === "up") {
    try {
      const site = await getSiteBySubdomain(businessId);
      checks.business = site
        ? { status: "up", latencyMs: 0 }
        : { status: "down", latencyMs: 0, error: "Business not found" };
    } catch (error) {
      checks.business = { status: "down", latencyMs: 0, error: String(error) };
    }
  }

  // Check R2 (config availability)
  checks.r2 = {
    status: import.meta.env.R2_ENDPOINT ? "up" : "down",
    latencyMs: 0,
    ...(import.meta.env.R2_ENDPOINT ? {} : { error: "R2_ENDPOINT not configured" }),
  };

  // Determine overall status
  const allUp = Object.values(checks).every((c) => c.status === "up");
  const dbUp = checks.database.status === "up";
  const overallStatus = !dbUp ? "unhealthy" : allUp ? "healthy" : "degraded";
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return new Response(
    JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      businessId,
      checks,
      latencyMs: Date.now() - start,
      version: "0.0.1",
    }),
    {
      status: httpStatus,
      headers: { "Content-Type": "application/json" },
    }
  );
};
