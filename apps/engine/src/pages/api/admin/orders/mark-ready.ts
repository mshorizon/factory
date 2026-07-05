import type { APIRoute } from "astro";
import { initDb, getOrderById, updateOrderStatus, getDb, sites } from "@mshorizon/db";
import { eq } from "drizzle-orm";
import { sendOrderReadyEmail } from "../../../../lib/order-emails";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId } = (await request.json()) as { orderId: number };
    if (!orderId) return json({ error: "Missing orderId" }, 400);

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderById(orderId);
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.status !== "preparing") {
      return json({ error: `Cannot mark ready in status "${order.status}"` }, 400);
    }

    const updated = await updateOrderStatus(order.id, "ready", { readyAt: new Date() });

    const db = getDb();
    const [site] = await db.select().from(sites).where(eq(sites.id, order.siteId)).limit(1);
    if (site) {
      const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      sendOrderReadyEmail(updated!, site.config, resendApiKey).catch((err) =>
        logger.error({ err, orderId: order.id }, "Failed to send order-ready email")
      );
    }

    return json({ success: true, order: updated });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/mark-ready" }, "Mark ready error");
    return json({ error: "Failed to mark ready" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
