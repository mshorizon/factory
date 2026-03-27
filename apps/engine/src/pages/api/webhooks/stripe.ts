import type { APIRoute } from "astro";
import { initDb, getOrderById, getOrderByStripeSessionId, getOrderItemsByOrderId, updateOrderStatus, updateOrderStripeFields, getSiteBySubdomain } from "@mshorizon/db";
import { getStripeClient, constructWebhookEvent } from "../../../lib/stripe";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "../../../lib/order-emails";
import logger from "../../../lib/logger";

export const POST: APIRoute = async ({ request }) => {
  try {
    initDb(import.meta.env.DATABASE_URL);

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), { status: 400 });
    }

    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
    }

    // Use a dummy key for event construction — the webhook secret is what matters
    const stripe = getStripeClient(webhookSecret.startsWith("sk_") ? webhookSecret : "sk_dummy");
    let event;

    try {
      event = constructWebhookEvent(body, signature, webhookSecret, stripe);
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const order = await getOrderByStripeSessionId(session.id);

        if (!order) {
          logger.warn({ sessionId: session.id }, "Order not found for Stripe session");
          break;
        }

        if (order.status === "paid") break; // Already processed

        // Update order
        await updateOrderStatus(order.id, "paid", { paidAt: new Date() });
        if (session.payment_intent) {
          await updateOrderStripeFields(order.id, { stripePaymentIntentId: session.payment_intent });
        }

        // Send emails (fire-and-forget)
        const items = await getOrderItemsByOrderId(order.id);

        // Find business config for email sending
        const allSites = await import("@mshorizon/db").then((m) => m.getAllSubdomains());
        // We need to find site by siteId — use metadata
        const siteId = session.metadata?.siteId ? parseInt(session.metadata.siteId) : order.siteId;

        // Get site config for business email
        try {
          const { getDb } = await import("@mshorizon/db");
          const { sites } = await import("@mshorizon/db");
          const { eq } = await import("drizzle-orm");
          const db = getDb();
          const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);

          if (site) {
            const config = site.config as any;
            sendOrderConfirmationEmail(order, items, config, import.meta.env.RESEND_API_KEY).catch(
              (err) => logger.error({ err, orderId: order.id }, "Failed to send order confirmation email")
            );
            sendOrderNotificationEmail(order, items, config, import.meta.env.RESEND_API_KEY).catch(
              (err) => logger.error({ err, orderId: order.id }, "Failed to send order notification email")
            );
          }
        } catch (emailErr) {
          logger.error({ err: emailErr, orderId: order.id }, "Failed to process post-payment emails");
        }

        logger.info({ orderId: order.id, orderNumber: order.orderNumber }, "Order paid successfully");
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as any;
        const order = await getOrderByStripeSessionId(session.id);
        if (order && order.status === "pending") {
          await updateOrderStatus(order.id, "cancelled", { cancelledAt: new Date() });
          logger.info({ orderId: order.id }, "Order cancelled (session expired)");
        }
        break;
      }

      default:
        logger.debug({ type: event.type }, "Unhandled Stripe event type");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error({ err: error, endpoint: "/api/webhooks/stripe" }, "Stripe webhook error");
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500 });
  }
};
