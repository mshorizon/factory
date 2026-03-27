import { Resend } from "resend";
import type { Order, OrderItem } from "@mshorizon/db";
import logger from "./logger";

function formatPrice(cents: number, currency = "PLN"): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function buildItemsTable(items: OrderItem[], currency: string): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead>
        <tr style="border-bottom:2px solid #eee">
          <th style="text-align:left;padding:8px">Produkt</th>
          <th style="text-align:center;padding:8px">Ilość</th>
          <th style="text-align:right;padding:8px">Cena</th>
          <th style="text-align:right;padding:8px">Razem</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px">
              ${item.title}
              ${item.customizationLabels
                ? `<br><small style="color:#666">${Object.entries(item.customizationLabels as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")}</small>`
                : ""}
            </td>
            <td style="text-align:center;padding:8px">${item.quantity}</td>
            <td style="text-align:right;padding:8px">${formatPrice(item.unitPrice, currency)}</td>
            <td style="text-align:right;padding:8px">${formatPrice(item.total, currency)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[],
  businessConfig: any,
  resendApiKey: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Shop";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Potwierdzenie zamówienia ${order.orderNumber}</h2>
      <p>Cześć ${order.customerFirstName},</p>
      <p>Dziękujemy za zamówienie w <strong>${businessName}</strong>! Twoja płatność została potwierdzona.</p>

      <h3>Szczegóły zamówienia</h3>
      ${buildItemsTable(items, order.currency)}

      <div style="border-top:2px solid #333;padding-top:12px;margin-top:8px">
        <p style="text-align:right"><strong>Razem: ${formatPrice(order.total, order.currency)}</strong></p>
      </div>

      <h3>Adres dostawy</h3>
      <p>
        ${order.customerFirstName} ${order.customerLastName}<br>
        ${order.shippingAddress}<br>
        ${order.shippingPostalCode} ${order.shippingCity}
      </p>

      <p style="margin-top:24px;color:#666;font-size:12px">
        W razie pytań odpowiedz na ten email lub skontaktuj się z nami.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: order.customerEmail,
      subject: `Zamówienie ${order.orderNumber} — potwierdzenie - ${businessName}`,
      html,
    });
    logger.info({ orderNumber: order.orderNumber, to: order.customerEmail }, "Order confirmation email sent");
  } catch (error) {
    logger.error({ err: error, orderNumber: order.orderNumber }, "Failed to send order confirmation email");
  }
}

export async function sendOrderNotificationEmail(
  order: Order,
  items: OrderItem[],
  businessConfig: any,
  resendApiKey: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const recipientEmail = businessConfig?.business?.contact?.email;
  if (!recipientEmail) return;

  const businessName = businessConfig?.business?.name || "Shop";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Nowe zamówienie ${order.orderNumber}</h2>
      <p><strong>Kwota:</strong> ${formatPrice(order.total, order.currency)}</p>
      <p><strong>Klient:</strong> ${order.customerFirstName} ${order.customerLastName} (${order.customerEmail})</p>
      ${order.customerPhone ? `<p><strong>Telefon:</strong> ${order.customerPhone}</p>` : ""}

      <h3>Produkty</h3>
      ${buildItemsTable(items, order.currency)}

      <h3>Adres dostawy</h3>
      <p>
        ${order.shippingAddress}<br>
        ${order.shippingPostalCode} ${order.shippingCity}
      </p>

      <p style="margin-top:24px">
        <a href="/admin" style="background:#333;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">
          Zarządzaj zamówieniem
        </a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: recipientEmail,
      replyTo: order.customerEmail,
      subject: `Nowe zamówienie ${order.orderNumber} — ${formatPrice(order.total, order.currency)}`,
      html,
    });
    logger.info({ orderNumber: order.orderNumber, to: recipientEmail }, "Order notification email sent");
  } catch (error) {
    logger.error({ err: error, orderNumber: order.orderNumber }, "Failed to send order notification email");
  }
}
