import type { APIRoute } from "astro";
import { setDraft } from "../../../lib/draft-store";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { businessId, data, translations } = await request.json();

    if (!businessId || !data) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    setDraft(businessId, {
      businessData: data,
      translations: translations || { en: {}, pl: {} },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error storing draft:", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to store draft",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
