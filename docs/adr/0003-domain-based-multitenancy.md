# ADR-0003: Domain/Subdomain-Based Multi-Tenancy

**Status:** accepted  
**Date:** 2026-04-01

## Context
The factory must serve distinct businesses from a single Astro application instance. Each business has its own data, theme, and content. A mechanism is needed to resolve which business's data to load on each incoming request.

## Decision
Use **subdomain extraction** as the primary business resolution strategy, with a fallback chain:

1. `?business=X` query parameter (dev/testing override)
2. `DOMAIN_MAP` env var — JSON mapping custom domains to business IDs
3. Subdomain extracted from `BASE_DOMAIN` (e.g., `barber.hazelgrouse.pl` → `barber`)
4. `DEFAULT_BUSINESS` env var fallback

Resolution implemented in `apps/engine/src/lib/business.ts` and called in `src/middleware.ts` on every request. The resolved `businessId` is attached to Astro locals and used throughout the request lifecycle.

## Consequences
**Positive:**
- One deployed instance handles 100+ businesses — no per-client infra
- Custom domains supported via `DOMAIN_MAP` without code changes
- Wildcard DNS (`*.hazelgrouse.pl`) routes all subdomains to the same server
- Zero data leakage: all DB queries filter by `siteId` (FK enforced)

**Negative:**
- Every request has a subdomain lookup latency (mitigated by indexed `subdomain` column)
- Wildcard SSL certificate required (handled by Coolify/Traefik)
- Local dev requires hosts file or tunnel setup for subdomain testing

## Alternatives considered
- **Path-based routing** (`hazelgrouse.pl/barber/`) — simpler SSL, but looks unprofessional for client-facing sites; clients want their own domain
- **Separate deployments per client** — eliminates shared-infra complexity but kills scalability; 100 clients = 100 servers
- **Header-based routing** — requires reverse proxy config per client; not portable
