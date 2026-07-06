import type { APIRoute } from "astro";
import { initDb, getOrderById, updateOrderStatus, getDb, sites } from "@mshorizon/db";
import { eq } from "drizzle-orm";
import { sendOrderRejectedEmail } from "../../../../lib/order-emails";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId, reason } = (await request.json()) as { orderId: number; reason?: string };
    if (!orderId) return json({ error: "Missing orderId" }, 400);

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderById(orderId);
    if (!order) return json({ error: "Order not found" }, 404);
    if (!["pending", "accepted"].includes(order.status)) {
      return json({ error: `Cannot reject order in status "${order.status}"` }, 400);
    }

    const updated = await updateOrderStatus(order.id, "rejected", {
      rejectedAt: new Date(),
      notes: reason ? `Odrzucone: ${reason}` : order.notes,
    });

    const db = getDb();
    const [site] = await db.select().from(sites).where(eq(sites.id, order.siteId)).limit(1);
    if (site) {
      const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      sendOrderRejectedEmail(updated!, site.config, resendApiKey, reason).catch((err) =>
        logger.error({ err, orderId: order.id }, "Failed to send order-rejected email")
      );
    }

    return json({ success: true, order: updated });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/reject" }, "Reject order error");
    return json({ error: "Failed to reject order" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
