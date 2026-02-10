# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MS Horizon Factory is a multi-tenant "Site Factory" that generates unique websites for local businesses from a single engine and design system. We do NOT build websites manually - we build a single engine that dynamically renders sites based on JSON business configurations.

## Architecture

**Monorepo:** Turborepo + pnpm

| Workspace | Purpose |
|-----------|---------|
| `apps/engine` | Astro hybrid SSR/SSG renderer - takes client_id/domain, fetches JSON, renders site |
| `packages/ui` | React + Tailwind design system - industry-agnostic components |
| `packages/schema` | Zod schemas - single source of truth for business profile structure |
| `templates/*.json` | Git-based CMS - each file is a unique client configuration |

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Run all workspaces in dev mode
pnpm build                # Build all workspaces
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
