import type { APIRoute } from "astro";
import { getBookingById, updateBookingStatus } from "@mshorizon/db";
import logger from "../../../../lib/logger";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId or status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const booking = await getBookingById(Number(bookingId));
    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = await updateBookingStatus(booking.id, status);

    return new Response(
      JSON.stringify({ success: true, booking: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error updating booking status");
    return new Response(
      JSON.stringify({ error: "Failed to update booking" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
