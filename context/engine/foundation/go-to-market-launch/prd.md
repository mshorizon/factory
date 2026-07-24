---
project: 'Go-To-Market Launch'
app: engine
version: 1
status: draft
created: 2026-07-22
context_type: brownfield
product_type: other # go-to-market / online-marketing strategy over the existing Hazelgrouse web platform (landing changes make it partly web-app)
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget: null # product-feature mode; no hard deadline; steady solo cadence (soft ~90-day rollout reference)
---

# PRD: Go-To-Market Launch

## Current System Overview

- **System purpose:** Hazelgrouse Studio is a JSON-driven "Site Factory" that generates unique,
  high-performance websites for local SMEs from structured config — one rendering engine serving many
  businesses.
- **Key architecture:** Turborepo + pnpm monorepo. An Astro hybrid renderer (`apps/engine`) serves each
  site by domain/subdomain, pulling business config + translations from PostgreSQL (Coolify VPS) via
  Drizzle. `packages/ui` (React + Tailwind, semantic-token themed), `packages/schema` (AJV source of
  truth), and `templates/` (git-based blueprint JSONs seeded into the DB).
- **Tech stack:** Astro, React, Tailwind (semantic tokens + `theme.json` injection), PostgreSQL +
  Drizzle, a shadcn/ui admin panel, PM2 (dev) / Docker + Coolify (prod), hosted on a Hetzner VPS.
- **Current user base:** effectively pre-launch — one operator, no paying clients yet, ~no organic
  traffic to the landing page, and no social presence.
- **Core functionality today:**
  - **6 live template demos** at `template-{law,restaurant,specialist,art,sacrum,tech}.hazelgrouse.pl`.
  - **Landing page** = the `template-portfolio` business rendered at `hazelgrouse.pl` (currently showcases
    only 3 of the 6 demos; contains a dead `href:"#"` and placeholder social links).
  - **Admin panel** (`/admin`) to edit every section, style, theme, and blog/CMS entry per business.
  - **Kaizen Growth** goal engine (`pnpm goal:next`, `/admin/goals`) — a repo-aware local next-step planner.
  - **OSM lead scraper** — voivodeship-scoped (PL-14 validated) — producing prospect lists.
  - **`STRATEGIA_INTERNET.md`** — a drafted RODO-safe inbound strategy (GBP, SEO, content, social).

  The factory can *produce* a tailored site (even for a specific scraped business) in minutes and expose
  it for editing. What it cannot do today is *attract demand*.

## Problem Statement & Motivation

The factory works; the market does not know it exists. A local business owner searching for a website —
or being pitched one — currently has no way to discover Hazelgrouse: no landing-page traffic, no social
proof, no clear sense of what is sold or why it beats a DIY builder or a local freelancer. Four gaps
compound: **no awareness → no traffic → nothing to convert → no trust → no positioning.**

Why now: the platform is built but pre-revenue, and the obvious growth shortcut — cold electronic
outreach to scraped businesses — is illegal under RODO (Prawo telekomunikacyjne art. 172; UŚUDE art. 10).
Demand must therefore be manufactured through legal channels only: inbound (search, social, content),
in-person, notice boards, and referrals.

The insight that makes this winnable: the factory can generate a real, feature-complete website for a
specific named business in minutes — from public data — and then hand the owner an admin panel to tune
every section, style, and CMS entry. That inverts the RODO constraint: you cannot *message* a scraped
tradesperson, but you *can* build them a working site and meet them in person (legal) with "this is your
site, already live." No agency ships bespoke that fast; no DIY builder shows up with the site pre-built
and industry-tuned. The go-to-market motion is therefore demo-led and locally focused, not broadcast
advertising.

## User & Persona

**Primary audience (the marketing target):** the owner of a small local **trade business** — an
electrician or plumber — in a single beachhead voivodeship (**mazowieckie / PL-14**). Typically runs the
business solo or with a few staff, wins work by word-of-mouth and phone, has either no website or a stale
one, is time-poor, is skeptical of "IT people," and trusts what they can see working and who they can meet
face-to-face. They reach for a solution when a competitor's site is taking their calls, or a customer asks
"do you have a website?"

**The operator (who executes the strategy):** a single part-time solo founder. This is delta-framing an
existing pre-launch system into its first market: every tactic must be executable by one person without a
team or a paid-ads budget. The audience is *new* — the system has no current users to preserve — so the
persona work is about who the launch must now reach, not whose experience changes.

**Beachhead rationale:** tradespeople are a large, underserved, weak-website population; the `specialist`
template already targets them; the scraper is validated for PL-14; and the segment is ideal for the
demo-led + in-person + referral motion the RODO constraint forces. Breadth (other niches, other regions)
is a deliberate later expansion, not part of this launch.

## Success Criteria

### Primary

- **First paying clients from the beachhead.** The launch has worked when it converts real tradesperson
  clients in the target voivodeship, laddering toward the Kaizen Growth north-star of **10 paying
  clients**. The funnel produces revenue, not just attention.

