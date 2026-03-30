import type { APIRoute } from "astro";
import { getSiteBySubdomain, getBookingsByDateAndSiteId } from "@mshorizon/db";
import logger from "../../../../lib/logger";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    const { businessId } = params;
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");

    if (!businessId || !date || !serviceId) {
      return new Response(
        JSON.stringify({ error: "Missing parameters: date, serviceId required" }),
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

    // Get day of week from date
    const dateObj = new Date(date + "T12:00:00");
    const dayKey = DAY_KEYS[dateObj.getDay()];
    const dayHours = config.hours?.[dayKey];

    if (!dayHours || dayHours.enabled === false) {
      return new Response(
        JSON.stringify({ slots: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get service duration
    const service = (config.services ?? []).find((s: any) => s.id === serviceId);
    const serviceDuration = service?.duration ?? config.slotInterval ?? 60;
    const slotInterval = config.slotInterval ?? 60;
    const leadTime = config.leadTime ?? 60;

    // Generate all possible slots for the day
    const openMinutes = timeToMinutes(dayHours.open ?? "09:00");
    const closeMinutes = timeToMinutes(dayHours.close ?? "17:00");
    const allSlots: string[] = [];

    for (let m = openMinutes; m + serviceDuration <= closeMinutes; m += slotInterval) {
      allSlots.push(minutesToTime(m));
    }

    // Get existing bookings for this date
    const existingBookings = await getBookingsByDateAndSiteId(site.id, date);
    const bookedTimes = new Set(
      existingBookings
        .filter((b) => b.status !== "cancelled")
        .map((b) => b.startTime)
    );

    // Filter out booked slots and past slots
    const now = new Date();
    const nowDateStr = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + leadTime;

    const availableSlots = allSlots.filter((slot) => {
      // Skip if already booked
      if (bookedTimes.has(slot)) return false;
      // Skip if too soon (only for today)
      if (date === nowDateStr) {
        const slotMinutes = timeToMinutes(slot);
        if (slotMinutes < nowMinutes) return false;
      }
      return true;
    });

    return new Response(
      JSON.stringify({ slots: availableSlots }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error fetching booking availability");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
