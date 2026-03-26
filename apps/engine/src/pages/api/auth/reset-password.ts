import type { APIRoute } from 'astro';
import { getPasswordResetToken, markPasswordResetTokenUsed, updateUserPassword } from '@mshorizon/db';
import { hashPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const token = String(body.token || '').trim();
    const newPassword = String(body.password || '');

    if (!token || !newPassword) {
      return new Response(JSON.stringify({ error: 'Token i nowe hasło są wymagane' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Hasło musi mieć co najmniej 8 znaków' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resetToken = await getPasswordResetToken(token);

    if (!resetToken) {
      return new Response(JSON.stringify({ error: 'Nieprawidłowy lub wygasły token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (resetToken.usedAt) {
      return new Response(JSON.stringify({ error: 'Token został już użyty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (new Date() > resetToken.expiresAt) {
      return new Response(JSON.stringify({ error: 'Token wygasł' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(resetToken.userId, passwordHash);
    await markPasswordResetTokenUsed(resetToken.id);

    return new Response(JSON.stringify({ ok: true, message: 'Hasło zostało zmienione pomyślnie.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
