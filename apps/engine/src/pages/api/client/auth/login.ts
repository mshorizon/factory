import type { APIRoute } from "astro";
import {
  getSiteBySubdomain,
  getClientUserByEmail,
  createClientSession,
} from "@mshorizon/db";
import {
  verifyPassword,
  generateSessionToken,
  makeSessionCookie,
  SESSION_DURATION_MS,
} from "../../../../lib/client-auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email i hasło są wymagane" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const site = locals.site;
    if (!site) {
      return new Response(
        JSON.stringify({ message: "Witryna nie znaleziona" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await getClientUserByEmail(site.id, email.toLowerCase().trim());
    if (!user) {
      return new Response(
        JSON.stringify({ message: "Nieprawidłowy email lub hasło" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return new Response(
        JSON.stringify({ message: "Nieprawidłowy email lub hasło" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await createClientSession({ userId: user.id, token, expiresAt });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": makeSessionCookie(token, expiresAt),
        },
      }
    );
  } catch (error) {
    console.error("Client login error:", error);
    return new Response(
      JSON.stringify({ message: "Błąd serwera" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
