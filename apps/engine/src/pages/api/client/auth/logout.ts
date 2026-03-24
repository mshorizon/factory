import type { APIRoute } from "astro";
import { deleteClientSession } from "@mshorizon/db";
import { SESSION_COOKIE, clearSessionCookie } from "../../../../lib/client-auth";

export const POST: APIRoute = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1]
    ?.trim();

  if (token) {
    await deleteClientSession(token);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
};
