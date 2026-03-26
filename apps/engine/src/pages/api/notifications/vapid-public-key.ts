import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const publicKey = import.meta.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return new Response(JSON.stringify({ error: "VAPID not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ publicKey }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
