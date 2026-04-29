# ADR-0018: Templates Folder Naming Convention and Access Control

**Date:** 2026-04-27  
**Status:** Accepted

## Context

The `templates/` directory is the Git-based source of truth for business blueprints. Entries here are synced to PostgreSQL via `db:seed`, which iterates **every subdirectory** and upserts it as a live business site.

In April 2026, a real client site (`notariuszwgarwolinie`) was created as a subdirectory in `templates/`. Customizations were applied via one-off DB patch scripts (bypassing the template file). When `db:seed` ran again for any reason, it re-read the stale template file and overwrote all real data — resetting the live site to placeholder content.

Root causes:
1. A real business was placed in `templates/` instead of being DB-only.
2. Customizations were made directly to the DB without updating the template file.
3. `db:seed` has no awareness of "live" vs "template" entries — it overwrites everything.

## Decision

### Naming convention — `templates/` subdirectory access

**Rule 1: Only generic, reusable blueprint templates belong in `templates/`.** Folder names MUST follow the `template-<name>` prefix (e.g., `template-law`, `template-specialist`).

**Rule 2: Real client/business folders MUST NOT be added to `templates/`.** Client-specific data lives in the database only. The `clone-template` skill is the only authorized workflow for creating a new business — it writes directly to the DB, never to `templates/`.

**Rule 3: No subdirectory may be added to `templates/` without explicit user approval.** Before creating any folder under `templates/`, stop and ask. This applies to AI agents, scripts, and manual edits alike.

**Rule 4: Customizing a live business.** After a business is bootstrapped (via `clone-template` → DB insert), all further customization happens through:
- The admin panel (`/admin`)
- Targeted DB update scripts that also update the template file if the business is still template-backed

Never patch the DB directly without also updating the corresponding template file (or removing the folder from `templates/` first).

## Consequences

- `templates/` will only ever contain `template-*` prefixed folders.
- Real client data is exclusively DB-resident after initial seeding.
- `db:seed` is safe to run at any time — it only touches `template-*` blueprints.
- The `clone-template` skill handles new business onboarding end-to-end.
- Adding a new reusable template (e.g., `template-medical`) requires explicit approval and must follow the `template-<name>` prefix rule.

## Supersedes

None. Related: ADR-0005 (template-to-database sync workflow).
