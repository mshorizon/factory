MS Horizon: The Site Factory 🏭
⚠️ Internal Developer Instructions for AI (Claude/Cursor)
You are working on a Mass-Scale Site Factory. Our goal is NOT to build individual websites, but to maintain a Single Engine and a Standardized Design System that renders hundreds of unique local business sites (Barbers, Plumbers, Car Dealers) based on a structured JSON data layer.

Core Architectural Principles:
Data-Driven Rendering: Everything in apps/engine must be mapped to a schema defined in packages/schema. No hardcoded strings.
 
Component Sovereignty: UI components in packages/ui must be pure, accessible, and themed via CSS Variables (--primary, --radius, etc.).

Multi-Tenancy: The engine must switch themes and content based on a client_id or domain.

Performance Obsession: Use Astro's zero-JS-by-default approach. React is only for complex islands (e.g., booking widgets).

📂 Repository Architecture
apps/engine (Astro): The core full-stack renderer. It consumes JSON/Database data and outputs high-performance websites.

packages/ui (React + Tailwind): The Design System. Contains "Industry-Agnostic" components that adapt their look via CSS variables.

packages/schema (Zod + TS): The "Source of Truth". Defines the strict contract for what a "Local Business" data object looks like.

packages/database (Drizzle + Turso): Persistence layer for when we move beyond static JSON files.

data/ (JSON Storage): Currently acting as a Git-based CMS. Each file is a full business profile.

🛠 Tech Stack
Mono-repo: Turborepo + pnpm

Framework: Astro (Hybrid Mode)

Styling: Tailwind CSS (Custom Strategy: Global CSS Variables for Theming)

Validation: Zod (Strict typing for all client data)

Runtime: Node.js 20+

🤖 AI Workflow Rules
When generating code or components:

Check the Schema: Always refer to packages/schema before creating a new component prop.

Use the Design System: Do not use arbitrary Tailwind colors (like bg-blue-500). Use semantic classes or CSS variables (like bg-primary).

Scale in Mind: Ask yourself: "Will this component work for both a florist and a lawyer?" If not, make it more generic or create an industry-specific variant in packages/ui/sections.

DRY is Law: If you see a pattern repeating across three sites, abstract it into the engine or ui package.