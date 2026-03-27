import Stripe from "stripe";
import type { Order, OrderItem } from "@mshorizon/db";

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });
}

export async function createCheckoutSession(params: {
  stripe: Stripe;
  order: Order;
  items: OrderItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  currency: string;
}): Promise<Stripe.Checkout.Session> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
    price_data: {
      currency: params.currency.toLowerCase(),
      product_data: {
        name: item.title,
        ...(item.image ? { images: [item.image] } : {}),
      },
      unit_amount: item.unitPrice,
    },
    quantity: item.quantity,
  }));

  if (params.order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: { name: "Dostawa" },
        unit_amount: params.order.shippingCost,
      },
      quantity: 1,
    });
  }

  return params.stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "blik", "p24"],
    line_items: lineItems,
    customer_email: params.customerEmail,
    metadata: {
      orderId: String(params.order.id),
      orderNumber: params.order.orderNumber,
      siteId: String(params.order.siteId),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
  stripe: Stripe,
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
