import { Resend } from "resend";
import type { Order, OrderItem } from "@mshorizon/db";
import logger from "./logger";

const FROM = "noreply@contact.hazelgrouse.pl";

function formatPrice(cents: number, currency = "PLN"): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function fulfillmentLabel(order: Order): string {
  switch (order.fulfillmentType) {
    case "delivery": return "Dostawa";
    case "pickup": return "Odbiór osobisty";
    case "dine_in": return `W lokalu (stolik ${order.tableNumber ?? "—"})`;
    default: return "—";
  }
}

function formatDateTime(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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
      from: FROM,
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

// ==================== Restaurant flow emails ====================

export async function sendOrderReceivedEmail(
  order: Order,
  businessConfig: any,
  resendApiKey: string,
  statusUrl: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Restauracja";
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Otrzymaliśmy Twoje zamówienie — ${order.orderNumber}</h2>
      <p>Cześć ${order.customerFirstName},</p>
      <p>Dziękujemy za zamówienie w <strong>${businessName}</strong>. Restauracja właśnie sprawdza dostępność.</p>
      <p><strong>Sposób realizacji:</strong> ${fulfillmentLabel(order)}</p>
      <p>${
        order.paymentMethod === "online"
          ? "Po akceptacji otrzymasz e-mail z linkiem do płatności."
          : "Po akceptacji restauracja od razu zacznie przygotowywać zamówienie — zapłacisz przy odbiorze."
      }</p>
      <p style="margin-top:24px">
        <a href="${statusUrl}" style="background:#333;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">
          Sprawdź status zamówienia
        </a>
      </p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: `Zamówienie ${order.orderNumber} — otrzymane`,
      html,
    });
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Failed to send order-received email");
  }
}

export async function sendOrderAcceptedEmail(
  order: Order,
  items: OrderItem[],
  businessConfig: any,
  resendApiKey: string,
  paymentUrl: string | null,
  statusUrl: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Restauracja";
  const isOnline = order.paymentMethod === "online" && !!paymentUrl;
  const paymentBlock = isOnline
    ? `
      <p><strong>${businessName}</strong> przyjął(a) Twoje zamówienie. Aby przejść do przygotowania, opłać je poniżej.</p>
      <p style="margin:24px 0">
        <a href="${paymentUrl}" style="background:#0a7c3a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
          Zapłać teraz — ${formatPrice(order.total, order.currency)}
        </a>
      </p>`
    : `
      <p><strong>${businessName}</strong> przyjął(a) Twoje zamówienie i zaraz zacznie je przygotowywać.</p>
      <p><strong>Płatność:</strong> ${
        order.paymentMethod === "card_on_site" ? "kartą przy odbiorze" : "gotówką przy odbiorze"
      } — ${formatPrice(order.total, order.currency)}</p>`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Zamówienie zaakceptowane — ${order.orderNumber}</h2>
      <p>Cześć ${order.customerFirstName},</p>
      ${paymentBlock}
      <h3>Podsumowanie</h3>
      ${buildItemsTable(items, order.currency)}
      <p><strong>Sposób realizacji:</strong> ${fulfillmentLabel(order)}</p>
      <p style="margin-top:24px">
        <a href="${statusUrl}">Sprawdź status zamówienia</a>
      </p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: isOnline
        ? `Zamówienie ${order.orderNumber} zaakceptowane — link do płatności`
        : `Zamówienie ${order.orderNumber} zaakceptowane`,
      html,
    });
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Failed to send order-accepted email");
  }
}

export async function sendOrderRejectedEmail(
  order: Order,
  businessConfig: any,
  resendApiKey: string,
  reason?: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Restauracja";
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Zamówienie ${order.orderNumber} — nie mogliśmy przyjąć</h2>
      <p>Cześć ${order.customerFirstName},</p>
      <p><strong>${businessName}</strong> nie może zrealizować Twojego zamówienia.</p>
      ${reason ? `<p><strong>Powód:</strong> ${reason}</p>` : ""}
      <p>Płatność nie została pobrana. Zapraszamy ponownie.</p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: `Zamówienie ${order.orderNumber} — odrzucone`,
      html,
    });
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Failed to send order-rejected email");
  }
}

export async function sendOrderETAEmail(
  order: Order,
  businessConfig: any,
  resendApiKey: string,
  statusUrl: string,
) {
  if (!resendApiKey || !order.estimatedReadyAt) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Restauracja";
  const eta = formatDateTime(order.estimatedReadyAt);
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Zamówienie ${order.orderNumber} — w przygotowaniu</h2>
      <p>Cześć ${order.customerFirstName},</p>
      <p>Otrzymaliśmy płatność. Zamówienie jest właśnie przygotowywane w <strong>${businessName}</strong>.</p>
      <p style="font-size:20px"><strong>Szacowany czas gotowości: ${eta}</strong></p>
      <p><strong>Sposób realizacji:</strong> ${fulfillmentLabel(order)}</p>
      <p style="margin-top:24px">
        <a href="${statusUrl}">Sprawdź status zamówienia</a>
      </p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: `Zamówienie ${order.orderNumber} — gotowe za ${eta}`,
      html,
    });
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Failed to send order-ETA email");
  }
}

export async function sendOrderReadyEmail(
  order: Order,
  businessConfig: any,
  resendApiKey: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Restauracja";
  const readyMsg =
    order.fulfillmentType === "delivery"
      ? "Zamówienie wyruszyło w drogę — kurier będzie u Ciebie wkrótce."
      : order.fulfillmentType === "pickup"
      ? "Zamówienie jest gotowe do odbioru."
      : "Zamówienie właśnie trafia na Twój stolik.";
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2>Zamówienie ${order.orderNumber} — gotowe!</h2>
      <p>Cześć ${order.customerFirstName},</p>
      <p>${readyMsg}</p>
      <p>Dziękujemy — <strong>${businessName}</strong></p>
    </div>
  `;
  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: `Zamówienie ${order.orderNumber} — gotowe!`,
      html,
    });
  } catch (err) {
    logger.error({ err, orderNumber: order.orderNumber }, "Failed to send order-ready email");
  }
}
