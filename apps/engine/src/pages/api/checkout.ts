import type { APIRoute } from "astro";
import {
  initDb,
  getSiteBySubdomain,
  createOrder,
  createOrderItems,
  generateOrderNumber,
  generateOrderToken,
} from "@mshorizon/db";
import { rateLimit } from "../../lib/rate-limit";
import { collectOrderableProducts, findOrderableProduct } from "../../lib/orderable-products";
import logger from "../../lib/logger";

type FulfillmentType = "delivery" | "pickup" | "dine_in";

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

interface CheckoutBody {
  businessId: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fulfillmentType: FulfillmentType;
  // Delivery
  address?: string;
  city?: string;
  postalCode?: string;
  // Pickup
  pickupTime?: string; // ISO
  // Dine-in
  tableNumber?: string;
  // Notes to kitchen
  customerNotes?: string;
  items: CheckoutItem[];
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

    const body = (await request.json()) as CheckoutBody;
    const {
      businessId,
      email,
      phone,
      firstName,
      lastName,
      fulfillmentType,
      address,
      city,
      postalCode,
      pickupTime,
      tableNumber,
      customerNotes,
      items,
    } = body;

    if (!businessId || !email || !firstName || !lastName || !fulfillmentType || !items?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["delivery", "pickup", "dine_in"].includes(fulfillmentType)) {
      return new Response(
        JSON.stringify({ error: "Invalid fulfillmentType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (fulfillmentType === "delivery" && (!address || !city || !postalCode)) {
      return new Response(
        JSON.stringify({ error: "Delivery requires address, city and postal code" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (fulfillmentType === "dine_in" && !tableNumber) {
      return new Response(
        JSON.stringify({ error: "Dine-in requires table number" }),
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

    // Server-side price validation against orderable menu items + products
    const orderableProducts = collectOrderableProducts(config);
    const validatedItems: {
      productId: string;
      title: string;
      unitPrice: number;
      quantity: number;
      image?: string;
      customizations?: Record<string, string>;
      customizationLabels?: Record<string, string>;
    }[] = [];

    for (const item of items) {
      const product = findOrderableProduct(orderableProducts, item.productId);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not available: ${item.productId}` }),
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
            if (option?.priceModifier) price += option.priceModifier;
          }
        }
      }

      const unitPriceCents = Math.round(price * 100);

      validatedItems.push({
        productId: item.productId,
        title: product.title,
        unitPrice: unitPriceCents,
        quantity: item.quantity,
        image: item.image || product.image,
        customizations: item.customizations,
        customizationLabels: item.customizationLabels,
      });
    }

    const subtotal = validatedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const paymentsCfg = config?.payments || {};
    const currency = paymentsCfg.currency || "PLN";
    const shippingCost = fulfillmentType === "delivery" ? (paymentsCfg.deliveryFee ?? 0) : 0;
    const total = subtotal + shippingCost;

    if (paymentsCfg.minOrderValue && subtotal < paymentsCfg.minOrderValue) {
      return new Response(
        JSON.stringify({
          error: `Minimalna wartość zamówienia: ${(paymentsCfg.minOrderValue / 100).toFixed(2)} ${currency}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orderNumber = await generateOrderNumber(site.id);
    const orderToken = await generateOrderToken();

    const order = await createOrder({
      siteId: site.id,
      orderNumber,
      orderToken,
      status: "pending",
      fulfillmentType,
      pickupTime: pickupTime ? new Date(pickupTime) : null,
      tableNumber: tableNumber || null,
      customerNotes: customerNotes || null,
      customerEmail: email,
      customerPhone: phone || null,
      customerFirstName: firstName,
      customerLastName: lastName,
      shippingAddress: fulfillmentType === "delivery" ? address! : null,
      shippingCity: fulfillmentType === "delivery" ? city! : null,
      shippingPostalCode: fulfillmentType === "delivery" ? postalCode! : null,
      subtotal,
      shippingCost,
      total,
      currency,
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

    await createOrderItems(orderItemsData);

    // Admin sees new orders via polling in /admin (no email — user preference).
    // Send a "we received your order" acknowledgement to the customer.
    try {
      const { sendOrderReceivedEmail } = await import("../../lib/order-emails");
      const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      const statusUrl = `${new URL(request.url).origin}/order/${orderToken}`;
      sendOrderReceivedEmail(order, config, resendApiKey, statusUrl).catch((err) =>
        (locals.logger ?? logger).error({ err, orderId: order.id }, "Failed to send order-received email")
      );
    } catch (e) {
      (locals.logger ?? logger).error({ err: e, orderId: order.id }, "Failed to trigger customer email");
    }

    return new Response(
      JSON.stringify({
        orderNumber,
        orderToken,
        statusUrl: `/order/${orderToken}`,
      }),
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
