# bc-check — context & hard-won facts

Read this before modifying `scripts/bc-check.mts` or the `/bc-fix` skill. Everything below
was verified empirically or traced in the codebase — do not "fix" these back.

## URL scheme (TASK.md correction)

- Prod: `https://<template>.hazelgrouse.pl` — Docker/Coolify, built from **`main`**.
- Dev: `https://<template>.dev.hazelgrouse.pl` — PM2 dev server on the VPS, serving **`develop`**.
- ⚠️ TASK.md originally guessed `https://<template>-dev.hazelgrouse.pl`. That domain resolves
  (wildcard) but falls through to the generic fallback page — it is **wrong**. Verified
  2026-07-02: `template-law.dev.hazelgrouse.pl` serves "Adwokat Harvey Specter",
  `template-law-dev.hazelgrouse.pl` serves "Hazelgrouse Studio" (fallback).

## Not-deployed / fallback detection

A subdomain with no matching business in the DB still returns HTTP 200 with the generic
landing page. Detection: `<title>` contains **"Hazelgrouse Studio"** (see
`getBusinessIdFromHost` in `apps/engine/src/lib/business.ts:40`). Non-2xx also counts as
not deployed.

## Why visual diff, not HTML diff

Prod is a production Astro build; dev is the Astro dev server. The same page is ~106KB HTML
on prod vs ~483KB on dev (unbundled scripts, dev toolbars) — raw HTML/DOM comparison is
hopeless. Rendered pixels are the only stable common ground.

## Section anchors

Every section is wrapped by `SectionDispatcher.astro` (line ~112) in:

```html
<div data-section-index={i} data-section-type={type} id="{type}-{i}">
```

bc-check screenshots each wrapper per env and pixel-diffs the pairs. The `sectionComponents`
map in the same file is the section-type → UI-component lookup used by `/bc-fix`.
The fixed navbar is captured as pseudo-section `navbar` (index −1) — it renders as
`<nav id="main-nav">`, NOT `<header>` (verified on the live sites). The footer is
captured as pseudo-section `footer` (index 999) — it is rendered by
`apps/engine/src/components/Footer.astro`, outside SectionDispatcher, and an early
version of bc-check missed a real footer regression because of that.

## Navbar scraping (vs template JSON)

Subpages are discovered by scraping `header a[href], nav a[href]` on the **live** pages,
not by reading `templates/<t>/<t>.json`, because:

1. Live sites render from the **database** — repo JSON can drift from what's deployed.
2. Scraping gets the auto-injected blog link and `navigation.links` for free (the JSON-side
   logic lives in `getNavLinks`, `apps/engine/src/lib/pages.ts:121` — we'd have to
   reimplement it).
3. Scraping both envs turns a navbar difference into a reportable `navDiff`.

## Pixel scoring

`pixelScore(aPath, bPath, { shift })` is reused from
`packages/sitc-core/src/scorer/pixel.ts` via a **relative source import**
(`../packages/sitc-core/src/scorer/pixel.js`) — the same convention as the `sitc-*` scripts.
It is offset-tolerant (searches ±shift px vertical alignment, reports `bestDy`), so small
padding shifts don't tank the score. No root dependencies were added; `pixelmatch`/`pngjs`
resolve from sitc-core's own deps.

## Noise control recipe

Freeze CSS (`animation/transition: none`), `reducedMotion: "reduce"` context,
`waitUntil: "networkidle"`, `document.fonts.ready`, full-page auto-scroll (triggers
lazy-load), scroll back to top, 500ms settle, viewport 1440×900 @ deviceScaleFactor 1.
Modeled on `packages/sitc-core/src/scorer/capture.ts` (not imported — it drags in
render/breakpoint machinery bc-check doesn't need).

⚠️ `networkidle` alone is not reliable: pages with maps/analytics keep the network busy
forever and the dev server compiles on first hit, so a strict `networkidle` goto falsely
reported `/contact` pages as `missing-on-dev`. `loadPage` therefore falls back to
`waitUntil: "load"` + a 3s settle when `networkidle` times out.

⚠️ tsx/esbuild gotcha: `page.evaluate` callbacks must not contain **named** inner
functions (`const f = () => …`) — esbuild's `keepNames` injects a `__name` helper that
doesn't exist in the browser context (`ReferenceError: __name is not defined`).

## Template discovery

A template = a `templates/<dir>/` containing `<dir>.json`. This includes the 7
`template-*` blueprints and automatically excludes business instances like
`notariuszdk/` (blogs only, no main JSON).

## Scoring model

- Section pair similarity ∈ [0,1] from `pixelScore` (1 = pixel-identical after alignment).
- Sections are matched by index when the `data-section-type` sequences are identical,
  otherwise LCS-aligned by type; unmatched sections count as similarity 0 and appear in
  `structuralDiff.added/removed`.
- Page score = Σ(similarities) / max(prod section count, dev section count).
- Template score = mean of page scores. Missing pages (`missing-on-dev`/`missing-on-prod`)
  score 0 — a vanished page IS a regression.
- `--threshold` (default 0.98) only affects pass/fail status + exit code; every section
  below 100% is always listed.

## Branch semantics

Prod = `main`, dev = `develop`. When develop is ahead, diffs can be **intentional** — the
score tells you *what* changed, not whether it was wanted. `/bc-fix`'s job is to separate
intended changes (for the template being worked on) from collateral damage (other
templates), and to guard shared-component changes behind variants/props that default to
the old rendering.

## Report

`features/bc-check/reports/latest.json` (gitignored) — schema documented by example in
README.md and by the `TemplateResult`/`PageResult`/`SectionResult` interfaces in
`scripts/bc-check.mts`. Screenshot paths in the report are repo-relative so `/bc-fix`
can Read the PNGs directly.
