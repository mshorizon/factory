import type { APIRoute } from "astro";
import { initDb, getSiteBySubdomain, createOrder, createOrderItems, generateOrderNumber, updateOrderStripeFields } from "@mshorizon/db";
import { rateLimit } from "../../lib/rate-limit";
import { getStripeClient, createCheckoutSession } from "../../lib/stripe";
import logger from "../../lib/logger";

interface CheckoutItem {
  productId: string;
  cartKey: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  customizations?: Record<string, string>;
  customizationLabels?: Record<string, string>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { ok, retryAfter } = rateLimit(`checkout:${ip}`, 5, 60_000);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { businessId, email, phone, firstName, lastName, address, city, postalCode, items } = body as {
      businessId: string;
      email: string;
      phone?: string;
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
      items: CheckoutItem[];
    };

    if (!businessId || !email || !firstName || !lastName || !address || !city || !postalCode || !items?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    initDb(import.meta.env.DATABASE_URL);
    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const config = site.config as any;
    const stripeSecretKey = config?.payments?.stripeSecretKey;
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payments not configured for this business" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Server-side price validation
    const products: any[] = config?.data?.products || [];
    const validatedItems: { productId: string; title: string; unitPrice: number; quantity: number; image?: string; customizations?: Record<string, string>; customizationLabels?: Record<string, string> }[] = [];

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.productId}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Recalculate price with customizations
      let price = product.price;
      if (item.customizations && product.customizations) {
        for (const [custId, selectedValue] of Object.entries(item.customizations)) {
          const cust = product.customizations.find((c: any) => c.id === custId);
          if (cust) {
            const option = cust.options.find((o: any) => o.value === selectedValue);
            if (option?.priceModifier) {
              price += option.priceModifier;
            }
          }
        }
      }

      const unitPriceCents = Math.round(price * 100);

      validatedItems.push({
        productId: item.productId,
        title: product.title,
        unitPrice: unitPriceCents,
        quantity: item.quantity,
        image: item.image,
        customizations: item.customizations,
        customizationLabels: item.customizationLabels,
      });
    }

    const subtotal = validatedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shippingCost = 0; // Free shipping for now
    const total = subtotal + shippingCost;

    // Create order in DB
    const orderNumber = await generateOrderNumber(site.id);
    const order = await createOrder({
      siteId: site.id,
      orderNumber,
      status: "pending",
      customerEmail: email,
      customerPhone: phone || null,
      customerFirstName: firstName,
      customerLastName: lastName,
      shippingAddress: address,
      shippingCity: city,
      shippingPostalCode: postalCode,
      subtotal,
      shippingCost,
      total,
      currency: "PLN",
    });

    const orderItemsData = validatedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      title: item.title,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.unitPrice * item.quantity,
      image: item.image || null,
      customizations: item.customizations || null,
      customizationLabels: item.customizationLabels || null,
    }));

    const createdItems = await createOrderItems(orderItemsData);

    // Create Stripe Checkout Session
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const stripe = getStripeClient(stripeSecretKey);
    const session = await createCheckoutSession({
      stripe,
      order,
      items: createdItems,
      successUrl: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/order-cancel`,
      customerEmail: email,
      currency: "PLN",
    });

    // Store stripe session ID
    await updateOrderStripeFields(order.id, { stripeSessionId: session.id });

    return new Response(
      JSON.stringify({ sessionUrl: session.url, orderNumber }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/checkout" }, "Checkout error");
    return new Response(
      JSON.stringify({ error: "Failed to process checkout" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
