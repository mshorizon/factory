import type { APIRoute } from "astro";
import { upsertSiteConfig } from "@mshorizon/db";
import { clearDraft } from "../../../lib/draft-store";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { businessId, data } = await request.json();

    if (!businessId || !data) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic validation
    if (!data.schemaVersion || !data.business || !data.theme) {
      return new Response(
        JSON.stringify({ message: "Invalid data: missing required fields" }),
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
    console.error("Error saving business data:", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to save"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
