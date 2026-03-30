import { Resend } from "resend";
import type { Booking } from "@mshorizon/db";
import logger from "./logger";

const DAY_NAMES_PL: Record<string, string> = {
  "0": "Niedziela", "1": "Poniedziałek", "2": "Wtorek", "3": "Środa",
  "4": "Czwartek", "5": "Piątek", "6": "Sobota",
};

function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = DAY_NAMES_PL[String(d.getDay())];
  return `${day}, ${dateStr.split("-").reverse().join(".")}`;
}

function bookingDetailsHtml(booking: Booking, businessName: string): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px">
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;color:#666">Usługa</td>
        <td style="padding:12px;font-weight:600">${booking.serviceName}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;color:#666">Data</td>
        <td style="padding:12px;font-weight:600">${formatDatePL(booking.date)}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;color:#666">Godzina</td>
        <td style="padding:12px;font-weight:600">${booking.startTime} – ${booking.endTime}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;color:#666">Czas trwania</td>
        <td style="padding:12px">${booking.serviceDuration} min</td>
      </tr>
      <tr>
        <td style="padding:12px;color:#666">Firma</td>
        <td style="padding:12px">${businessName}</td>
      </tr>
    </table>
  `;
}

function actionButtonHtml(label: string, url: string, color: string): string {
  return `
    <a href="${url}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:4px 8px 4px 0">
      ${label}
    </a>
  `;
}

export async function sendBookingConfirmationEmail(
  booking: Booking,
  businessConfig: any,
  resendApiKey: string,
  baseUrl: string,
) {
  if (!resendApiKey || !booking.customerEmail) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Firma";
  const businessPhone = businessConfig?.business?.contact?.phone || "";

  const cancelUrl = booking.cancelToken
    ? `${baseUrl}/booking/cancel?token=${booking.cancelToken}`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16181D">Potwierdzenie rezerwacji</h2>
      <p>Cześć ${booking.customerName},</p>
      <p>Twoja rezerwacja w <strong>${businessName}</strong> została przyjęta.</p>

      ${bookingDetailsHtml(booking, businessName)}

      ${booking.notes ? `<p style="color:#666"><strong>Uwagi:</strong> ${booking.notes}</p>` : ""}

      ${cancelUrl ? `
        <div style="margin:24px 0">
          ${actionButtonHtml("Odwołaj wizytę", cancelUrl, "#dc2626")}
        </div>
        <p style="color:#999;font-size:13px">Jeśli chcesz odwołać lub przełożyć wizytę, kliknij powyższy przycisk lub skontaktuj się z nami${businessPhone ? ` pod numerem ${businessPhone}` : ""}.</p>
      ` : ""}

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:13px">${businessName}${businessPhone ? ` | ${businessPhone}` : ""}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: booking.customerEmail,
      subject: `Potwierdzenie rezerwacji — ${businessName} — ${formatDatePL(booking.date)} ${booking.startTime}`,
      html,
    });
    logger.info({ bookingId: booking.id }, "Booking confirmation email sent");
  } catch (err) {
    logger.error({ err, bookingId: booking.id }, "Failed to send booking confirmation email");
  }
}

export async function sendBookingNotificationToOwner(
  booking: Booking,
  businessConfig: any,
  resendApiKey: string,
) {
  if (!resendApiKey) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Firma";
  const ownerEmail = businessConfig?.business?.contact?.email;
  if (!ownerEmail) return;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16181D">Nowa rezerwacja</h2>
      <p>Nowa rezerwacja w <strong>${businessName}</strong>.</p>

      ${bookingDetailsHtml(booking, businessName)}

      <h3>Dane klienta</h3>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee">
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:12px;color:#666">Imię i nazwisko</td>
          <td style="padding:12px">${booking.customerName}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:12px;color:#666">Telefon</td>
          <td style="padding:12px"><a href="tel:${booking.customerPhone}">${booking.customerPhone}</a></td>
        </tr>
        <tr>
          <td style="padding:12px;color:#666">Email</td>
          <td style="padding:12px"><a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></td>
        </tr>
      </table>

      ${booking.notes ? `<p><strong>Uwagi klienta:</strong> ${booking.notes}</p>` : ""}
    </div>
  `;

  try {
    await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: ownerEmail,
      replyTo: booking.customerEmail,
      subject: `Nowa rezerwacja: ${booking.customerName} — ${formatDatePL(booking.date)} ${booking.startTime}`,
      html,
    });
    logger.info({ bookingId: booking.id }, "Booking notification email sent to owner");
  } catch (err) {
    logger.error({ err, bookingId: booking.id }, "Failed to send booking notification to owner");
  }
}

export async function sendBookingReminderEmail(
  booking: Booking,
  businessConfig: any,
  resendApiKey: string,
  hoursBeforeLabel: string,
  cancelUrl: string,
) {
  if (!resendApiKey || !booking.customerEmail) return;
  const resend = new Resend(resendApiKey);
  const businessName = businessConfig?.business?.name || "Firma";
  const businessPhone = businessConfig?.business?.contact?.phone || "";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16181D">Przypomnienie o wizycie</h2>
      <p>Cześć ${booking.customerName},</p>
      <p>Przypominamy o Twojej wizycie <strong>${hoursBeforeLabel}</strong> w <strong>${businessName}</strong>.</p>

      ${bookingDetailsHtml(booking, businessName)}

      ${cancelUrl ? `
        <div style="margin:24px 0">
          ${actionButtonHtml("Odwołaj wizytę", cancelUrl, "#dc2626")}
        </div>
      ` : ""}

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:13px">${businessName}${businessPhone ? ` | ${businessPhone}` : ""}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: booking.customerEmail,
      subject: `Przypomnienie: wizyta ${hoursBeforeLabel} — ${businessName}`,
      html,
    });
    logger.info({ bookingId: booking.id, hoursBeforeLabel }, "Booking reminder email sent");
  } catch (err) {
    logger.error({ err, bookingId: booking.id }, "Failed to send booking reminder email");
  }
}
