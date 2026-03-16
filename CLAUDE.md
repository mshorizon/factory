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
| `packages/schema` | **Source of Truth.** AJV schemas for business profiles and validation. |
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
* **NO hardcoded spacing.** Never use `py-40`, `gap-6`, `mb-8`, etc. Always use spacing design tokens from `themeSpacing` (e.g., `py-spacing-section`, `gap-spacing-lg`, `mb-spacing-2xl`).
* **Semantic Tokens ONLY.** Use `bg-primary`, `bg-secondary`, `bg-background`, `text-foreground`, `rounded-radius`.
* **Dynamic Injection.** All styles must be driven by `theme.json` metadata injected as CSS variables at the layout level.

#### Spacing Design Tokens
All spacing must use the following tokens from `theme.ui.spacing`:
- `spacing-xs` (0.5rem/8px) - Tight gaps, icon margins
- `spacing-sm` (0.75rem/12px) - Compact spacing
- `spacing-md` (1rem/16px) - Default gaps
- `spacing-lg` (1.5rem/24px) - Comfortable spacing (most common)
- `spacing-xl` (2rem/32px) - Generous spacing
- `spacing-2xl` (3rem/48px) - Large gaps
- `spacing-3xl` (4rem/64px) - Major separations
- `spacing-section-sm` (5rem/80px) - Small section vertical padding (used on non-home pages)
- `spacing-section` (10rem/160px) - Large section vertical padding (used on home page)
- `spacing-container` (2.5rem/40px) - Container horizontal padding

**Page-Specific Spacing:**
- **Home page sections**: Use `py-spacing-section` (160px) for more dramatic spacing
- **Other pages** (about, services, contact): Automatically use `py-spacing-section-sm` (80px) for tighter layouts
- Section components automatically adjust spacing based on `isHomePage` prop

**Examples:**
- Section padding: `py-spacing-section` or `py-spacing-section-sm`
- Flexbox gaps: `gap-spacing-lg`
- Margins: `mb-spacing-3xl`, `mt-spacing-2xl`
- All-side padding: `p-spacing-md`

**Exception:** Fine-grained utilities like `px-2.5`, `py-0.5`, `gap-1.5` are allowed for micro-spacing adjustments within components.

### 🧩 Component Design
* **Industry Agnostic.** Every component in `packages/ui` must be reusable across any niche (from a plumber to a lawyer).
* **Structure.** Use `atoms/` (buttons, inputs) and `sections/` (Hero, Navbar, Footer).
* **Type Safety.** Component props MUST strictly map to the Zod/AJV schemas in `packages/schema`.

### ⚡ Astro & Performance
* **Static by Default.** Use Astro components for content.
* **Selective Hydration.** Use React ONLY for interactivity (forms, widgets) using `client:*` directives.
* **Zero Hardcoded Strings.** All copy, image URLs, and prices must come from the business JSON.
* **Root Rules.** Do not save images and secondary files in root folder. If needed create subfolders.

### 🛠 Schema-First Development
1. If a feature needs new data, update `packages/schema/src/business.schema.json` **first**.
2. Run `pnpm generate` in `packages/schema` to regenerate TypeScript types from the schema.
3. Validate the JSON against the updated schema.
4. Only then implement the UI in `packages/ui`.

**Note:** `packages/schema/src/generated.ts` is auto-generated from `business.schema.json` — never edit it manually. Supplementary types (variant unions, cart runtime types) live in `packages/schema/src/extras.ts`.

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