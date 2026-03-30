import type { APIRoute } from "astro";
import { getUpcomingBookings, getSiteBySubdomain, initDb } from "@mshorizon/db";
import { getDb } from "@mshorizon/db";
import { sites, bookings } from "@mshorizon/db";
import { eq, and, sql } from "drizzle-orm";
import logger from "../../../lib/logger";
import { sendBookingReminderEmail } from "../../../lib/booking-emails";
import { sendSms } from "../../../lib/sms";
import { deepTranslate, type Translations } from "../../../lib/i18n";

/**
 * Booking reminders endpoint.
 * Call via cron every 15 minutes:
 *   GET /api/booking/reminders?secret=YOUR_SECRET
 *
 * Sends:
 * - Email reminder 24h before appointment
 * - SMS reminder 1h before appointment
 */
export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    // Simple secret-based auth for cron
    const secret = url.searchParams.get("secret");
    const expectedSecret = import.meta.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    initDb(import.meta.env.DATABASE_URL);
    const db = getDb();

    const now = new Date();
    let emailsSent = 0;
    let smsSent = 0;

    // --- 24h reminders (email) ---
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    // Get bookings for tomorrow that are confirmed
    const tomorrowBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.date, tomorrowDate),
          eq(bookings.status, "confirmed"),
        )
      );

    const resendApiKey = import.meta.env.RESEND_API_KEY;

    for (const booking of tomorrowBookings) {
      // Get site config for business name
      const [site] = await db
        .select()
        .from(sites)
        .where(eq(sites.id, booking.siteId))
        .limit(1);

      if (!site) continue;
      const translations: Translations = ((site.translations as any)?.pl ?? {}) as Translations;
      const config = deepTranslate(translations, site.config as any);
      const baseUrl = `https://${site.subdomain}.dev.hazelgrouse.pl`;
      const cancelUrl = booking.cancelToken
        ? `${baseUrl}/api/booking/cancel?token=${booking.cancelToken}`
        : "";

      await sendBookingReminderEmail(
        booking,
        config,
        resendApiKey,
        "jutro",
        cancelUrl,
      );
      emailsSent++;
    }

    // --- 1h reminders (SMS) ---
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const todayDate = now.toISOString().split("T")[0];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const oneHourTime = `${String(oneHourFromNow.getHours()).padStart(2, "0")}:${String(oneHourFromNow.getMinutes()).padStart(2, "0")}`;

    // Get bookings starting in the next hour
    const soonBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.date, todayDate),
          sql`${bookings.startTime} >= ${currentTime}`,
          sql`${bookings.startTime} <= ${oneHourTime}`,
          eq(bookings.status, "confirmed"),
        )
      );

    for (const booking of soonBookings) {
      const [site] = await db
        .select()
        .from(sites)
        .where(eq(sites.id, booking.siteId))
        .limit(1);

      if (!site) continue;
      const translations: Translations = ((site.translations as any)?.pl ?? {}) as Translations;
      const config = deepTranslate(translations, site.config as any);
      const smsConfig = config?.notifications?.sms;

      if (smsConfig?.enabled && smsConfig?.apiToken) {
        const message = `Przypomnienie: ${booking.serviceName} dziś o ${booking.startTime}. Do zobaczenia!`;
        await sendSms({
          provider: smsConfig.provider || "smsapi",
          apiToken: smsConfig.apiToken,
          phoneNumber: booking.customerPhone,
          message,
          senderName: smsConfig.senderName,
        });
        smsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        smsSent,
        tomorrowBookings: tomorrowBookings.length,
        soonBookings: soonBookings.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error sending booking reminders");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
