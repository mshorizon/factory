import type { APIRoute } from "astro";
import { getSiteBySubdomain, getBookingsBySiteId } from "@mshorizon/db";
import logger from "../../../../lib/logger";

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const businessId = url.searchParams.get("business");
    const status = url.searchParams.get("status") || undefined;

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "Missing business parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const bookings = await getBookingsBySiteId(site.id, status);

    return new Response(
      JSON.stringify({ bookings }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "Error listing bookings");
    return new Response(
      JSON.stringify({ error: "Failed to list bookings" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
