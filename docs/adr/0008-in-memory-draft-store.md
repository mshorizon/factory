# ADR-0008: In-Memory TTL Store for Admin Preview Drafts

**Status:** accepted  
**Date:** 2026-04-01

## Context
The admin panel needs a "live preview" feature: the admin edits the business profile in a form, and an iframe shows the site re-rendering with those changes — without saving to the database. A temporary storage layer is needed for unsaved edits.

## Decision
Use a **Node.js in-memory Map** (`apps/engine/src/lib/draft-store.ts`) with TTL-based eviction:

- Drafts stored as `Map<businessId, { data, createdAt }>`
- TTL: 30 minutes; max 50 concurrent drafts (LRU-style eviction)
- Preview triggered by `?_preview=1` query param; middleware loads draft instead of DB data
- On save: draft cleared after successful DB write
- Stale entries evicted on every `setDraft()` call — no background cleanup job

## Consequences
**Positive:**
- Zero infrastructure overhead — no Redis, no DB table, no external service
- Sub-millisecond draft reads (in-process memory)
- Automatic cleanup via TTL — no manual management
- Isolated per `businessId` — admins for different businesses can't see each other's drafts

**Negative:**
- Drafts lost on server restart (PM2 restart or Docker redeploy clears state)
- Not shared across multiple server instances (would break load-balanced prod setups)
- Max 50 drafts is arbitrary — could evict unexpectedly in high-traffic admin scenarios

## Alternatives considered
- **Redis** — persistent, shareable across instances; but adds infra dependency; overkill for single-admin scenarios at current scale
- **PostgreSQL draft table** — persistent across restarts; but adds write load and requires cleanup job; admin preview is inherently ephemeral
- **Browser localStorage** — draft stays client-side; but the preview iframe is a separate browser context and can't access the parent's localStorage without postMessage bridging
