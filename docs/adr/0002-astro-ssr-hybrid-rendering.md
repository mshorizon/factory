# ADR-0002: Astro SSR with Node Adapter as Rendering Engine

**Status:** accepted  
**Date:** 2026-04-01

## Context
The rendering engine must serve 100+ different businesses from a single deployment. Each request must resolve which business's data to load (via subdomain) and render an appropriate site. Static generation (SSG) cannot work because content is dynamic per domain at runtime.

## Decision
Use **Astro 5 with `output: 'server'`** and the `@astrojs/node` adapter in standalone mode.

- Astro components render server-side HTML on every request
- React components hydrated client-side only where interactivity is needed (`client:load`, `client:idle`)
- Node standalone adapter produces a deployable Node.js server (no Vercel/Netlify required)
- Middleware intercepts every request to resolve the business context before page rendering

## Consequences
**Positive:**
- Zero JS by default — Astro components ship no JavaScript
- Database queries at request time → content always fresh, no stale builds
- Single deployment serves unlimited businesses (multi-tenant by design)
- React islands for forms, cart, dark mode toggle without full SPA overhead

**Negative:**
- No static caching out of the box (Astro SSG would be faster for static sites)
- Each request hits the database — requires connection pooling
- Server restart required after code changes (PM2 in dev, Docker redeploy in prod)

## Alternatives considered
- **Next.js App Router** — SSR capable, but heavy React dependency for all pages; less control over hydration boundaries; more complex multi-tenant setup
- **Remix** — good SSR story but smaller ecosystem; Astro's island architecture better fits the mixed static/interactive use case
- **Astro SSG + revalidation** — considered but rejected because business content changes require immediate reflection without rebuild delays
