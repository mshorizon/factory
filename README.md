# MS Horizon: The Site Factory 🏭

## 🤖 AI Context & Mission (Read this first)
You are working on **MS Horizon Factory**, a high-scale production engine for local business websites (SMBs). 

**The Core Concept:** We do NOT build websites manually. We build a **Single Engine (Astro)** and a **Standardized UI Library (React/Tailwind)** that dynamically renders websites based on a **JSON Business Configuration**.

If you are asked to "create a website for a plumber," your task is to ensure the **JSON data** exists and that the **Engine** knows how to render it using existing or new generic components.

---

## 🏗 System Architecture

This is a **Turborepo** monorepo managed with **pnpm**:

- **`apps/engine` (Astro):** The core full-stack renderer. It acts as a multi-tenant system that takes a `client_id` or `domain`, fetches the corresponding JSON, and renders the site.
- **`packages/ui` (React + Tailwind):** The Design System. Components here MUST be "industry-agnostic." They use **CSS Variables** (`--primary`, `--radius`, etc.) for theming. Hardcoded Tailwind colors are strictly forbidden.
- **`packages/schema` (Zod + TS):** The Single Source of Truth. Contains the Zod schemas that define what a "Business Profile" JSON looks like.
- **`data/` (JSON Storage):** Our Git-based CMS. Each `.json` file here represents a unique client (e.g., `barber-stach.json`).

---

## 🛠 Tech Stack
- **Framework:** Astro (Hybrid SSR/SSG)
- **UI:** React (Islands Architecture)
- **Styling:** Tailwind CSS with a Global CSS Variable Theming Strategy
- **Validation:** Zod (Strict contract enforcement)
- **Build Tool:** Turborepo & Vite

---

## 📜 AI Operational Rules

1. **Schema Sovereignty:** Before adding a feature, check `packages/schema`. If the data isn't in the JSON schema, it shouldn't be in the UI.
2. **Theming via Tokens:** Never use specific color classes like `bg-blue-600`. Always use semantic tokens: `bg-primary`, `bg-secondary`, `text-foreground`, etc.
3. **Component Genericness:** Every component in `packages/ui` must be reusable. A `ServiceCard` should work for both a dental clinic and a car wash.
4. **Zero-JS by Default:** Leverage Astro's strengths. Only use React (`client:load`) for components that require actual client-side state (e.g., booking forms, interactive maps).
5. **Data Driven:** Every string, image URL, and price must come from the JSON configuration.

---

## 🚀 Development Workflow

1. **Define the Business:** Create/Update a JSON file in `data/`.
2. **Validate:** Ensure it passes the Zod schema in `packages/schema`.
3. **Render:** The `apps/engine` maps the JSON sections to `packages/ui` components.
4. **Theme:** Apply industry-specific styling via CSS variables defined in the client's metadata.

---

**Note to AI:** You are a Principal Engineer. Optimize for scale, maintainability, and lighthouse scores. If you see a way to further automate the "JSON-to-Site" pipeline, suggest it.