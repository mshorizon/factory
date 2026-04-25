import type { APIRoute } from "astro";
import { getSiteById, createTask } from "@mshorizon/db";
import { getAuthFromCookies } from "../../../../../lib/auth";
import logger from "../../../../../lib/logger";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin")
    return json({ error: "Forbidden" }, 403);

  const id = parseInt(params.id ?? "", 10);
  if (isNaN(id)) return json({ error: "Not found" }, 404);

  try {
    const site = await getSiteById(id);
    if (!site) return json({ error: "Not found" }, 404);

    const body = await request.json().catch(() => ({}));
    const mode: "regenerate" | "redeploy" = body?.mode ?? "regenerate";

    const config = site.config as any;
    const templateHint =
      config?.meta?.template ?? config?.template ?? "template-specialist";

    let description: string;
    if (mode === "redeploy") {
      description = `Force redeploy for business "${site.businessName}" (${site.subdomain}).
Re-run db:seed to sync the current config to the database, then restart the dev server.
Do NOT change any content. Just ensure the current config is live.
Update this task to 'done' when complete.`;
    } else {
      description = `Regenerate the website for business "${site.businessName}" (${site.subdomain}).
Steps:
1. Read the current business config from the database.
2. Re-run the full site generation pipeline: choose appropriate template, rebuild all sections from scratch, re-scrape existing content if needed.
3. Save the updated config to the database using upsertSiteConfig("${site.subdomain}", config).
4. Update business status to 'released'.
5. Update this task to 'done' with a short summary of changes.`;
    }

    const task = await createTask({
      domain: site.subdomain,
      template: templateHint,
      location: "admin:administration/businesses",
      page: "administration",
      section: "businesses",
      isAdminPanel: true,
      description,
      isSuperAdmin: true,
    });

    return json({ task }, 201);
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "POST regenerate failed");
    return json({ error: "Failed to create task" }, 500);
  }
};
