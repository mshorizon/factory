# ADR-0010: Dual-Token JWT Authentication (Access + Refresh)

**Status:** accepted  
**Date:** 2026-04-01

## Context
The admin panel requires authentication. Admins often access the panel from mobile devices or infrequently, so session lifetime is a UX concern. Short-lived tokens improve security but cause annoying logouts; long-lived tokens are risky if stolen.

## Decision
Implement a **dual-token JWT system** with HttpOnly cookies:

- **Access token**: 15-minute TTL, sent on every request
- **Refresh token**: 30-day TTL, used to silently obtain a new access token
- Both stored as **HttpOnly, Secure cookies** — inaccessible to JavaScript (XSS-resistant)
- Middleware detects expired access tokens → checks refresh token → issues new access token transparently
- Login: `POST /api/auth/login` → validates credentials → sets both cookies
- Logout: clears both cookies
- Password reset via time-limited tokens stored in `password_reset_tokens` table

The 30-day refresh window was deliberately extended (from a shorter default) to reduce mobile admin logouts.

## Consequences
**Positive:**
- Short access token window (15 min) limits damage if a token is intercepted
- Long refresh window (30 days) gives persistent sessions without re-login friction on mobile
- Stateless authentication — no session table; each token is self-verifying via `JWT_SECRET`
- HttpOnly cookies prevent XSS from stealing tokens

**Negative:**
- No server-side token revocation for access tokens (must wait for 15-min expiry)
- Refresh token compromise gives 30-day access — if needed, `JWT_SECRET` rotation invalidates all tokens
- Stateless means "force logout all sessions" requires secret rotation

## Alternatives considered
- **Single long-lived JWT** — simpler; but a stolen token is valid for days/weeks
- **Database sessions** — easy revocation; but adds a DB read on every request; more state to manage
- **OAuth2 / third-party auth (Auth.js, Clerk)** — reduces auth code; but adds external dependency; overkill for a single-admin internal tool
