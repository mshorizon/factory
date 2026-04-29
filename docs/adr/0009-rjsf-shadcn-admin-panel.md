# ADR-0009: RJSF + shadcn/ui for Admin Panel, Isolated from Site Theme

**Status:** accepted  
**Date:** 2026-04-01

## Context
The admin panel (`/admin`) needs a form to edit business profiles — complex nested JSON with 50+ fields spanning theme, pages, sections, services, translations, etc. Manual form definitions would need to be kept in sync with the JSON Schema manually. Additionally, the admin UI must look visually distinct from the business sites it manages.

## Decision
Use **React JSON Schema Form (`@rjsf/shadcn`)** for form rendering, with **shadcn/ui** as the component library for the admin:

- RJSF auto-generates form fields from `packages/schema/src/business.schema.json` — no manual form definitions
- shadcn/ui (base-nova style) provides polished components: Tabs, Sidebar, Button, Dialog, etc.
- Admin styles live in `apps/engine/src/styles/admin-theme.css` — separate black/white HSL palette, does NOT use `packages/ui` design tokens
- Custom RJSF widgets: `ColorPickerWidget`, `ImageUrlWidget`, `SectionEditor` for non-standard fields
- Dark mode via `next-themes` + `AdminThemeProvider` — independent of the business site's theme
- Layout: shadcn `SidebarProvider` + collapsible sidebar + live preview iframe

## Consequences
**Positive:**
- Form stays in sync with schema automatically — adding a schema field = it appears in admin immediately
- shadcn/ui provides accessible, well-tested components without a custom design system effort
- Admin style isolation prevents site brand colors from bleeding into admin UI
- RJSF handles nested objects, arrays, enum dropdowns out of the box

**Negative:**
- RJSF generates deeply nested forms for complex schemas — usability requires custom `uiSchema` overrides and `SectionEditor` for page/section management
- shadcn/ui components must be manually added via CLI (`npx shadcn add`) — they live in `apps/engine/src/components/ui/`, not imported from a package
- Two component systems in one app (`packages/ui` for site, `shadcn/ui` for admin) — developers must know which to use where

## Alternatives considered
- **Hand-coded form** — full control over UX; but requires manual sync with schema on every schema change; not scalable
- **Formik + Yup** — good for static forms; but doesn't auto-generate from JSON Schema
- **Retool / internal tool platforms** — fast to set up but external dependency; can't be self-hosted easily; loses customization control
