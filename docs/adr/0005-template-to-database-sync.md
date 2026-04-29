# ADR-0005: Git Templates as Blueprints, PostgreSQL as Runtime Store

**Status:** accepted  
**Date:** 2026-04-01

## Context
Business configurations need to be version-controlled (auditable, rollback-capable, diff-friendly) but also queried efficiently at runtime for multi-tenant serving. Serving directly from files would make multi-business queries complex; storing directly in DB loses version history.

## Decision
Separate concerns into two layers:

- **`/templates/{name}/{name}.json`** — Git-tracked source of truth; JSON blueprints for each template type
- **`packages/db/src/seed.ts`** — Sync script that reads templates and upserts into PostgreSQL `sites.config` (JSONB)
- **Runtime** — Astro engine always reads from PostgreSQL, never from filesystem

Workflow: edit template JSON → run `db:seed` → restart PM2 → changes are live.

## Consequences
**Positive:**
- Git history for every template change (diff, blame, revert)
- Database enables fast multi-tenant queries with indexed lookups
- Templates serve as onboarding blueprints: new client = copy template JSON, customize, seed
- Blog/project data has a separate migration script (`copy-blogs.ts`) for DB-to-DB moves

**Negative:**
- Two-step update: edit file AND run seed (easy to forget; CLAUDE.md warns about this)
- Seed script syncs ALL templates — partial updates require direct DB edits
- Local dev without VPN/SSH to DB requires `DATABASE_URL` with remote credentials

## Alternatives considered
- **Serve directly from filesystem** — no DB roundtrip; but makes multi-tenant querying complex (N file reads per request) and breaks admin panel save flow
- **DB as primary, no template files** — loses version control; harder to onboard new templates; no Git-level diff of config changes
- **Headless CMS (Contentful, Sanity)** — external dependency, cost at scale, data leaves the stack; the factory's structured JSON schema is a better fit than a generic CMS
