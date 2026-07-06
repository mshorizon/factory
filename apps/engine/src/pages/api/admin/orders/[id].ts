import type { APIRoute } from "astro";
import { getOrderById, getOrderItemsByOrderId } from "@mshorizon/db";
import { t as translate } from "../../../../lib/i18n";
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

    // Older orders stored raw "t:" translation keys as item titles/labels —
    // resolve them for display (new orders store resolved text at creation).
    const translations = ((locals as any).t as Record<string, string>) || {};
    const resolveText = (value: string | null | undefined) =>
      value?.startsWith("t:") ? translate(translations, value.slice(2), value) : value;
    const resolvedItems = items.map((item) => ({
      ...item,
      title: resolveText(item.title),
      customizationLabels: item.customizationLabels
        ? Object.fromEntries(
            Object.entries(item.customizationLabels).map(([k, v]) => [
              resolveText(k) ?? k,
              resolveText(v as string) ?? v,
            ])
          )
        : item.customizationLabels,
    }));

    return new Response(
      JSON.stringify({ order, items: resolvedItems }),
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