### Secondary

- Qualified **inbound inquiries** (landing form / in-person interest) arriving on a repeatable basis.
- **In-person demo hand-offs** happening regularly (a pre-built demo shown to a named prospect).
- **Presence live and coherent:** Google Business Profile published; active social profile(s) for the
  niche; landing page showcasing all 6 demos with working links; visibility for local keywords.

### Guardrails

- **RODO preserved:** zero unsolicited electronic outreach (SMS/email/calls) to scraped businesses.
  Demand comes only from inbound, in-person, notice boards, and referrals.
- **Solo-executable:** every tactic is runnable by one part-time person with no team and no assumed
  paid-ads budget; anything that is not must be explicitly optional.
- **Live factory must not regress:** portfolio/theme/CMS changes respect the template→DB→live flow and
  must not break the rendering engine, admin, or the existing demo sites.
- **Brand + honesty integrity:** one coherent Hazelgrouse identity across landing, demos, and social; no
  dead/placeholder links shipped publicly; no fabricated reviews, fake testimonials, or impersonation.

## User Stories

### US-01: Prospect becomes a paying client via an in-person demo (primary path)

- **Given** a targeted tradesperson in the beachhead voivodeship who has shown a warm signal (in-person
  interest or a referral) and has a weak or absent website
- **When** the operator quickly generates that business's site from public data and walks them through it
- **Then** the owner sees their own working site, discusses customization, and can become a paying client

#### Acceptance Criteria

- The demo is generated only after a warm signal — not pre-built cold under the business's brand.
- The generated demo lives on an unlisted / non-indexable URL until the owner consents to it being public.
- Customization (sections, styles, content) is possible via the admin panel during/after the meeting.
- No unsolicited electronic message is ever sent to the prospect — contact is in person only.

_Before this launch, there was no path from prospect to client at all — the system was pre-market._

### US-02: Inbound prospect discovers and inquires (secondary path)

- **Given** a local business owner searching online or browsing social for a website solution
- **When** they find Hazelgrouse via GBP / search / social and land on `hazelgrouse.pl`
- **Then** they see relevant demos + clear positioning and can submit an inquiry through the landing form

#### Acceptance Criteria

- The landing showcases all 6 demos with working links and states the offer clearly.
- The inquiry form captures a lead the operator can follow up on (the prospect initiated contact — legal).
- Social links in the footer resolve to real, active profiles.

_Before this launch, the landing had no traffic source, incomplete demo showcase, and placeholder links._

## Scope of Change

The primary deliverable is the strategy artifact; the remaining items are the prerequisites that make the
funnel function. Each item is categorized `new` / `modified` / `preserved`.

**Strategy (primary deliverable)**

- [modified] A documented, RODO-safe GTM strategy covering channels, the demo-led wedge, and the legal
  boundaries — extends `STRATEGIA_INTERNET.md`. (FR-001)
- [new] A measurement framework tied to the success criteria (which metrics, how tracked). (FR-002)
- [new] A repeatable weekly solo operating cadence — a concrete "do this each week" loop. (FR-003)
- [new] A repeatable content engine — what to post, on which channel, how often. (FR-004)

**Positioning & landing**

- [new] Clear positioning + offer on the landing, including transparent pricing ("from X zł" + packages). (FR-005)
- [modified] The portfolio showcases all 6 live demos, each linking to its live site (only 3 shown today). (FR-006)
- [modified] The landing has no dead or placeholder links; every CTA and link resolves (dead `href:"#"` present). (FR-007)

**Trust & presence**

- [new] Active, branded social profiles for the beachhead, rolled out in sequence: GBP + Facebook first,
  then Instagram/Reels, then TikTok once a content rhythm exists. (FR-008)
