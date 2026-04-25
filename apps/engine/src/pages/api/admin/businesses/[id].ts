import type { APIRoute } from "astro";
import {
  getSiteById,
  updateSiteStatus,
  deleteSiteById,
  getBusinessFilesBySiteId,
  listTasks,
  getHealthCheckStats,
  getLatestHealthCheck,
} from "@mshorizon/db";
import { deleteFromR2 } from "../../../../lib/r2";
import { getAuthFromCookies } from "../../../../lib/auth";
import logger from "../../../../lib/logger";

const forbidden = () =>
  new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });

const notFound = () =>
  new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const GET: APIRoute = async ({ params, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  const id = parseInt(params.id ?? "", 10);
  if (isNaN(id)) return notFound();

  try {
    const site = await getSiteById(id);
    if (!site) return notFound();

    const [files, allTasks, stats, latest] = await Promise.all([
      getBusinessFilesBySiteId(site.id).catch(() => []),
      listTasks().catch(() => []),
      getHealthCheckStats(site.id, 168).catch(() => ({
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        uptimePercent: 100,
        avgLatencyMs: 0,
      })),
      getLatestHealthCheck(site.id).catch(() => null),
    ]);

    const siteTasks = allTasks.filter((t) => t.domain === site.subdomain);

    return json({
      site: {
        ...site,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
        lastDeployedAt: site.lastDeployedAt?.toISOString() ?? null,
      },
      files,
      tasks: siteTasks.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      uptime: {
        stats,
        latestCheck: latest
          ? { ...latest, checkedAt: latest.checkedAt.toISOString() }
          : null,
      },
    });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "GET /api/admin/businesses/[id] failed");
    return json({ error: "Failed to fetch business detail" }, 500);
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  const id = parseInt(params.id ?? "", 10);
  if (isNaN(id)) return notFound();

  try {
    const site = await getSiteById(id);
    if (!site) return notFound();

    const body = await request.json();
    const { status } = body ?? {};

    if (status) {
      const updated = await updateSiteStatus(site.subdomain, status);
      return json({ site: updated });
    }

    return json({ error: "Nothing to update" }, 400);
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "PATCH /api/admin/businesses/[id] failed");
    return json({ error: "Failed to update business" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  const id = parseInt(params.id ?? "", 10);
  if (isNaN(id)) return notFound();

  try {
    const site = await getSiteById(id);
    if (!site) return notFound();

    // Delete all R2 files for this business first
    const files = await getBusinessFilesBySiteId(site.id).catch(() => []);
    await Promise.allSettled(files.map((f) => deleteFromR2(f.r2Key)));

    await deleteSiteById(id);

    return json({ success: true });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "DELETE /api/admin/businesses/[id] failed");
    return json({ error: "Failed to delete business" }, 500);
  }
};
