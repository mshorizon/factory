import type { APIRoute } from "astro";
import { getOrderById, updateOrderStatus } from "@mshorizon/db";
import logger from "../../../../lib/logger";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: [],
  cancelled: [],
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId, status, notes } = await request.json();

    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing orderId or status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Cannot transition from "${order.status}" to "${status}"` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const extraFields: any = {};
    if (status === "paid") extraFields.paidAt = new Date();
    if (status === "shipped") extraFields.shippedAt = new Date();
    if (status === "cancelled") extraFields.cancelledAt = new Date();
    if (notes !== undefined) extraFields.notes = notes;

    const updated = await updateOrderStatus(orderId, status, extraFields);

    return new Response(
      JSON.stringify({ success: true, order: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/update-status" }, "Error updating order status");
    return new Response(
      JSON.stringify({ error: "Failed to update order status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
