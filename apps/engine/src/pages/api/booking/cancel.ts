import type { APIRoute } from "astro";
import { getBookingByCancelToken, updateBookingStatus, getSiteBySubdomain } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const booking = await getBookingByCancelToken(token);
    if (!booking) {
      return new Response(JSON.stringify({ error: "Nieprawidłowy lub wygasły link." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (booking.status === "cancelled") {
      return new Response(JSON.stringify({ message: "Rezerwacja została już odwołana." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (booking.status === "completed") {
      return new Response(JSON.stringify({ error: "Nie można odwołać zakończonej wizyty." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await updateBookingStatus(booking.id, "cancelled");

    // Return simple HTML page confirming cancellation
    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rezerwacja odwołana</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { background: white; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #16181D; font-size: 1.5rem; margin-bottom: 16px; }
    p { color: #64748b; line-height: 1.6; }
    .details { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: left; }
    .details p { margin: 4px 0; color: #334155; font-size: 0.9rem; }
    .check { font-size: 3rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">&#10003;</div>
    <h1>Rezerwacja odwołana</h1>
    <p>Twoja rezerwacja została pomyślnie odwołana.</p>
    <div class="details">
      <p><strong>Usługa:</strong> ${booking.serviceName}</p>
      <p><strong>Data:</strong> ${booking.date.split("-").reverse().join(".")}</p>
      <p><strong>Godzina:</strong> ${booking.startTime} – ${booking.endTime}</p>
    </div>
    <p>Jeśli chcesz umówić się ponownie, odwiedź naszą stronę.</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error cancelling booking");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
