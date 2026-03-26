import type { APIRoute } from "astro";
import { initDb, deletePushSubscription } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    initDb(import.meta.env.DATABASE_URL);
    await deletePushSubscription(endpoint);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    (locals.logger ?? logger).error({ err, endpoint: "/api/notifications/unsubscribe" }, "Push unsubscribe error");
    return new Response(JSON.stringify({ error: "Failed to remove subscription" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
