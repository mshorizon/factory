# Hazelgrouse Studio / MS Horizon Factory

This file provides critical guidance for Claude Code and AI assistants working in this repository. We are building a high-velocity "Site Factory" for local businesses.

## 🎯 Project Vision
**Hazelgrouse Studio** (MS Horizon Factory) is NOT a traditional agency. We don't build sites manually. We develop a **single rendering engine** that dynamically generates unique, high-performance websites for local businesses (barbers, plumbers, etc.) based on structured JSON configurations.

---

## 🏗 Architecture (Turborepo + pnpm)

| Workspace | Description |
| :--- | :--- |
| `apps/engine` | **Astro Hybrid Renderer.** Fetches JSON based on domain/subdomain and renders the site. |
| `packages/ui` | **React + Tailwind Design System.** Industry-agnostic atomic components and sections. |
| `packages/schema` | **Source of Truth.** AJV/Zod schemas for business profiles and validation. |
| `packages/db` | **Data Layer.** PostgreSQL (Coolify) + Drizzle ORM. Stores business JSONs. |
| `packages/config` | Shared ESLint, TypeScript, and Tailwind configurations. |
| `templates/` | **Git-based CMS.** Blueprint JSON files used to scaffold new businesses. |

---

## 🌐 Infrastructure & Environments
**Host:** Hetzner VPS (`46.224.191.237`) | **Control Panel:** Coolify | **Main Domain:** `hazelgrouse.pl`

### Dev Environment (`*.dev.hazelgrouse.pl`)
* **Mechanism:** PM2 running directly on the host.
* **Port:** `4321` (mapped via Traefik in `/data/coolify/proxy/dynamic/dev-astro.yaml`).
* **Deployment:** Managed manually or via script on the VPS.
* **Commands:**
    * `pm2 status` — Check `astro-dev` status.
    * `pm2 logs astro-dev --lines 200` — View logs.
    * `PORT=4321 HOST=0.0.0.0 pm2 start npm --name "astro-dev" -- run dev -- -- --host 0.0.0.0 --disable-host-check`

### Prod Environment (`*.hazelgrouse.pl`)
* **Mechanism:** Docker containers managed by Coolify.
* **Deployment:** Auto-deploy on `git push`.
* **Port:** `3000`.

### Live websites

| Name/Domain | Kind | Links | Description |
| :--- | :--- | :--- | :--- |
| `specialist` | template | [prod](https://specialist.hazelgrouse.pl/), [dev](https://specialist.dev.hazelgrouse.pl/), [dev-admin-panel](https://specialist.dev.hazelgrouse.pl/admin), [design](https://electria.framer.website/) | Specialist template for bussineses like electrician, plumber, barber e.g. |

---

## 📜 Strict Coding Rules (Non-Negotiable)

### 🎨 Theming & Styling
* **NO hardcoded colors.** Never use `bg-blue-500` or `text-gray-900`.
* **Semantic Tokens ONLY.** Use `bg-primary`, `bg-secondary`, `bg-background`, `text-foreground`, `rounded-radius`.
* **Dynamic Injection.** All styles must be driven by `theme.json` metadata injected as CSS variables at the layout level.

### 🧩 Component Design
* **Industry Agnostic.** Every component in `packages/ui` must be reusable across any niche (from a plumber to a lawyer).
* **Structure.** Use `atoms/` (buttons, inputs) and `sections/` (Hero, Navbar, Footer).
* **Type Safety.** Component props MUST strictly map to the Zod/AJV schemas in `packages/schema`.

### ⚡ Astro & Performance
* **Static by Default.** Use Astro components for content.
* **Selective Hydration.** Use React ONLY for interactivity (forms, widgets) using `client:*` directives.
* **Zero Hardcoded Strings.** All copy, image URLs, and prices must come from the business JSON.

### 🛠 Schema-First Development
1. If a feature needs new data, update `packages/schema/src/client.ts` **first**.
2. Validate the JSON against the updated schema.
3. Only then implement the UI in `packages/ui`.

---

## 🛠 Useful Commands

| Command | Action |
| :--- | :--- |
| `pnpm install` | Install dependencies. |
| `pnpm build` | Build all workspaces. |
| `pnpm dev` | Run development mode (usually handled by PM2 on VPS). |
| `pnpm type-check` | Validate TypeScript across the monorepo. |
| `pnpm add <pkg> --filter <workspace>` | Add dependency to a specific package. |

---

## 🤖 AI Interaction Guidelines
* **Communication Style:** Technical, "dev-to-dev", 100% honest. No fluff.
* **Scalability Mindset:** Every piece of code must work for 100+ different businesses simultaneously.
* **Workspace Boundaries:** `@mshorizon/ui` must NOT import from `apps/engine`. Abstract logic if it becomes too specific.
* **Remote Context:** I am a Senior Frontend Dev. I often run commands via VSCode Tunnel or mobile. Keep commands copy-paste friendly.