# ADR-0019: No Template-Name Conditions in Shared Component Code

**Status:** Accepted  
**Date:** 2026-05-06

## Context

The rendering engine serves 100+ business sites from a single codebase. Components in `packages/ui` and `apps/engine` are shared across all templates. There is a temptation to special-case visual behavior with `if (templateName === "specialist") { ... }` style conditionals, but this approach creates invisible coupling between the rendering engine and individual template identities.

The trigger for this decision: the map panel overlay (`GoogleMap.tsx`) uses action buttons styled with `bg-primary-light`. For the `template-specialist` design, these buttons needed to use `bg-primary` instead. A naive fix would be a template-name check in the component.

## Decision

**Never add template-name or business-identity conditions in shared component code.**

Instead, expose the variation as a typed field in the business JSON schema with a safe default that preserves existing behavior. The template JSON sets the desired value explicitly; all other templates that do not set the field continue to receive the default.

### Pattern

1. Add an optional field to `packages/schema/src/business.schema.json` (section or top-level as appropriate) with a default-preserving enum value.
2. Run `pnpm generate` in `packages/schema` to regenerate `generated.ts`.
3. Read the field in the Astro section wrapper with a fallback (`?? "default-value"`).
4. Pass it as a prop to the UI component.
5. The UI component uses the prop to select the correct style — no identity checks.
6. Set the non-default value only in the template JSON(s) that need it.

### Example

Field `mapPanelButtonColor: "primary" | "primary-light"` (default `"primary-light"`) was added to the `section` definition. `template-specialist/template-specialist.json` sets `"mapPanelButtonColor": "primary"` in the `map-google` shared section. All other templates that omit the field continue rendering with `primary-light` buttons.

## Consequences

- **Positive:** Components stay template-agnostic. Adding a new template never requires touching existing component code.
- **Positive:** Business owners and admins can change these visual options at runtime via the admin panel (since values live in the JSON, not code).
- **Positive:** Variations are explicit, documented, and validated by the schema.
- **Negative:** Requires updating the schema and regenerating types for each new variation — a deliberate friction to prefer reusable defaults over one-off overrides.

## Alternatives considered

- **Template-name conditions in components** — rejected: tight coupling, invisible side effects, untestable at the component level.
- **Separate component variants per template** — rejected: duplication; templates should compose from a shared library, not fork it.

## Supersedes

None. Related: ADR-0004 (schema as source of truth), ADR-0006 (semantic design tokens).
