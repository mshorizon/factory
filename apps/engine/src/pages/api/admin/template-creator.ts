import type { APIRoute } from "astro";
import { getAuthFromCookies } from "../../../lib/auth";
import logger from "../../../lib/logger";
import { getDb, sitcRuns, sitcLessons, sitcJudgeCalibration, sitcCommands } from "@mshorizon/db";
import { desc, eq } from "drizzle-orm";

/**
 * Admin API for the Self-Improving Template Creator (DESIGN §11).
 * GET  → { deployed, runs, lessons, judgeHealth }  (deployed:false when the
 *         sitc_* tables aren't pushed yet — the UI shows a setup notice)
 * POST → { action: "start" | "command" }
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function forbidden(cookies: Parameters<typeof getAuthFromCookies>[0]) {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return json({ error: "Forbidden" }, 403);
  return null;
}

export const GET: APIRoute = async ({ cookies }) => {
  const denied = await forbidden(cookies);
  if (denied) return denied;
  try {
    const db = getDb();
    const [runs, lessons, calib] = await Promise.all([
      db.select().from(sitcRuns).orderBy(desc(sitcRuns.id)).limit(50),
      db.select().from(sitcLessons).where(eq(sitcLessons.archived, false)).limit(200),
      db.select().from(sitcJudgeCalibration).limit(500),
    ]);
    const checked = calib.filter((c) => c.agreed !== null);
    const judgeHealth = {
      total: calib.length,
      checked: checked.length,
      agreement: checked.length ? checked.filter((c) => c.agreed).length / checked.length : null,
    };
    return json({ deployed: true, runs, lessons, judgeHealth });
  } catch (e) {
    // Tables not pushed yet (or DB unreachable) — let the UI render a setup notice.
    return json({
      deployed: false,
      reason: String(e instanceof Error ? e.message : e).slice(0, 200),
      runs: [],
      lessons: [],
      judgeHealth: { total: 0, checked: 0, agreement: null },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const denied = await forbidden(cookies);
  if (denied) return denied;
  try {
    const body = await request.json();
    const db = getDb();

    if (body.action === "start") {
      const { templateName, targetUrl, maxWorkers, budgetIterations } = body;
      if (!templateName || !targetUrl) return json({ error: "templateName and targetUrl are required" }, 400);
      if (!String(templateName).startsWith("template-")) {
        return json({ error: "templateName must start with 'template-'" }, 400);
      }
      const [run] = await db
        .insert(sitcRuns)
        .values({ templateName, targetUrl, maxWorkers: maxWorkers ?? 3, budgetIterations: budgetIterations ?? null })
        .returning();
      return json({ ok: true, run }, 201);
    }

    if (body.action === "command") {
      const { runId, type, payload } = body;
      const ALLOWED = ["pause", "resume", "abort", "approve", "approve_merge", "set_max_workers"];
      if (!runId || !ALLOWED.includes(type)) return json({ error: "invalid command" }, 400);
      await db.insert(sitcCommands).values({ runId, type, payload: payload ?? null });
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    logger.error({ err: e, endpoint: "/api/admin/template-creator" }, "sitc admin error");
    return json({ error: e instanceof Error ? e.message : "failed" }, 500);
  }
};
