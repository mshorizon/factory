import type { APIRoute } from 'astro';
import { getUserByEmail, createPasswordResetToken } from '@mshorizon/db';
import { randomBytes } from 'crypto';
import logger from '../../../lib/logger';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email jest wymagany' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Always return success to avoid email enumeration
    const user = await getUserByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await createPasswordResetToken(user.id, token, expiresAt);

      // TODO: Send email with reset link
      // The reset link would be: /admin/reset-password?token={token}
      console.log(`[reset-password] Reset token for ${email}: ${token}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    (locals.logger ?? logger).error({ err, endpoint: "/api/auth/reset-password-request" }, "Reset password request error");
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