- [modified] The landing links to the real social profiles (not placeholders). (FR-009)
- [new] Discoverability via Google Business Profile + local SEO for the beachhead niche/region. (FR-010)
- [new] Genuine trust signals on the landing (real live demos, who's behind the studio) — no fabricated
  reviews or impersonation. (FR-011)

**Demo-led wedge (conversion)**

- [preserved] The operator can generate a per-prospect demo site in minutes from public business data,
  triggered by a warm signal rather than pre-built cold. (FR-012)
- [preserved] The operator can customize and hand off a demo in person via the admin panel. (FR-013)
- [new] Prospects can submit an inbound inquiry via a landing contact form (existence of a working form to
  be verified — see Open Questions). (FR-014)

**Paid experimentation**

- [new] One time-boxed paid-ads experiment on free promotional credits, with a defined stop date + success
  metric, continuing only if it clearly beats organic. (FR-015)

_Socrates challenges from shaping, preserved for downstream review:_

> FR-005 pricing — Counter-argument considered: "public prices anchor low / scare off / invite
> comparison-shopping." Resolution: kept with transparent "from X zł" + tiers; for a productized offer,
> transparency builds trust and filters tire-kickers.
> FR-008 channels — Counter-argument considered: "a solo operator across 4 feeds does all 4 badly and burns
> out." Resolution: staged rollout — GBP+FB at launch, IG then TikTok added as capacity allows.
> FR-012 demo timing — Counter-argument considered: "pre-building branded sites without consent raises
> RODO/brand questions and wastes effort." Resolution: demo generated only after a warm signal; no cold
> pre-building under a business's brand.
> FR-015 paid ads — Counter-argument considered: "paid ads contradict the inbound/in-person focus and eat
> time." Resolution: scoped to a single time-boxed experiment on free credits with an explicit stop
> condition — a learning bet, not an ongoing channel.

## Constraints & Compatibility

- **Template→DB→live flow preserved:** any portfolio/landing/theme edit follows edit-template-JSON →
  `db:seed` → restart; sites render from PostgreSQL, not the filesystem. Template edits are never live
  without seeding.
- **Live factory must not regress:** the Astro rendering engine, the `/admin` panel, and all 6 existing
  demo sites (`template-*.hazelgrouse.pl`) must keep working throughout.
- **Theming rules apply** to any UI/portfolio change: semantic tokens only, no hardcoded colors/spacing
  (per CLAUDE.md), driven by `theme.json`.
- **External platforms live outside the codebase:** Google Business Profile, the social accounts, and the
  ad-platform accounts are operator-managed and are not part of the app's data model or access model.
- **Solo-capacity is a hard constraint,** not a preference: the strategy's cadence must be sustainable by
  one part-time person; tactics that require a team or ongoing paid budget are out of scope or optional.
- **RODO is the governing legal constraint** for all outreach and data handling: no unsolicited electronic
  message may reach a scraped/leads-list business; scraped data is used only to build demos and plan legal
  (in-person / referral / notice-board) contact; a per-prospect demo built from public data is
  non-indexable until the named business consents to it being live under their brand.
- **Data migration:** none required — this launch is content/config + external accounts, not a schema
  change.

## Business Logic Changes

This launch **adds a new decision rule** (not an infrastructure-only change):

**The launch routes every growth action through a legality-and-capacity filter, always preferring the
highest-trust legal channel available (in-person demo > referral > inbound), and generates a per-prospect
demo only when a warm signal justifies it — never cold electronic outreach.**

Its inputs are the operator's current funnel state (who has shown interest, which channels are live,
remaining solo capacity) and the legal boundary (RODO). Its output is a prioritized next action: which
prospect to build a demo for, which channel to feed, which in-person visit or referral to pursue. The
operator encounters it as a clear "do the highest-leverage legal thing next" ordering rather than a
scattershot to-do list. This is the same rule the existing Kaizen Growth goal engine already enforces via
its off-limits list and single-next-step planner, so the strategy should express RODO + channel preference
as Kaizen off-limits / milestones rather than as a parallel system.

## Access Control Changes

No access-control changes — current model preserved.

- Public surfaces (landing `hazelgrouse.pl`, the 6 demo sites, per-prospect generated demos, external
  social profiles) remain unauthenticated by design; they are marketing artifacts meant to be seen.
- The admin panel (`/admin`) stays super-admin gated (existing `admin_token` cookie + role check).
  Per-prospect demo generation and CMS edits happen behind that gate; nothing about this launch opens a new
  public write path.
- Social-account and ad-platform credentials live outside the app and are operator-managed.

## Non-Goals

Functional non-goals (capabilities this launch will not build/do):

- **No expansion beyond the beachhead** — other niches (law, restaurant, art, sacrum, tech) and other
  voivodeships are a deliberate later phase.
- **No new template verticals built** — the 6 existing demos are the catalog; "complete templates" means
  polish + showcase the existing ones, not create new industries.
- **No custom CRM / marketing-automation build** — prospects are tracked via the existing Kaizen Growth
  goal engine + admin panel; no new tooling is built for this launch.
- **No multi-language marketing** — marketing + landing copy is Polish-only for now; the demos' de/en/uk
  translations are not a launch concern.

Non-functional non-goals (quality dimensions this launch will not aim for):

- **No ongoing paid-ads budget** — only the single time-boxed free-credit experiment (FR-015); no committed
  monthly spend.
- **No rebrand / new design system** — work within the current Hazelgrouse identity and theming.
- **No compliance beyond RODO baseline** — meet RODO; pursue no additional certifications or formal SLAs.

## Open Questions

1. **Does a working inbound contact/inquiry form already exist in the templates, or must one be added?** —
   Owner: operator/dev. Affects FR-014 (new vs modified).
2. **RODO + brand handling of warm-signal per-prospect demos** — what is the lawful basis and the consent
   flow for building an unlisted site under a named business's brand before they pay? — Owner: operator.
   Not a blocker for the strategy, but must be settled before the wedge runs at scale.
3. **Which ad platform currently offers free promotional credits, and what is the explicit stop-metric +
   time-box for the FR-015 experiment?** — Owner: operator.
4. **Exact pricing tiers / "from X zł" figures for FR-005** — Owner: operator; needed before the landing
   states prices publicly.
