# bc-check — backward-compatibility checker

Detects visual regressions between the **prod** (`main` branch) and **dev** (`develop` branch)
deployments of every template site. Built because changing one template's components can
silently break other templates that share the same `packages/ui` sections.

## Usage

```bash
pnpm bc-check                      # check all templates
pnpm bc-check template-law         # check a single template
pnpm bc-check --threshold 0.95     # custom pass threshold (default 0.98)
```

## What it does

1. Discovers templates: every `templates/<name>/` dir containing `<name>.json`.
2. Loads `https://<name>.hazelgrouse.pl` (prod) and `https://<name>.dev.hazelgrouse.pl` (dev).
   Templates not deployed on one of the envs are **skipped** with a warning.
3. Collects subpages from the rendered navbar on both envs (a navbar difference is itself
   reported as `navDiff`).
4. On every page, screenshots each section (`div[data-section-index]` wrappers rendered by
   `SectionDispatcher.astro`) plus the navbar, on both envs.
5. Pixel-diffs each prod/dev section pair (offset-tolerant `pixelScore` from
   `@mshorizon/sitc-core`). Sections added/removed on dev are reported as a structural diff.
6. Prints per-template / per-page scores and names every section below 100%
   (e.g. `87.3%  hero-0`).

## Output

| Where | What |
| :--- | :--- |
| console | human-readable report with scores and failing section names |
| `features/bc-check/reports/latest.json` | machine-readable report (consumed by `/bc-fix`), gitignored |
| `features/bc-check/screenshots/<t>/<prod\|dev>/<page>/<type>-<index>.png` | section crops, gitignored |

## Exit codes

- `0` — every compared template scored ≥ threshold with no structural/nav/missing-page diffs
- `1` — at least one template failed (skipped templates only warn)
- `2` — usage error or crash

## Fixing failures

Run the Claude Code skill **`/bc-fix`** (optionally `/bc-fix template-law`). It reads
`reports/latest.json`, inspects the failing sections' prod/dev screenshots, traces the
regression to the responsible change via `git diff main...develop`, and applies a
backward-compatible fix. See `.claude/skills/bc-fix/SKILL.md`.

## Important caveats

- **Dev is expected to differ when develop is ahead of main.** A failure is not automatically
  a bug — it may be the intentional change you just made. The tool tells you *what* differs;
  you (or `/bc-fix`) decide whether it's intended.
- bc-check compares two **deployed** sites. Local edits change nothing until develop is
  redeployed (and prod reflects `main` only after a release).
- Read `CONTEXT.md` before changing this feature — it records non-obvious facts
  (dev URL scheme, fallback detection, why visual diff and not HTML diff).
