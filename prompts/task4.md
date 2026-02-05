# Prompt: Migrate Astro Factory from JSON Files to PostgreSQL with Drizzle ORM

## Context
I am building a website factory using **Astro**, **React**, and **Turborepo** (managed by `pnpm`). Currently, my "source of truth" for client websites consists of JSON files stored in `data/business/json/*.json`. I am using a schema similar to the provided `plumber.json`.

I want to migrate this to a **PostgreSQL 17** database (hosted on Coolify/Hetzner) using **Drizzle ORM** for better scalability and a real-time admin panel experience.

## Goal
Implement a robust database layer that allows the Astro engine to fetch site configurations based on the subdomain (hostname) and provides a way to seed existing JSON data into the database.

## Technical Requirements

### 1. Project Structure
- I am using a Monorepo. Please decide if it's better to place the DB logic in `packages/db` (for shared access) or directly in `apps/engine`. I prefer a reusable package if possible.
- Use `drizzle-orm` and `postgres` (postgres.js) as the driver.

### 2. Database Schema
Create a `sites` table with the following structure:
- `id`: Serial Primary Key.
- `subdomain`: Text, Unique, Indexed (this will be the lookup key).
- `businessName`: Text.
- `theme`: JSONB (to store colors, typography, and UI settings).
- `layout`: JSONB (to store navbar and footer configs).
- `navigation`: JSONB.
- `pages`: JSONB (to store all sections like hero, services, about, etc.).
- `updatedAt`: Timestamp with an auto-update trigger or helper.

### 3. Drizzle Configuration
- Provide `drizzle.config.ts`.
- Set up the database connection client using `DATABASE_URL` from environment variables.

### 4. Data Seeder Script
Create a TypeScript script that:
- Iterates through all `.json` files in the `../../data/business/json/` directory.
- Parses the files and maps them to the database schema.
- Performs an **upsert** operation: if the `subdomain` exists, update the record; otherwise, insert a new one.

### 5. Astro Integration (Middleware)
Implement `src/middleware.ts` in the `apps/engine` directory:
- Extract the subdomain from `context.url.hostname`.
- Fetch the corresponding site configuration from PostgreSQL using Drizzle.
- Inject the data into `context.locals.siteConfig` so it can be accessed globally by Astro components.
- Include basic error handling (e.g., redirect to a 404 or a landing page if the subdomain is not found).

## Coding Standards
- Use **Strict TypeScript**.
- Follow "Senior Level" patterns (clean code, separation of concerns).
- Use `jsonb` capabilities of PostgreSQL 17 to maintain the flexibility of the original JSON structure.