# ADR-0006: CSS Variables + Semantic Design Tokens for Theming

**Status:** accepted  
**Date:** 2026-04-01

## Context
Each business has its own brand colors, fonts, and spacing preferences defined in `theme.json`. UI components must render correctly for 100+ different themes without per-business CSS files or runtime style injection complexity. Tailwind's utility-first approach conflicts with dynamic theming if raw color values (e.g., `bg-blue-500`) are hardcoded.

## Decision
Inject CSS custom properties (variables) at the layout level from the business's theme config, and map Tailwind utilities to those variables:

- `BaseLayout.astro` computes CSS variables from `theme.json` and injects them in a `<style>` block
- `packages/config/tailwind.config.js` extends Tailwind's theme with variable-backed utilities: `bg-primary` → `var(--primary)`, `py-spacing-section` → `var(--spacing-section)`, etc.
- Semantic token naming: `primary`, `secondary`, `background`, `foreground`, `muted`, `accent`, `radius`
- Spacing tokens: `spacing-xs` through `spacing-section` (12 levels)
- Dark/light mode: `theme.mode` triggers a CSS class on `<html>` that swaps variable values

**Strictly enforced:** No hardcoded Tailwind color or spacing utilities in `packages/ui`. Always use semantic tokens.

## Consequences
**Positive:**
- Theme switching = changing CSS variable values; zero component changes
- Tailwind's purging works normally (class names are static, only values change)
- Admin color picker changes reflect instantly via CSS variable swap
- One component codebase serves any business color scheme

**Negative:**
- Developers must memorize semantic token names, not Tailwind defaults
- New spacing needs require adding both a CSS variable and a Tailwind config entry
- Debugging requires inspecting computed variables in DevTools, not class names

## Alternatives considered
- **Tailwind CSS Themes plugin** — not available in Tailwind v3/v4 at the time; custom solution was needed
- **CSS Modules per business** — generates N stylesheets; hard to cache and maintain
- **Styled-components/Emotion** — runtime CSS-in-JS adds JavaScript overhead; incompatible with Astro's zero-JS-by-default philosophy
- **Hardcoded Tailwind classes** — simple but impossible to theme dynamically; every color change would require code changes
