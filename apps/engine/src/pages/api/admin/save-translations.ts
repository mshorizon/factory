import type { APIRoute } from "astro";
import { updateSiteTranslations } from "@mshorizon/db";
import logger from "../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { businessId, translations } = await request.json();

    if (!businessId || !translations) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or translations" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save to database (merges with existing translations)
    await updateSiteTranslations(businessId, translations);

    return new Response(
      JSON.stringify({ success: true, message: "Translations saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/save-translations" }, "Error saving translations");
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to save translations"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
