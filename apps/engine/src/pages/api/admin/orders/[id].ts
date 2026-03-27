import type { APIRoute } from "astro";
import { getOrderById, getOrderItemsByOrderId } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id || "", 10);
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Invalid order ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const order = await getOrderById(id);
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const items = await getOrderItemsByOrderId(order.id);

    return new Response(
      JSON.stringify({ order, items }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/[id]" }, "Error fetching order");
    return new Response(
      JSON.stringify({ error: "Failed to fetch order" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
