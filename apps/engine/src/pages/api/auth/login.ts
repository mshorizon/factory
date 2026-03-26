import type { APIRoute } from 'astro';
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from '../../../lib/auth';
import logger from '../../../lib/logger';
import {
  getUserByEmail,
  logLoginAttempt,
  updateUserLastLogin,
  getRecentFailedAttempts,
} from '@mshorizon/db';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const ip = request.headers.get('x-forwarded-for') || null;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email i hasło są wymagane' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: max 10 failed attempts in 15 minutes
    const failedAttempts = await getRecentFailedAttempts(email, 15 * 60 * 1000);
    if (failedAttempts >= 10) {
      return new Response(
        JSON.stringify({ error: 'Zbyt wiele nieudanych prób logowania. Spróbuj za 15 minut.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await getUserByEmail(email);
    const success = user ? await verifyPassword(password, user.passwordHash) : false;

    await logLoginAttempt(email, ip, success);

    if (!success || !user) {
      return new Response(JSON.stringify({ error: 'Nieprawidłowy email lub hasło' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateUserLastLogin(user.id);

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'super-admin' | 'admin' | 'editor',
      businessId: user.businessId ?? null,
    });
    const refreshToken = await signRefreshToken({ userId: user.id });
    setAuthCookies(cookies, accessToken, refreshToken);

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    (locals.logger ?? logger).error({ err, endpoint: "/api/auth/login" }, "Login error");
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd serwera' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
