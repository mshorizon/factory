import type { APIRoute } from "astro";
import {
  countClientUsersBySiteId,
  createClientUser,
  createClientSession,
} from "@mshorizon/db";
import {
  hashPassword,
  generateSessionToken,
  makeSessionCookie,
  SESSION_DURATION_MS,
} from "../../../../lib/client-auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ message: "Imię, email i hasło są wymagane" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: "Hasło musi mieć co najmniej 8 znaków" }),
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

    // Only allow setup if no users exist yet
    const userCount = await countClientUsersBySiteId(site.id);
    if (userCount > 0) {
      return new Response(
        JSON.stringify({ message: "Konto już istnieje. Zaloguj się." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createClientUser({
      siteId: site.id,
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      role: "owner",
    });

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await createClientSession({ userId: user.id, token, expiresAt });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": makeSessionCookie(token, expiresAt),
      },
    });
  } catch (error) {
    console.error("Client setup error:", error);
    return new Response(
      JSON.stringify({ message: "Błąd serwera" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
