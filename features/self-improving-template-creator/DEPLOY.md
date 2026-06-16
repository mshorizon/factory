# SITC — Deploy & Operate (Step 7 scaffolding)

How to run the Self-Improving Template Creator on the VPS. This is **operator-driven
scaffolding**: a live run spawns an autonomous `claude -p` Edit/Write loop and (for
the run DB) real `CREATE/DROP DATABASE`, so every such action is gated behind an
explicit flag. Nothing here runs automatically.

## Components
| Piece | What | Where |
| :-- | :-- | :-- |
| `scripts/sitc-runner.mts` | Per-run consumer: target ingestion → lockTiers → sweep → gates → delivery (`runFull`). | VPS |
| `scripts/sitc-run-db.mts` | Run-scoped DB lifecycle: `provision` / `seed` / `teardown` / `gc`. | VPS |
| `ecosystem.sitc.config.cjs` | PM2: `sitc-gc` (safe cron daemon) + `sitc-orchestrator` (disabled by default). | VPS |
| `apps/engine` (dev, port 4321) | Renders sections from worktree working files (harness fs mode). | VPS (PM2 `astro-dev`) |

## Prerequisites
- `DATABASE_URL` / `ADMIN_DATABASE_URL` → the Postgres control DB (the `sitc_*` tables are already pushed).
- The engine running with harness filesystem mode: it's auto-on in `astro dev`; for a prod build set `SITC_HARNESS_FS=1`.
- `claude` CLI authenticated on the host (the worker uses `claude -p`, **not** the API).
- A target URL and a starting template under `templates/<name>/`.

## 1. Create a run (admin UI or DB)
Use `/admin/template-creator`, or insert a `sitc_runs` row (`templateName`, `targetUrl`, `budgetIterations`).
Note the run id.

## 2. Provision + seed the run DB (real prod DDL — gated)
```bash
# dry-run first (prints what it would do, touches nothing)
pnpm sitc:run-db provision --run <id>
pnpm sitc:run-db provision --run <id> --yes          # executes CREATE DATABASE
pnpm sitc:run-db seed --run <id> --template <name> --yes
```
Seeding validates the profile against the schema before writing.

## 3. Plan-only dry run (safe — no edits)
```bash
DATABASE_URL=… SITC_ENGINE_URL=http://localhost:4321 \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```
Captures + segments the target, builds the band↔section alignment, and prints the
PLAN (which sections it would evolve toward which target crop). **No worktree edits,
no model authoring, no merge.** Use this to sanity-check ingestion + alignment.

## 4. Live autonomous run (governance gate)
⚠️ This spawns headless `claude -p` with Edit/Write per section — an autonomous agent
loop. Run it deliberately, watch the logs, and keep the run on its own `sitc/run-<id>`
branch (the runner creates it; delivery only merges to `develop` on a clean auto-merge
decision per §13.4).
```bash
SITC_ENABLE_WORKER=1 DATABASE_URL=… SITC_ENGINE_URL=http://localhost:4321 \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```
Pause/abort from the admin UI (commands are polled between sweep rounds); the single-
owner lease prevents a second runner from racing the same run.

## 5. PM2
```bash
export DATABASE_URL=…                       # so the config picks it up
pm2 start ecosystem.sitc.config.cjs --only sitc-gc           # safe: orphan GC every 15 min
# orchestrator is disabled by default; start a specific run explicitly:
SITC_ENABLE_WORKER=1 pm2 start ecosystem.sitc.config.cjs --only sitc-orchestrator -- --run <id> --owner vps
pm2 logs sitc-orchestrator
```

## 6. Teardown
```bash
pnpm sitc:run-db teardown --run <id> --drop-db --delete-branch --yes
```
GC also reclaims runs whose lease expired without cleanup (the `sitc-gc` daemon).

## Known gaps to close before trusting unattended auto-merge
1. **Regression SSIM is a stub** in `sitc-runner.mts` (`ssimPairs: () => []` → SSIM=1). Wire it to render every
   existing template on `sitc/run-<id>` vs the `develop` baseline and diff (the `existingTemplatesMinSsim` contract).
   Until then the backward-compat gate only enforces build + validate, not visual regression of other templates.
2. **Acceptance gate points at `astro dev`** — dev numbers are inflated (unbundled). Point `SITC_ENGINE_URL` at a
   **prod-built** preview so perf/transfer budgets are meaningful (Step 5 finding).
3. **Durable calibration artifacts** — persist subtle triples + judge verdicts to `sitc_judge_calibration` with
   image paths backed by R2 (Step 6 left this for here, since it needs artifact storage).
4. **First live run is unverified end-to-end** — the wiring type-checks and each collaborator is independently
   verified, but the full `runFull` path against a real target has not been executed (it requires the autonomous
   worker). Treat the first live run as a supervised bring-up.
