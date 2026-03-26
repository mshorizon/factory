import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { AstroCookies } from 'astro';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'changeme-in-production-use-env-var'
);
const COOKIE_NAME = 'admin_token';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

export type JWTPayload = {
  userId: number;
  email: string;
  role: 'super-admin' | 'admin' | 'editor';
  businessId: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Pick<JWTPayload, 'userId'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string) {
  cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });
  cookies.set('admin_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
  cookies.delete('admin_refresh', { path: '/' });
}

export async function getAuthFromCookies(cookies: AstroCookies): Promise<JWTPayload | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
