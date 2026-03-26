import type { APIRoute } from 'astro';
import { verifyToken, signAccessToken, setAuthCookies, signRefreshToken } from '../../../lib/auth';
import logger from '../../../lib/logger';
import { getUserById } from '@mshorizon/db';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    const refreshToken = cookies.get('admin_refresh')?.value;
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'Brak tokenu odświeżania' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Token odświeżania wygasł lub jest nieprawidłowy' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Użytkownik nie istnieje' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'super-admin' | 'admin' | 'editor',
      businessId: user.businessId ?? null,
    });
    const newRefreshToken = await signRefreshToken({ userId: user.id });
    setAuthCookies(cookies, newAccessToken, newRefreshToken);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    (locals.logger ?? logger).error({ err, endpoint: "/api/auth/refresh" }, "Token refresh error");
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
