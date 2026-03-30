import type { APIRoute } from "astro";
import { randomBytes } from "node:crypto";
import { getSiteBySubdomain, createBooking, getBookingsByDateAndSiteId } from "@mshorizon/db";
import logger from "../../../../lib/logger";
import { sendBookingConfirmationEmail, sendBookingNotificationToOwner } from "../../../../lib/booking-emails";
import { sendSms } from "../../../../lib/sms";
import { deepTranslate, translateValue, type Translations } from "../../../../lib/i18n";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { businessId } = params;
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "Missing businessId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { serviceId, date, startTime, customerName, customerPhone, customerEmail, notes } = body;

    // Validate required fields
    if (!serviceId || !date || !startTime || !customerName || !customerPhone || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: serviceId, date, startTime, customerName, customerPhone, customerEmail" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const config = (site.config as any)?.booking;
    if (!config?.enabled) {
      return new Response(
        JSON.stringify({ error: "Booking not enabled for this business" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find service
    const service = (config.services ?? []).find((s: any) => s.id === serviceId);
    if (!service) {
      return new Response(
        JSON.stringify({ error: "Service not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const serviceDuration = service.duration ?? 60;
    const endMinutes = timeToMinutes(startTime) + serviceDuration;
    const endTime = minutesToTime(endMinutes);

    // Check slot is still available
    const existingBookings = await getBookingsByDateAndSiteId(site.id, date);
    const slotTaken = existingBookings.some(
      (b) => b.status !== "cancelled" && b.startTime === startTime
    );
    if (slotTaken) {
      return new Response(
        JSON.stringify({ error: "Ten termin jest już zajęty. Wybierz inną godzinę." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check lead time
    const now = new Date();
    const leadTime = config.leadTime ?? 60;
    const bookingDateTime = new Date(`${date}T${startTime}:00`);
    const minAllowedTime = new Date(now.getTime() + leadTime * 60 * 1000);
    if (bookingDateTime < minAllowedTime) {
      return new Response(
        JSON.stringify({ error: `Rezerwacja możliwa minimum ${leadTime} minut przed wizytą.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate tokens for confirm/cancel links
    const confirmToken = randomBytes(24).toString("hex");
    const cancelToken = randomBytes(24).toString("hex");

    // Resolve translations (default to 'pl')
    const siteTranslations = (site.translations as any) ?? {};
    const lang = "pl";
    const translations: Translations = (siteTranslations[lang] ?? {}) as Translations;

    // Create booking
    const booking = await createBooking({
      siteId: site.id,
      serviceId,
      serviceName: translateValue(translations, service.name) ?? service.name,
      serviceDuration,
      date,
      startTime,
      endTime,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      notes: notes?.trim() || null,
      status: "pending",
      confirmToken,
      cancelToken,
    });

    // Send confirmation email + notification to owner (non-blocking)
    const businessConfig = deepTranslate(translations, site.config as any);
    const resendApiKey = import.meta.env.RESEND_API_KEY;
    const baseUrl = `${new URL(request.url).protocol}//${request.headers.get("host")}`;

    sendBookingConfirmationEmail(booking, businessConfig, resendApiKey, baseUrl).catch(() => {});
    sendBookingNotificationToOwner(booking, businessConfig, resendApiKey).catch(() => {});

    // Send SMS confirmation to customer (non-blocking)
    const smsConfig = businessConfig?.notifications?.sms;
    if (smsConfig?.enabled && smsConfig?.apiToken) {
      const resolvedServiceName = translateValue(translations, service.name) ?? service.name;
      const smsMessage = `Potwierdzenie rezerwacji: ${resolvedServiceName}, ${date} godz. ${startTime}. Aby odwołać, kliknij: ${baseUrl}/booking/cancel?token=${cancelToken}`;
      sendSms({
        provider: smsConfig.provider || "smsapi",
        apiToken: smsConfig.apiToken,
        phoneNumber: customerPhone.trim(),
        message: smsMessage,
        senderName: smsConfig.senderName,
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error creating booking");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
