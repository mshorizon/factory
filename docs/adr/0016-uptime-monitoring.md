# ADR-0016: Uptime Monitoring & Deploy Health Checks

**Date:** 2026-04-26  
**Status:** Accepted

## Context

With the first paying client live, a silent outage before a support process is established would erode trust fatally. We need automated monitoring that:
1. Detects server/DB/R2 failures promptly
2. Verifies each Coolify deployment landed healthy
3. Notifies the studio owner immediately on failure

## Decision

### Architecture

Two new API endpoints, one updated alert function:

| Component | Path | Trigger |
|-----------|------|---------|
| Uptime cron | `GET /api/cron/uptime?secret=CRON_SECRET` | External cron every 5 min |
| Deploy webhook | `POST /api/webhooks/coolify?secret=CRON_SECRET` | Coolify deploy success event |
| Alert fanout | `lib/alerts.ts → processHealthAlert` | Called by both above |

### Uptime Cron (`/api/cron/uptime`)

- Called by **cron-job.org** (or similar) every 5 minutes
- Checks: DB connectivity, R2 config, HTTP reachability of each released site
- Stores result in `health_checks` table (visible in `/admin`)
- Triggers `processHealthAlert` for degraded/unhealthy results
- 30-minute cooldown prevents alert storms

### Deploy Webhook (`/api/webhooks/coolify`)

- Configured in **Coolify → Service → Settings → Deploy Webhook URL**
- Waits 5 seconds for new container to warm up
- Runs infrastructure checks on all released sites
- Updates `lastDeployedAt` for all released sites
- Always sends deploy status email to `STUDIO_ALERT_EMAIL`

### Alert Fanout Update

`processHealthAlert` now always sends to `STUDIO_ALERT_EMAIL` env var (studio owner), in addition to the per-site `monitoring.alertEmail` or `business.contact.email`.

## Environment Variables

| Var | Required | Description |
|-----|----------|-------------|
| `CRON_SECRET` | Yes | Shared secret for cron + webhook auth |
| `STUDIO_ALERT_EMAIL` | Yes | Studio owner email — receives all alerts |
| `SLACK_WEBHOOK_URL` | Optional | Slack channel for alerts |
| `ALERT_EMAIL_FROM` | Optional | From address (default: `noreply@contact.hazelgrouse.pl`) |

## Setup Instructions

### 1. Set env vars in `apps/engine/.env`
```
STUDIO_ALERT_EMAIL=sadlo.mateusz@gmail.com
```

### 2. Configure external cron (cron-job.org — free tier)

- URL: `https://specialist.hazelgrouse.pl/api/cron/uptime?secret=YOUR_CRON_SECRET`
- Method: GET
- Interval: Every 5 minutes
- Enable "Alert me on failure" in cron-job.org settings (catches total outages)

### 3. Configure Coolify deploy webhook

In Coolify dashboard → select the `factory-engine` service → Settings → Webhooks:
- Deploy webhook URL: `https://specialist.hazelgrouse.pl/api/webhooks/coolify?secret=YOUR_CRON_SECRET`
- Trigger: On successful deploy

## Consequences

- **+** Near-real-time outage detection (≤5 min)
- **+** Post-deploy verification catches broken deploys automatically
- **+** Health history visible in admin panel (`/admin`)
- **+** 30-min cooldown prevents email spam during extended outages
- **-** Cron-job.org is an external dependency (free tier)
- **-** HTTP self-checks from within the same container won't catch "server won't start" scenarios — cron-job.org's own failure notification covers that
