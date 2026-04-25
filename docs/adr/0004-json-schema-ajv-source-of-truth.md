# ADR-0004: JSON Schema (Draft 7) + AJV as Single Source of Truth

**Status:** accepted  
**Date:** 2026-04-01

## Context
Business profiles are complex nested JSON objects (theme, pages, sections, services, etc.). Multiple consumers need to understand this shape: the rendering engine, the admin panel form (RJSF), runtime validation before DB writes, and TypeScript types throughout the codebase. A single definition needs to drive all of these.

## Decision
Use **JSON Schema Draft 7** (`packages/schema/src/business.schema.json`) as the single source of truth:

- **AJV** validates business profiles at runtime before saving to the database
- **`json-schema-to-typescript`** generates `packages/schema/src/generated.ts` from the schema (never edit manually)
- **RJSF** (`@rjsf/shadcn`) renders the admin form directly from the schema — no manual form definitions
- **Supplementary types** (variant unions, CartItem) live in `extras.ts` (hand-maintained, schema-additive)
- A Claude Code hook auto-regenerates types when the schema file is modified

## Consequences
**Positive:**
- One definition drives TypeScript types, form UI, and runtime validation simultaneously
- Adding a new field = edit schema → run `pnpm generate` → done; no parallel updates
- Admin form is always in sync with the data model (can't have form fields the schema doesn't know about)
- Runtime validation prevents invalid data from reaching the database

**Negative:**
- JSON Schema is verbose compared to Zod; deeply nested schemas are hard to read
- RJSF form customization requires custom widgets (ColorPicker, ImageUpload) for non-standard field types
- `json-schema-to-typescript` has edge cases with `oneOf`/`anyOf` — may generate wide union types

## Alternatives considered
- **Zod** — more ergonomic DX, native TypeScript types; but RJSF doesn't natively consume Zod schemas; would require a JSON Schema bridge (adds complexity); Zod schemas don't drive admin forms out of the box
- **Prisma schema as source of truth** — only describes the database, not the business profile shape; too low-level for the UI layer
- **Manual TypeScript interfaces** — no runtime validation, no RJSF integration, types drift from reality
