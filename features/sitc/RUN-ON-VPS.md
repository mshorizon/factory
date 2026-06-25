# SITC — How to run on the VPS

Quick, copy-paste runbook for running the Self-Improving Template Creator on the
Hetzner VPS (`46.224.191.237`). For the full reference (teardown, embeddings, the
gaps to close before trusting unattended auto-merge) see [DEPLOY.md](./DEPLOY.md).

> **Where to run what:** the *plan-only dry run* can run locally (it only reads the
> control DB + fetches the target + calls `claude` — no engine needed). **Real/live
> runs must run on the VPS**, because the runner, the engine, and the git worktrees
> must share one filesystem (the harness renders sections from a worktree file via an
> absolute `profilePath`). The VPS is also the intended single-lease owner (§13.1) and
> is always-on.
>
> **⚠️ The autonomous edit loop CANNOT run via a local Claude Code session.** The
> per-section worker spawns `claude -p … --permission-mode acceptEdits` to apply edits
> headlessly (the runner adds this automatically — `--allowedTools` alone makes a
> node-spawned claude silently no-op). A Claude Code session's auto-mode classifier
> **blocks** spawning claude with that permission mode, so the worker can't persist
> edits there. A plain shell / PM2 process on the VPS has no such classifier — that's
> the supported way to run the live loop. (Verified empirically: edits succeed in a
> plain process, are silently dropped when launched through a Claude Code sandbox.)

---

## 0. Get the code onto the VPS (do this first)

The Step 7/8 scripts may be committed locally but **unpushed** — the VPS won't have
`sitc-runner.mts` until you push + pull.

```bash
# local
git push origin develop
```
```bash
# on the VPS (SSH or VSCode tunnel into 46.224.191.237)
cd /path/to/factory          # wherever the repo lives on the box
git checkout develop && git pull
pnpm install
pnpm --filter @mshorizon/sitc-core build
```

## 1. Verify prerequisites on the VPS

```bash
pm2 status                       # astro-dev should be 'online' (port 4321)
claude --version                 # the worker uses `claude -p` — must be authenticated on THIS box
claude -p "say ok" --output-format json   # confirm claude is actually logged in on the VPS
node -e "require('axe-core')" && echo "axe ok"   # Step 5 dep present after pnpm install
```

- **`claude` auth on the VPS is the most likely gap.** The autonomous worker shells
  out to `claude -p` *on the VPS*, so claude must be logged in there — not just on your
  laptop.
- The engine via `astro dev` has `DEV=true`, so harness filesystem mode is on
  automatically. (Only a prod build needs `SITC_HARNESS_FS=1`.)

## 2. Create a run + provision its DB

```bash
# create the run row in /admin/template-creator, note the <id>, then:
pnpm sitc:run-db provision --run <id>          # dry-run, prints what it'd do
pnpm sitc:run-db provision --run <id> --yes    # real CREATE DATABASE
pnpm sitc:run-db seed --run <id> --template template-specialist --yes
```

## 3. Plan-only dry run first (safe — no edits)

```bash
DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db" \
SITC_ENGINE_URL="http://localhost:4321" \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```

Confirms target ingestion + band↔section alignment + the embedder preflight. Prints
the plan, exits, touches nothing.

## 4. Live run (the governance gate — watch it)

⚠️ This spawns headless `claude -p` with Edit/Write per section — an autonomous agent
loop. Run it deliberately and watch the logs. It stays on its own `sitc/run-<id>`
branch; delivery only merges to `develop` on a clean auto-merge decision (§13.4),
otherwise routes to `needs_review`.

```bash
SITC_ENABLE_WORKER=1 \
DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db" \
SITC_ENGINE_URL="http://localhost:4321" \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```

Or under PM2 (keeps it alive across disconnects — important on mobile / VSCode tunnel):

```bash
export DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db"
SITC_ENABLE_WORKER=1 pm2 start ecosystem.sitc.config.cjs --only sitc-orchestrator -- --run <id> --owner vps
pm2 logs sitc-orchestrator
```

## 5. GC daemon (set once)

```bash
export DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db"
pm2 start ecosystem.sitc.config.cjs --only sitc-gc     # orphan sweep every 15 min
```

---

### Shorthand

The convenience npm scripts (`pnpm sitc:runner`, `pnpm sitc:run-db`) already have
`DATABASE_URL` inlined, so on the VPS you can shorten steps 3–4 to e.g.:

```bash
SITC_ENABLE_WORKER=1 pnpm sitc:runner --run <id> --owner vps
```

### One caveat

The control DB is the **shared prod DB**. The single-owner lease keeps two runners off
the same run, but don't start a live run locally while the VPS orchestrator could also
pick up the same run — pick one owner.
