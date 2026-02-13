# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MS Horizon Factory is a multi-tenant "Site Factory" that generates unique websites for local businesses from a single engine and design system. We do NOT build websites manually - we build a single engine that dynamically renders sites based on JSON business configurations.

## Architecture

### Monorepo: Turborepo + pnpm

| Workspace | Purpose |
|-----------|---------|
| `apps/engine` | Astro hybrid SSR/SSG renderer - takes client_id/domain, fetches JSON, renders site |
| `packages/config` | Shared configurations for MS Horizon |
| `packages/db` | PostgreSQL database (on coolify) layer with Drizzle ORM - here are stored bussineses jsons like plumber.json, barber.json. Those jsons are build based on bussines templates stored in templates folder |
| `packages/schema` | Ajv schemas - single source of truth for business profile structure with validation |
| `packages/ui` | React + Tailwind design system - industry-agnostic components |
| `templates/{bussines_template_name}/{bussines_template_name}.json` | Git-based CMS - each file is a unique client configuration |

### Machines & enviroments**
There is one machine where code is run and production is hosted. This machine is Hetzner VPS on ip: 46.224.191.237
`ssh root@46.224.191.237`

Main domain is hazelgrouse.pl


There are two environments:

#### Dev:
Websites are public visible on url *.dev.hazelgrouse.pl e.g. specialist.dev.hazelgrouse.pl (from bussines template), plumber.dev.hazelgrouse.pl(for bussines from database)

To achive visibility from VSP to public i Use coolify and traffic on configuration:

```bash
cat <<'EOF' | sudo tee /data/coolify/proxy/dynamic/dev-astro.yaml > /dev/null
http:
  routers:
    astro-dev-static-router:
      rule: "Host(`plumber.dev.hazelgrouse.pl`) || Host(`barber.dev.hazelgrouse.pl`) || Host(`honey-worker.dev.hazelgrouse.pl`) || Host(`game-selector.dev.hazelgrouse.pl`) || Host(`wife-art-gallery.dev.hazelgrouse.pl`) || Host(`wife-cakes.dev.hazelgrouse.pl`) || Host(`specialist.dev.hazelgrouse.pl`) || Host(`szater.dev.hazelgrouse.pl`)"
      entryPoints:
        - https
      service: astro-dev-service
      tls:
        certResolver: letsencrypt

  services:
    astro-dev-service:
      loadBalancer:
        servers:
          - url: "http://10.0.0.1:4321"
EOF
```

after change configuration > there is need to run: `docker stop coolify-proxy && docker start coolify-proxy`
logs are visible under: `docker logs coolify-proxy --tail 50`

PM2 run pnpm dev as a servise:
`PORT=4321 HOST=0.0.0.0 pm2 start npm --name "astro-dev" -- run dev -- -- --host 0.0.0.0 --disable-host-check`  # to run pnpm dev inside pm2 as a servise
`pm2 status`                                                                                                    # to checking pm2 status of astro-dev
`pm2 delete astro-dev 2>/dev/null`                                                                              # if status of `astro-dev` is errored then delete then run pm2 again

#### Prod:

Production is running on Coolify project/app. After `git push` there is autodeploy and changes are visible on *.hazelgrouse.pl e.g. specialist.hazelgrouse.pl (from bussines template), plumber.hazelgrouse.pl(for bussines from database)

Actual domains:
`https://hazelgrouse.pl/,https://barber.hazelgrouse.pl/,https://plumber.hazelgrouse.pl/,https://honey-worker.hazelgrouse.pl/,https://game-selector.hazelgrouse.pl/,https://zakletewdrewnie.hazelgrouse.pl/,https://wife-art-gallery.hazelgrouse.pl/,https://wife-cakes.hazelgrouse.pl/,https://specialist.hazelgrouse.pl/,https://szater.hazelgrouse.pl/`

`pnpm start` # Start command


## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all workspaces
pnpm dev                  # Run all workspaces in dev mode - it is running inside pm2 everytime when VPS machine starts so claude dont have to start it mannually
pnpm lint                 # Lint all workspaces
pnpm type-check           # Type-check all workspaces
pnpm add <pkg> --filter <workspace>  # Add dependency to specific workspace
```

## Strict Coding Rules

### Theming (Mandatory)
- **NO hardcoded colors** - never use `bg-blue-500`, `text-gray-900`, etc.
- **Use semantic tokens only** - `bg-primary`, `bg-secondary`, `bg-background`, `text-foreground`, `rounded-radius`
- Theming is controlled via CSS variables at root/layout level based on JSON metadata

### Component Design
- All `packages/ui` components must be industry-agnostic
- Structure: `atoms/` (Buttons, Inputs) and `sections/` (Hero, Navbar, ServiceGrid)
- Props must map directly to Zod schemas in `packages/schema`

### Astro & Performance
- Zero JS by default - use Astro components for static content
- React only for interactivity (booking widgets, forms) with `client:*` directives
- Use Astro's native image components for `templates/` assets

### Schema-First Development
- Before adding any feature, check `packages/schema/src/client.ts` first
- If the field doesn't exist in schema, add it there before touching UI
- Every component must be strictly typed using shared schema

### Data-Driven Content
- Never hardcode strings like "Welcome to our Barbershop"
- All strings, image URLs, prices must come from JSON configuration

## Workspace Boundaries

- `@mshorizon/ui` must NOT import from `apps/engine`
- Every piece of code must work for 100+ different businesses - abstract if too specific
- Do not create multiple repositories for different clients - everything stays in this monorepo
