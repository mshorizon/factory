import type { APIRoute } from "astro";
import {
  initDb,
  getOrderById,
  getOrderItemsByOrderId,
  updateOrderStatus,
  updateOrderStripeFields,
  getDb,
  sites,
} from "@mshorizon/db";
import { eq } from "drizzle-orm";
import { getStripeClient, createCheckoutSession } from "../../../../lib/stripe";
import { sendOrderAcceptedEmail } from "../../../../lib/order-emails";
import logger from "../../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderId } = (await request.json()) as { orderId: number };
    if (!orderId) {
      return json({ error: "Missing orderId" }, 400);
    }

    initDb(import.meta.env.DATABASE_URL);
    const order = await getOrderById(orderId);
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.status !== "pending") {
      return json({ error: `Cannot accept order in status "${order.status}"` }, 400);
    }

    const db = getDb();
    const [site] = await db.select().from(sites).where(eq(sites.id, order.siteId)).limit(1);
    if (!site) return json({ error: "Site not found" }, 404);
    const config = site.config as any;

    const stripeSecretKey = config?.payments?.stripeSecretKey;
    if (!stripeSecretKey) {
      return json({ error: "Payments not configured for this business" }, 400);
    }

    const items = await getOrderItemsByOrderId(order.id);
    if (!items.length) return json({ error: "Order has no items" }, 400);

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const statusUrl = `${baseUrl}/order/${order.orderToken}`;

    const stripe = getStripeClient(stripeSecretKey);
    const session = await createCheckoutSession({
      stripe,
      order,
      items,
      successUrl: `${statusUrl}?paid=1`,
      cancelUrl: `${statusUrl}?cancelled=1`,
      customerEmail: order.customerEmail,
      currency: order.currency,
    });

    if (!session.url) {
      return json({ error: "Stripe returned no session URL" }, 500);
    }

    await updateOrderStripeFields(order.id, {
      stripeSessionId: session.id,
      paymentLinkUrl: session.url,
    });
    const updated = await updateOrderStatus(order.id, "accepted", { acceptedAt: new Date() });

    // Send payment link email — fire-and-forget
    const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    sendOrderAcceptedEmail(updated!, items, config, resendApiKey, session.url, statusUrl).catch((err) =>
      logger.error({ err, orderId: order.id }, "Failed to send order-accepted email")
    );

    return json({ success: true, order: updated, paymentUrl: session.url });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/orders/accept" }, "Accept order error");
    return json({ error: "Failed to accept order" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
