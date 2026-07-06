import type { APIRoute } from "astro";
import { initDb, getOrderById, updateOrderStatus } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId } = (await request.json()) as { orderId: number };
    if (!orderId) return json({ error: "Missing orderId" }, 400);

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderById(orderId);
    if (!order) return json({ error: "Order not found" }, 404);
    if (!["ready", "preparing"].includes(order.status)) {
      return json({ error: `Cannot complete in status "${order.status}"` }, 400);
    }

    const updated = await updateOrderStatus(order.id, "completed", { completedAt: new Date() });
    return json({ success: true, order: updated });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/mark-completed" }, "Mark completed error");
    return json({ error: "Failed to complete order" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
