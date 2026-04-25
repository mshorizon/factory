# ADR-0007: PostgreSQL + Drizzle ORM with JSONB for Business Profiles

**Status:** accepted  
**Date:** 2026-04-01

## Context
The data layer must store business profiles (complex, deeply nested JSON), relational data (blogs, orders, bookings), and support efficient multi-tenant queries. The schema for business profiles evolves frequently as new template features are added.

## Decision
Use **PostgreSQL** as the database with **Drizzle ORM** for type-safe queries, and store business profiles as **JSONB** in `sites.config`:

- Relational tables for structured data: `blogs`, `orders`, `bookings`, `users`, `push_subscriptions`, etc.
- JSONB for the business profile (`sites.config`) — avoids schema migrations when new UI sections or theme properties are added
- Drizzle ORM: schema defined in TypeScript (`packages/db/src/schema.ts`), migrations via `drizzle-kit push`
- All queries in `packages/db/src/queries.ts` — typed, no raw SQL strings
- Connection via `postgres` npm package (not Prisma client or pg)

## Consequences
**Positive:**
- JSONB means adding a new section type or theme property = edit JSON Schema + template file only; no DB migration
- Drizzle provides TypeScript type inference from schema definitions — query results are typed
- PostgreSQL JSONB supports GIN indexes and `@>` operators for future JSON querying
- Drizzle is lightweight vs Prisma (no Prisma engine binary, faster cold starts)

**Negative:**
- JSONB bypasses relational integrity for nested profile data — invalid shapes only caught at application level (AJV)
- `drizzle-kit push` for development is fast but not safe for production migrations without review
- Business profile querying (e.g., "find all businesses using hero variant X") requires `jsonb` operators — less ergonomic

## Alternatives considered
- **Prisma** — more popular, better DX for associations; but heavier (binary engine), slower cold starts in serverless/edge environments; Drizzle is better for standalone Node.js
- **Fully normalized relational schema** — would require a migration every time a new section type or theme property is added; impractical for a rapidly evolving factory
- **MongoDB** — native JSON, flexible schema; but loses ACID guarantees needed for orders/bookings/auth; SQL joins for relational data become aggregation pipelines
- **SQLite** — simple setup; but poor multi-tenant concurrent writes and no hosted-cloud managed option
