# ADR-0013: Major Theme + Section Variant Layered Resolution System

**Status:** accepted  
**Date:** 2026-04-23

## Context
The factory needs to support visually distinct template styles (specialist, law, tech, art) while using the same underlying section components. Different templates should default to different component variants (e.g., the tech template uses a dark split hero, the specialist template uses a classic hero) without requiring explicit variant overrides in every business JSON.

## Decision
Implement a **three-tier variant resolution** in `apps/engine/src/lib/pages.ts`:

1. **Explicit override**: `section.variant` in the page JSON — highest priority
2. **Major theme default**: `MAJOR_THEME_DEFAULTS[majorTheme][sectionType]` in `packages/ui/src/themes/majorThemes.ts`
3. **Global default**: `DEFAULT_VARIANTS[sectionType]` in `pages.ts`
4. **Fallback**: the string `"default"`

`majorTheme` is set in `business.theme.majorTheme` (values: `template-specialist`, `template-law`, `template-tech`, `template-art`). Renamed to `template-*` prefix in April 2026 to avoid namespace collisions.

Section variants are resolved in `SectionDispatcher.astro`, which maps `(sectionType, variant)` → React/Astro component.

## Consequences
**Positive:**
- New template = define `MAJOR_THEME_DEFAULTS` entry; existing sections adopt appropriate variants automatically
- Business JSON stays lean — no need to repeat variant on every section
- Per-section override still possible when a business needs a non-default look
- Theme switching in admin instantly changes visual style across all pages

**Negative:**
- Multi-level lookup requires tracing through 3 files to understand what variant will render
- Adding a new section type requires updating `DEFAULT_VARIANTS`, `MAJOR_THEME_DEFAULTS`, and `SectionDispatcher` map
- `majorTheme` values are stringly typed — a typo silently falls through to global defaults

## Alternatives considered
- **Explicit variant on every section** — no implicit magic; but every template JSON becomes verbose and brittle (changing a global default requires updating every JSON)
- **Single variant per section globally** — simpler; but can't have the tech template render differently from the specialist template for the same section type
- **CSS-only theming** — variants controlled purely by CSS classes; but structural differences (split layout vs centered) require different HTML, not just CSS
