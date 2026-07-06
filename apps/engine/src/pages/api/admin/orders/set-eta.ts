import type { APIRoute } from "astro";
import { initDb, getOrderById, updateOrderStatus, getDb, sites } from "@mshorizon/db";
import { eq } from "drizzle-orm";
import { sendOrderETAEmail } from "../../../../lib/order-emails";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId, minutes } = (await request.json()) as { orderId: number; minutes: number };
    if (!orderId || !minutes || minutes < 1 || minutes > 480) {
      return json({ error: "Missing or invalid orderId/minutes" }, 400);
    }

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderById(orderId);
    if (!order) return json({ error: "Order not found" }, 404);
    // Online orders must be paid first; offline (cash / card on site) orders
    // can start preparing straight after acceptance.
    const allowedStatuses =
      order.paymentMethod === "online"
        ? ["paid", "preparing"]
        : ["accepted", "paid", "preparing"];
    if (!allowedStatuses.includes(order.status)) {
      return json({ error: `Cannot set ETA for order in status "${order.status}"` }, 400);
    }

    const eta = new Date(Date.now() + minutes * 60_000);
    const updated = await updateOrderStatus(order.id, "preparing", {
      estimatedReadyAt: eta,
      preparingAt: order.preparingAt ?? new Date(),
    });

    const db = getDb();
    const [site] = await db.select().from(sites).where(eq(sites.id, order.siteId)).limit(1);
    if (site) {
      const url = new URL(request.url);
      const statusUrl = `${url.protocol}//${url.host}/order/${order.orderToken}`;
      const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      sendOrderETAEmail(updated!, site.config, resendApiKey, statusUrl).catch((err) =>
        logger.error({ err, orderId: order.id }, "Failed to send order-ETA email")
      );
    }

    return json({ success: true, order: updated });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/set-eta" }, "Set ETA error");
    return json({ error: "Failed to set ETA" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
