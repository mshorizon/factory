import type { APIRoute } from "astro";
import { sendSms } from "../../../../lib/sms";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { provider, apiToken, phoneNumber, senderName } = body;

    if (!apiToken || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing apiToken or phoneNumber" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await sendSms({
      provider: provider || "smsapi",
      apiToken,
      phoneNumber,
      message: "Test notification from MS Horizon panel.",
      senderName,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
