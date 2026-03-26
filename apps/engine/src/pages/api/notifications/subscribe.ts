import type { APIRoute } from "astro";
import { initDb, getSiteBySubdomain, upsertPushSubscription } from "@mshorizon/db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { businessId, subscription } = body;

    if (!businessId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    initDb(import.meta.env.DATABASE_URL);
    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await upsertPushSubscription({
      siteId: site.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return new Response(JSON.stringify({ error: "Failed to save subscription" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
