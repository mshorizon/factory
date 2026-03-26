import type { APIRoute } from 'astro';
import { clearAuthCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
