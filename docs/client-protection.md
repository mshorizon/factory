# Client Protection System

Protects live client sites from accidental breakage when developing new templates.

## How it works

### `.protected` marker file

Place a `.protected` file inside a template directory to signal that real clients are running on top of it:

```
templates/portfolio-law/.protected   ← template has live clients
templates/portfolio-tech/            ← no marker = safe to experiment
```

The file content is free-form — use it to list which clients use the template:

```
LIVE CLIENTS — this template is used by real client sites.
  - komornik.hazelgrouse.pl
```

### Guard script (`scripts/guard.ts`)

Runs automatically on every `git push` (via husky pre-push hook) and manually via:

```bash
pnpm guard
```

It:
1. Scans all `templates/*/` directories for `.protected` markers
2. Reads each protected template's JSON to collect which section types it uses
3. Diffs the current branch against `main` (committed + staged + unstaged changes)
4. Warns if any changed file is a component used by a protected template

**Example output:**
```
⚠️  PROTECTED CLIENT IMPACT DETECTED
══════════════════════════════════════════════════

  portfolio-law
  Section components:
    services         → apps/engine/src/components/sections/ServicesSection.astro

Run visual regression before pushing:
  cd packages/tests && pnpm test:visual -- --grep "client-regression"
```

### Accepting known impact

When you intentionally change a component and want to push anyway:

```bash
# Accept all protected clients
GUARD_ACCEPT=1 git push

# Accept a specific client only (guard still blocks others)
GUARD_ACCEPT=portfolio-law git push
GUARD_ACCEPT=portfolio-law,portfolio-art git push
```

### Visual regression tests

Each template with live clients should have a dedicated Playwright spec in `packages/tests/src/visual/`.

The spec tests every page of the template demo site against committed baseline screenshots. Any visual change (even 3% pixel diff) fails the test.

```bash
# Capture baselines for the first time (dev server must be running):
pnpm --filter @mshorizon/tests test:visual:update -- --grep "portfolio-law"

# Run regression check:
pnpm --filter @mshorizon/tests test:visual -- --grep "portfolio-law"
```

Baseline screenshots are committed to git. A failing test means a visual regression.

## When to add `.protected`

Add it the moment the first real client goes live on a template. See `docs/client-delivery.md` for the full delivery flow.
