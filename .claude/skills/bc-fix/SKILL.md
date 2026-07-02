---
name: bc-fix
description: Fix backward-compatibility regressions between prod and dev template sites detected by `pnpm bc-check`. Reads the bc-check JSON report, inspects failing section screenshots, traces each regression to the responsible change on develop, and applies a backward-compatible fix that preserves the old rendering by default.
---

## Purpose

`pnpm bc-check` compares every template's **prod** site (`main` branch,
`https://<t>.hazelgrouse.pl`) against its **dev** site (`develop` branch,
`https://<t>.dev.hazelgrouse.pl`) section by section and writes a report. This skill
consumes that report and fixes the regressions.

Core principle: **a shared-component change made for template A must not change how
templates B–G render.** The default posture is NOT to revert the change — it was
presumably intentional for some template — but to guard it behind a variant, prop, or
theme flag whose **default preserves the old rendering**, and opt the intended template
in via its JSON/config.

## Parameters

Parse from the user's invocation:
1. **template-name** (optional) — fix only this template, e.g. `template-law`
2. **--report <path>** (optional) — report file, default `features/bc-check/reports/latest.json`

Example invocations:
```
/bc-fix
/bc-fix template-law
/bc-fix template-sacrum --report features/bc-check/reports/latest.json
```

## Files to read before starting

- `features/bc-check/CONTEXT.md` — URL scheme, scoring model, non-obvious facts
- `features/bc-check/reports/latest.json` — the findings
- `apps/engine/src/components/SectionDispatcher.astro` — the `sectionComponents` map
  (section type → UI component) and the `data-section-*` wrapper markup

## STEP 1 — Get a fresh report

If the report is missing, or `generatedAt` predates the latest commits on `develop`, re-run:

```bash
pnpm bc-check              # or: pnpm bc-check <template-name>
```

Exit code 0 with no `fail` templates → nothing to fix, report that and stop.

## STEP 2 — Triage every failure visually

For each template with `"status": "fail"`, for each failing page, for each section with
`similarity < 1`:

1. **Read** the `prodShot` and `devShot` PNG paths from the report (repo-relative) —
   actually look at both images.
2. Describe the concrete visual difference: layout shift, color/token change, missing
   element, font change, image swap, section gone (`structuralDiff.removed`) or new
   (`structuralDiff.added`), navbar link changes (`navDiff`).
3. Classify: **intentional** (matches work recently done on develop for THIS template) vs
   **collateral** (this template wasn't being worked on — this is the regression to fix).
   Check recent commits if unsure. Intentional diffs: list them for the user, don't "fix".

## STEP 3 — Map each regression to code

- Section type (e.g. `hero`, `services`) → component via the `sectionComponents` map in
  `SectionDispatcher.astro` → source file in `packages/ui/src/`.
- `structuralDiff` (section added/removed) → compare `templates/<t>/<t>.json` with the
  DB config (websites render from the DB — see CONTEXT.md); the diff may be data, not code.
- `navbar` pseudo-section or `navDiff` → Navbar component + `getNavLinks`
  (`apps/engine/src/lib/pages.ts`).

## STEP 4 — Find the causing change

Prod serves `main`, dev serves `develop`, so the candidate change set is exactly:

```bash
git log --oneline main..develop -- packages/ui apps/engine templates/<template-name>
git diff main...develop -- <suspect-component-file>
```

Narrow to the commit(s) that touch the visually-different element.

## STEP 5 — Apply a backward-compatible fix

- Wrap the new behavior in a variant/prop/theme flag; the **default must reproduce the
  old (prod) rendering**. Follow repo rules: semantic tokens only, no hardcoded
  colors/spacing, schema-first (update `packages/schema` + `pnpm generate` if new props
  are added).
- Opt the template the change was made for back into the new behavior via its template
  JSON / DB config.
- If the regression is pure data drift (DB config changed unintentionally), fix the
  template JSON and re-seed (`cd packages/db && DATABASE_URL="..." pnpm run db:seed`).

## STEP 6 — Verify

1. Local: run the engine dev server, screenshot the affected section, compare against the
   `prodShot` from the report.
2. **Caveat (spell this out to the user):** bc-check compares two *deployed* sites — a
   local edit changes nothing until `develop` is redeployed to the dev server. After
   redeploy, re-run:

```bash
pnpm bc-check <template-name>
```

3. Done when the previously failing sections score ≥ threshold and no new structural
   diffs appeared. Summarize per section: cause commit, fix applied, before/after score.
