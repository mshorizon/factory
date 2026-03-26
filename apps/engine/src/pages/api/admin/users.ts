import type { APIRoute } from 'astro';
import {
  getAllUsers,
  getUserByEmail,
  createUser,
  deleteUser,
  updateUserPassword,
  getAllSubdomains,
} from '@mshorizon/db';
import { hashPassword, getAuthFromCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== 'super-admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const [users, businesses] = await Promise.all([getAllUsers(), getAllSubdomains()]);
  return new Response(JSON.stringify({ users, businesses }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== 'super-admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'create') {
    const { email, password, role, businessId } = body;
    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, role, businessId: businessId || undefined });
    return new Response(JSON.stringify({ user }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'delete') {
    const { userId } = body;
    if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (userId === auth.userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    await deleteUser(userId);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'change-password') {
    const { userId, password } = body;
    if (!userId || !password) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const passwordHash = await hashPassword(password);
    await updateUserPassword(userId, passwordHash);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
};
