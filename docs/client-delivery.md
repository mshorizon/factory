# Client Delivery Flow

How to go from a finished template to a live client site.

## Overview

```
templates/portfolio-law/   ← template (git, demo site seeded from here)
        ↓
  DB: portfolio-law        ← demo site at portfolio-law.hazelgrouse.pl
        ↓  (copy + customise)
  DB: komornik             ← client site at komornik.hazelgrouse.pl
```

The client site is a separate DB row. The template JSON is the starting point,
not the live source. Once inserted, the client's data evolves independently via
the admin panel.

---

## Step 1 — Prepare the client config

Start from the template JSON and customise for the client. At minimum, update:

- `business.name`
- `business.contact` (address, phone, email, location)
- `business.assets` (favicon, logo — upload to R2 first)
- All translatable strings (in `translations/pl.json`, etc.)
- Theme colors if the client has a brand palette

You can do this directly in the admin panel after insertion (step 2), or prepare
a JSON file locally first.

---

## Step 2 — Insert the client into the database

There is no automated script yet — insert manually via the DB or a one-off tsx script.

**Option A — via Drizzle Studio (visual)**

```bash
pnpm --filter @mshorizon/db db:studio
# opens Drizzle Studio → Sites table → insert row
```

Fill in:
| column | value |
| --- | --- |
| `subdomain` | `komornik` (no domain, no protocol) |
| `business_name` | client's business name |
| `industry` | e.g. `legal` |
| `config` | paste the full customised JSON |
| `translations` | paste the translations object |

**Option B — one-off script**

```ts
// scripts/create-client.ts  (run once, then delete)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sites } from "../packages/db/src/schema.js";
import templateConfig from "../templates/portfolio-law/portfolio-law.json" assert { type: "json" };

const db = drizzle(postgres(process.env.DATABASE_URL!));

await db.insert(sites).values({
  subdomain: "komornik",
  businessName: "Komornik Sądowy Jan Kowalski",
  industry: "legal",
  config: templateConfig,   // customise before running
  translations: {},
});
```

```bash
DATABASE_URL="..." pnpm tsx scripts/create-client.ts
```

---

## Step 3 — Verify the site loads

The wildcard DNS `*.hazelgrouse.pl` and Traefik routing are already configured.
A new subdomain works immediately after DB insertion.

```
https://komornik.hazelgrouse.pl   ← should render the site
https://komornik.hazelgrouse.pl/admin  ← admin panel
```

If using the dev server locally:
```
http://komornik.localhost:4321
```

---

## Step 4 — Create an admin user for the client

```bash
DATABASE_URL="..." pnpm tsx packages/db/src/seed-admin.ts \
  klient@komornik.pl StrongPassword123
```

Then in Drizzle Studio (or via SQL), set `business_id` on that user row to the
`id` of the komornik site so the client only sees their own data in the panel.

---

## Step 5 — Mark the template as protected

Once the first real client is live on a template, add `.protected`:

```bash
cat > templates/portfolio-law/.protected << 'EOF'
LIVE CLIENTS — this template is used by real client sites.
  - komornik.hazelgrouse.pl
EOF

git add templates/portfolio-law/.protected
git commit -m "protect portfolio-law: komornik live"
```

From this point:
- `pnpm guard` (and `git push`) warns when portfolio-law components change
- See `docs/client-protection.md` for how the guard works and how to accept impact

---

## Adding more clients to the same template

Repeat steps 1–4 for each new client. Only step 5 changes: update the existing
`.protected` file to list the new client instead of creating a new one.

```bash
# append to existing .protected file
echo "  - another-client.hazelgrouse.pl" >> templates/portfolio-law/.protected
git add templates/portfolio-law/.protected
git commit -m "protect portfolio-law: another-client live"
```

---

## Updating a live client's config

Edits made via the admin panel are saved directly to the DB — no git involvement.

To push a structural change from the template to a client (e.g. adding a new section):
1. Update `templates/portfolio-law/portfolio-law.json`
2. Manually merge the change into the client's DB row via admin panel or Drizzle Studio
3. Do NOT run `db:seed` to propagate — it would overwrite the client's customisations

---

## Quick reference

| Action | Command |
| --- | --- |
| Open Drizzle Studio | `pnpm --filter @mshorizon/db db:studio` |
| Seed template demo sites | `pnpm db:sync` |
| Create admin user | `DATABASE_URL="..." pnpm tsx packages/db/src/seed-admin.ts <email> <pass>` |
| Check guard | `pnpm guard` |
| Push despite impact | `GUARD_ACCEPT=1 git push` |
