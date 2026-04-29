# ADR-0015: Business Management Admin Panel

**Date:** 2026-04-25  
**Status:** Accepted

---

## Context

The factory grows from a single-business tool to a multi-tenant platform. We need super-admins to create, manage, and monitor multiple business sites from a central panel without SSH access or direct DB manipulation.

Previously, Administration > Businesses showed only the OverviewTab (health + analytics). There was no way to:
- Create a new business from the UI
- Change site status (draft / released / suspended)
- View per-business task history or uptime details
- Trigger Claude Code actions (regenerate, redeploy) from the UI
- Send template emails to business owners

---

## Decision

### 1. New `status` + `lastDeployedAt` columns on `sites`

The `sites` table gains two new columns applied via `drizzle-kit push`:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `status` | `text` | `"released"` | `"draft"` \| `"released"` \| `"suspended"` |
| `lastDeployedAt` | `timestamp` | `null` | Updated manually or by Claude tasks |

**"error" status is derived at runtime** from the latest `healthChecks` row — it is never stored. If the latest check is `"unhealthy"`, the API returns `status: "error"` and the UI shows a pulsing red dot. This avoids sync issues between health data and stored status.

### 2. Business list embedded in AdminForm (tab)

A new `businesses` tab is added to the Administration section of the AdminForm sidebar. The existing `overview` tab is renamed "Health Overview" — it remains unchanged. The businesses tab renders `BusinessesPanel`, which uses `UniversalList` (existing component).

This matches the established pattern: all super-admin features live inside AdminForm tabs, not standalone pages, except for the detail drill-down.

### 3. Detail page as a standalone Astro page

`/admin/businesses/[id]` is a separate Astro page (not an embedded tab) because:
- It has its own full-page layout with breadcrumb
- It hosts a React component with many sub-panels (tabs, action cards)
- Navigating away from AdminForm is acceptable at this level of detail (similar to `/admin/users`)

### 4. New business = task queue entry

When a super-admin submits the New Business form:
1. A minimal `sites` record is created with `status: "draft"`.
2. A task is created in the existing Claude Code task queue with a detailed prompt including all form fields, instructions to scrape the existing website (if provided), choose a template, generate `business.json`, and set status to `"released"` when done.

This reuses the existing task infrastructure (ADR-0008-like pattern) rather than introducing a separate creation pipeline.

### 5. Email via Resend

Admin-to-owner emails use the existing Resend integration. A new API endpoint `/api/admin/businesses/[id]/email` accepts pre-rendered HTML + subject, sends from `noreply@hazelgrouse.pl` to the business's contact email. The UI shows an editable preview modal before sending — the HTML is constructed client-side from a body textarea so admins can customize each email.

### 6. Danger zone: delete with R2 cleanup

Business deletion queries all `businessFiles` for the site, deletes each from R2 via `deleteFromR2(key)`, then deletes the DB record (cascade removes related rows). The UI requires typing the business name before confirming.

---

## Consequences

- **Super-admin can create businesses without CLI** — entire onboarding flow from UI to running Claude Code task.
- **Status field on `sites` is persisted** — all existing rows default to `"released"`, no data migration needed.
- **"error" is ephemeral** — health data drives it, avoiding stale error flags if the monitor fixes itself.
- **Owner view linked, not embedded** — linking to `https://{subdomain}.dev.hazelgrouse.pl/admin` rather than embedding an iframe avoids cross-origin session complexity.
- **Task queue is the single automation primitive** — regenerate and redeploy operations queue tasks rather than triggering direct server-side actions, keeping the system consistent with existing async patterns.
