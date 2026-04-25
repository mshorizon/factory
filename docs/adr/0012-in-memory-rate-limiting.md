# ADR-0012: In-Memory Token Bucket for Rate Limiting

**Status:** accepted  
**Date:** 2026-04-01

## Context
Public-facing API endpoints (contact form, AI creator) are vulnerable to spam and abuse. Rate limiting is needed to protect them without adding infrastructure dependencies in a single-instance deployment.

## Decision
Use an **in-process Map-based rate limiter** (`apps/engine/src/lib/rate-limit.ts`) with fixed-window counters:

- Per-IP, per-endpoint counters stored in `Map<key, { count, resetAt }>`
- Default limits: 5 requests per 60 seconds for contact form
- Stale entries evicted every 5 minutes (no memory leaks)
- Returns `{ ok, remaining, retryAfter }` — callers decide how to respond
- Combined with **Cloudflare Turnstile CAPTCHA** for bot protection on contact form

## Consequences
**Positive:**
- Zero infrastructure — no Redis, no external service
- Sub-millisecond check (in-process memory)
- Automatic cleanup via periodic eviction
- Easy to adjust limits per endpoint

**Negative:**
- State lost on server restart — counters reset
- Not shared across multiple instances — each process has independent counters (ineffective under load balancing)
- Fixed-window algorithm: burst of N requests at window boundary sends 2N in practice

## Alternatives considered
- **Redis-backed rate limiter** — shared state across instances; persistent; but adds infrastructure dependency; overkill for single-instance VPS deployment
- **Cloudflare WAF rate limiting rules** — works at the edge before traffic hits origin; but requires Cloudflare paid plan and is configured outside the codebase
- **Nginx `limit_req`** — effective, zero app code; but inflexible (can't vary by endpoint logic) and requires Nginx config access
