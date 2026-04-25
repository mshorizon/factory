# ADR-0014: PM2 for Dev Environment, Coolify + Docker for Production

**Status:** accepted  
**Date:** 2026-04-01

## Context
The factory needs two deployment targets: a development environment for testing changes before release, and a production environment serving real clients. Both must run on the same Hetzner VPS. The dev environment needs fast iteration (code changes → visible in seconds); production needs reliability and auto-deploy on git push.

## Decision
Run two parallel deployment strategies on the same host:

**Development (`*.dev.hazelgrouse.pl`):**
- PM2 process manager runs `pnpm dev` (Astro dev server) directly on the host
- Port 4321, proxied via Traefik config at `/data/coolify/proxy/dynamic/dev-astro.yaml`
- Restart: `pm2 restart astro-dev`; logs: `pm2 logs astro-dev`
- Claude Code hooks auto-restart PM2 on relevant file changes

**Production (`*.hazelgrouse.pl`):**
- Coolify manages Docker containers on the same Hetzner VPS
- Auto-deploy triggered on `git push` to `main` branch
- Port 3000, Astro built with `output: 'server'` + Node standalone adapter
- Wildcard SSL via Traefik + Let's Encrypt

**Git flow:** `develop` branch → test on dev → merge to `main` → Coolify auto-deploys prod.

## Consequences
**Positive:**
- Dev and prod run on same infra — cost-efficient for early stage
- Dev uses Astro HMR — instant feedback on file changes
- Prod uses battle-tested Docker + Coolify deployment pipeline
- Branch-based promotion (`develop` → `main`) prevents accidental prod deployments

**Negative:**
- Shared VPS means dev server resource usage affects prod (and vice versa)
- PM2 dev server has no container isolation — a crash could affect the host
- Two different runtime environments (PM2 raw Node vs Docker) can mask env-specific bugs

## Alternatives considered
- **Docker for dev too** — consistent environments; but much slower iteration (rebuild image on every change); no HMR
- **Separate VPS for dev** — full isolation; but doubles infra cost at early stage
- **Vercel/Netlify for prod** — zero-config deployment; but limits to serverless functions (no long-running processes like health cron, no PM2); higher cost at scale; less control over infrastructure
