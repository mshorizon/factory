import type { APIRoute } from "astro";
import { initDb, getOrderByToken, getOrderItemsByOrderId } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const token = url.searchParams.get("token");
    if (!token) return json({ error: "Missing token" }, 400);

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderByToken(token);
    if (!order) return json({ error: "Order not found" }, 404);

    const items = await getOrderItemsByOrderId(order.id);

    return json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        fulfillmentType: order.fulfillmentType,
        tableNumber: order.tableNumber,
        pickupTime: order.pickupTime,
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        currency: order.currency,
        paymentLinkUrl:
          order.status === "accepted" && order.paymentMethod === "online"
            ? order.paymentLinkUrl
            : null,
        estimatedReadyAt: order.estimatedReadyAt,
        acceptedAt: order.acceptedAt,
        paidAt: order.paidAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt,
        completedAt: order.completedAt,
        rejectedAt: order.rejectedAt,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
        notes: order.notes,
        customerNotes: order.customerNotes,
      },
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
        image: i.image,
        customizationLabels: i.customizationLabels,
      })),
    });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/order/status" }, "Order status error");
    return json({ error: "Failed to load order status" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
