import type { APIRoute } from "astro";
import { upsertSiteConfig } from "@mshorizon/db";
import { validate } from "@mshorizon/schema";
import { clearDraft } from "../../../lib/draft-store";
import logger from "../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { businessId, data } = await request.json();

    if (!businessId || !data) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate against JSON schema
    const { valid, errors } = validate(data);
    if (!valid) {
      (locals.logger ?? logger).warn({ errors, endpoint: "/api/admin/save" }, "Schema validation failed");
      const errorDetail = errors?.map((e: any) => `${e.instancePath}: ${e.message}`).join("; ") || "Unknown";
      return new Response(
        JSON.stringify({ message: `Validation: ${errorDetail}`, errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save to database
    await upsertSiteConfig(businessId, data);

    // Clear the in-memory draft since data is now persisted
    clearDraft(businessId);

    return new Response(
      JSON.stringify({ success: true, message: "Saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/save" }, "Error saving business data");
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to save"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
