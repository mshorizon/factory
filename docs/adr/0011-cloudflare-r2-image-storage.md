# ADR-0011: Cloudflare R2 for Business Image Storage

**Status:** accepted  
**Date:** 2026-04-01

## Context
Business profiles reference images (hero photos, service icons, logos). These images must be stored somewhere accessible to the rendering engine and uploadable via the admin panel. Each business should have isolated storage to prevent filename collisions.

## Decision
Use **Cloudflare R2** (S3-compatible object storage) for all business images:

- Images organized by `/{businessId}/{filename}` path prefix for tenant isolation
- Admin panel uploads via `POST /api/admin/upload-image` → R2 via `@aws-sdk/client-s3`
- Template JSON stores relative paths (`/images/hero.jpg`); runtime `deepResolveImages()` converts to full R2 URLs
- `SafeImage` component handles R2 URL rendering with fallback for broken images
- R2 initialized lazily (`initR2()`) in middleware with env vars

## Consequences
**Positive:**
- S3-compatible API — standard SDK, easy migration to AWS S3 if needed
- No egress fees on R2 (unlike AWS S3) — cost-effective for image-heavy sites
- Cloudflare CDN caching available for R2 public bucket URLs
- Per-business path isolation prevents filename collisions across 100+ businesses

**Negative:**
- R2 is a Cloudflare-specific service — mild vendor lock-in (mitigated by S3 compatibility)
- Images in template JSON are relative paths — they must be resolved before rendering (extra processing step)
- No automatic image optimization (WebP conversion, resizing) — must use Cloudflare Images or implement separately

## Alternatives considered
- **AWS S3** — industry standard; same API; but egress fees at scale; R2 is cheaper for this use case
- **Local filesystem storage** — simple; but breaks in Docker deployments (ephemeral filesystem) and multi-instance setups
- **Cloudinary / Imgix** — image optimization built-in; but per-image pricing at scale; adds external dependency
