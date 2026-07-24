---
project: 'Go-To-Market Launch'
app: engine
context_type: brownfield
delivery_mode: product-feature
created: 2026-07-22
updated: 2026-07-22
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: core gap
      decision: all four — awareness, presentability/conversion, trust signals, positioning
    - topic: primary audience
      decision: tradespeople (electrician/plumber), one voivodeship beachhead (mazowieckie/PL-14)
    - topic: insight/edge
      decision: minutes-to-generate a per-business demo from scraped data + full admin/CMS control; demo-led + in-person motion inverts RODO
    - topic: must-preserve
      decision: RODO no-cold-outreach; solo-capacity realism; don't destabilize live factory; brand consistency
    - topic: primary success metric
      decision: first paying clients from beachhead (ladders to north-star 10)
    - topic: timing
      decision: no hard deadline; steady solo cadence (soft ~90-day rollout reference)
    - topic: conversion emphasis
      decision: both in-person + inbound, weighted to in-person demo hand-off
    - topic: social channels
      decision: GBP+FB first, then IG, then TikTok (staged); + one time-boxed paid-ads trial on free credits
    - topic: demo-led wedge timing
      decision: generate per-prospect demo only after a warm signal; unlisted/noindex until consent
    - topic: pricing
      decision: transparent "from X zł" + packages on landing
  frs_drafted: 15
  quality_check_status: accepted
---

# Shape Notes: Go-To-Market Launch

> Scope shape: **strategy-first**. The primary deliverable is a documented, RODO-safe
> online marketing / go-to-market strategy that drives real traffic to the landing page
> (hazelgrouse.pl). The concrete "make the factory publicly presentable" build items
> (finish templates, showcase them in the portfolio, add social links, create social
> profiles) are captured as **prerequisites / dependencies** the strategy relies on,
> not as the main body of work.

## Current System

- **System purpose:** A JSON-driven "Site Factory" that generates unique, high-performance
  websites for local SMEs from structured config — one rendering engine, many businesses.
- **Key architecture:** Turborepo + pnpm monorepo. Astro hybrid renderer (`apps/engine`)
  serves sites by domain/subdomain, pulling business config + translations from **PostgreSQL**
  (Coolify VPS) via Drizzle. `packages/ui` (React + Tailwind, semantic-token themed),
  `packages/schema` (AJV source of truth), `templates/` (git-based blueprint JSONs seeded to DB).
- **Tech stack:** Astro, React, Tailwind (semantic tokens + theme.json injection), PostgreSQL +
  Drizzle, shadcn/ui admin panel, PM2 (dev) / Docker+Coolify (prod), hosted on Hetzner VPS.
- **Current assets:**
  - **6 template demos** live at `template-{law,restaurant,specialist,art,sacrum,tech}.hazelgrouse.pl`.
  - **Landing page** = `template-portfolio` business → `hazelgrouse.pl` (currently showcases only
    3 of the 6 demos; has a dead `href:"#"` and placeholder social links).
  - **Admin panel** (`/admin`): edit every section, styles, theme, blog/CMS, per business.
  - **Kaizen Growth** goal engine (`pnpm goal:next`) — repo-aware local planner for next steps.
  - **OSM lead scraper** — voivodeship-scoped (PL-14 validated); produces demo/planning lead lists.
  - **`STRATEGIA_INTERNET.md`** — a drafted RODO-safe inbound strategy (GBP, SEO, content, social).
- **Current user base:** effectively pre-launch. One operator; no paying clients yet; landing page
  receives ~no organic traffic; no social presence.
- **Core functionality today:** the factory can *produce* a tailored site (even for a specific
  scraped business) in minutes and expose it for editing. What it cannot do is *attract demand*.

## Vision & Problem Statement

The factory works; the market doesn't know it exists. Today a local business owner searching for a
website — or being pitched one — has no way to discover Hazelgrouse, no landing page traffic, no
social proof, and no clear sense of what is sold or why it beats a DIY builder or a local freelancer.
The four gaps compound: **no awareness → no traffic → nothing to convert → no trust → no positioning.**
Cold electronic outreach (the obvious shortcut) is illegal under RODO, so demand must be manufactured
through legal channels only: inbound (search, social, content), in-person, notice boards, and referrals.

The insight that makes this winnable: the factory can **generate a real, feature-complete website for a
specific named business in minutes** — from scraped public data — and then hand the owner an admin panel
to tune every section, style, and CMS entry. That inverts the RODO constraint. You can't *message* a
scraped tradesperson, but you *can* build them a working demo and show up in person (legal) with "this is
your site, already live." No agency ships bespoke that fast; no DIY builder shows up with the site
pre-built and industry-tuned. The go-to-market motion is therefore **demo-led and locally focused**, not
broadcast advertising.

## User & Persona

**Primary audience (the marketing target):** the owner of a small local **trade business** — an
electrician or plumber — in a single voivodeship (beachhead: **mazowieckie / PL-14**). Typically runs
the business solo or with a few staff, wins work today by word-of-mouth and phone, has either no website
or a stale/ineffective one, is time-poor, is skeptical of "IT people," and trusts what they can see
working and who they can meet face-to-face. They reach for a solution when a competitor's site is taking
their calls, or a customer asks "do you have a website?"

**The operator (who executes the strategy):** a single part-time solo founder. Every tactic in the
strategy must be executable by one person without a team or a paid-ads budget.

**Beachhead rationale:** tradespeople are a large, underserved, weak-website population; the `specialist`
template already targets them; the scraper is validated for PL-14; and the segment is ideal for the
demo-led + in-person + referral motion the RODO constraint forces. Breadth (other niches, other regions)
is a deliberate *later* expansion, not part of the first launch.

## Access Control

**No access-control changes — current model preserved.** This is a strategy-first, brownfield launch;
it does not alter authentication or roles.

- **Public surfaces** (landing `hazelgrouse.pl`, the 6 demo sites, per-prospect generated demos, and
  external social profiles) are unauthenticated by design — they are marketing artifacts meant to be
  seen by anyone.
- **Admin panel** (`/admin`) stays **super-admin gated** (existing `admin_token` cookie + role check).
  Per-prospect demo generation and CMS edits happen behind that gate; nothing about the GTM work opens a
  new public write path.
- Social-media *account* credentials (new profiles created as a prerequisite) live outside the app and
  are managed by the operator — not part of the codebase's access model.

## End-to-end flow

The launch is a demo-led, locally-focused funnel, weighted toward in-person conversion with an inbound
net behind it:

1. **Attract (legal channels only):** Google Business Profile + local SEO for the beachhead niche/region;
   niche social content (before/after builds, "does your competitor have a site?"); notice boards
   (tablice ogłoszeń); referrals and warm intros. Every channel points at `hazelgrouse.pl`.
2. **Land:** the prospect reaches a polished portfolio landing that showcases **all 6 demos** (esp. the
   tradesperson `specialist` build), states the offer/positioning plainly, carries trust signals, and
   has working social links — no dead or placeholder links.
3. **Hook (the wedge):** for a targeted prospect, the operator generates *their* site in minutes from
   public/scraped data and presents it **in person** (or via a left card / notice) — "this is your site,
   already live." The admin panel makes on-the-spot customization possible.
4. **Convert:** prospect expresses interest (in person, primary) or submits the landing inquiry form
   (inbound, secondary) → operator customizes via admin → **paying client**.

## Success Criteria

### Primary

- **First paying clients from the beachhead.** The launch has worked when it converts real
  tradesperson clients in the target voivodeship — laddering toward the Kaizen Growth north-star of
  **10 paying clients**. (First few closed = validated; the funnel produces revenue, not just attention.)

### Secondary

- Leading demand indicators moving: qualified **inbound inquiries** (landing form / in-person interest)
  arriving on a repeatable basis.
- **In-person demo hand-offs** happening regularly (pre-built demo shown to a named prospect).
- **Presence live and coherent:** Google Business Profile published; active social profile(s) for the
  niche; landing page showcasing all 6 demos with working links; ranking/visibility for local keywords.

### Guardrails

- **RODO preserved:** zero unsolicited electronic outreach (SMS/email/calls) to scraped businesses.
  Demand comes only from inbound, in-person, notice boards, and referrals.
- **Solo-executable:** every tactic is runnable by one part-time person with no team and no assumed
  paid-ads budget; anything that isn't must be explicitly optional.
- **Live factory not destabilized:** portfolio/theme/CMS changes respect the template→DB→live flow and
  must not break the rendering engine, admin, or existing demo sites.
- **Brand + honesty integrity:** one coherent Hazelgrouse identity across landing, demos, and social;
  no dead/placeholder links shipped publicly; **no fabricated reviews, fake testimonials, or
  impersonation** — trust signals must be genuine.

## Functional Requirements

Actor is the **Operator** unless the requirement is experienced by the **Prospect**. Change tag:
`new` | `modified` | `preserved`. All are must-have for the first launch (the set is deliberately lean —
most non-strategy items are prerequisites that gate the funnel).

### Strategy (primary deliverable)

- FR-001: Operator has a documented, RODO-safe GTM strategy covering channels, the demo-led wedge, and the legal boundaries. Priority: must-have. Change: modified (extends `STRATEGIA_INTERNET.md`)
- FR-002: Strategy defines a measurement framework tied to the success criteria (which metrics, how tracked). Priority: must-have. Change: new
- FR-003: Strategy prescribes a repeatable weekly solo operating cadence (a concrete "do this each week" loop). Priority: must-have. Change: new
- FR-004: Strategy defines a repeatable content engine (what to post, on which channel, how often). Priority: must-have. Change: new

### Positioning & landing

- FR-005: Prospect sees a clear positioning + offer on the landing, including transparent pricing ("from X zł" + packages). Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "public prices anchor low / scare off / invite comparison-shopping." Resolution: kept with transparent "from X zł" + tiers — for a productized site-factory offer, transparency builds trust and filters tire-kickers.
- FR-006: Prospect can view all 6 live demos in the portfolio, each linking to its live site. Priority: must-have. Change: modified (only 3 shown today)
- FR-007: Landing has no dead or placeholder links; every CTA and link resolves. Priority: must-have. Change: modified (dead `href:"#"` present)

### Trust & presence

- FR-008: Operator has active, branded social profiles for the beachhead, rolled out in sequence: **GBP + Facebook first**, then Instagram/Reels, then TikTok once a content rhythm exists. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "a solo operator across 4 feeds does all 4 badly and burns out." Resolution: staged rollout — GBP+FB at launch, IG then TikTok added as capacity allows; "all four" is the target, not a day-one requirement.
- FR-009: Landing links to the real social profiles (not placeholders). Priority: must-have. Change: modified
- FR-010: Business is discoverable via Google Business Profile + local SEO for the beachhead niche/region. Priority: must-have. Change: new
- FR-011: Prospect sees genuine trust signals (real live demos, who's behind the studio) — no fabricated reviews or impersonation. Priority: must-have. Change: new

### Demo-led wedge (conversion)

- FR-012: Operator can generate a per-prospect demo site in minutes from public business data, **triggered by a warm signal** (in-person interest or referral) rather than pre-built cold. Priority: must-have. Change: preserved
  > Socrates: Counter-argument considered: "pre-building branded sites for businesses without consent raises RODO/brand questions and wastes effort on prospects who say no." Resolution: demo is generated only after a warm signal — no cold pre-building under a business's brand. (RODO/brand handling of even warm-signal demos → Open Questions.)
- FR-013: Operator can customize and hand off a demo in person via the admin panel. Priority: must-have. Change: preserved
- FR-014: Prospect can submit an inbound inquiry via a landing contact form. Priority: must-have. Change: new-or-modified (working form to be verified — see Open Questions)

### Paid experimentation

- FR-015: Operator can run **one time-boxed** paid-ads experiment using free promotional credits (Google/Meta vouchers), with a defined stop date + success metric, continuing only if it clearly beats organic. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "paid ads contradict the inbound/in-person focus, need a card, and eat time." Resolution: scoped to a single time-boxed experiment on free credits with an explicit stop condition — a cheap learning bet, not an ongoing channel.

> Socrates note: FR-001–004, FR-006, FR-007, FR-009–011, FR-013, FR-014 are non-controversial
> prerequisites / the primary deliverable; no counter-argument materially changes them — they stand
> as written.

## User Stories

### US-01: Prospect becomes a paying client via an in-person demo (primary path)

- **Given** a targeted tradesperson in the beachhead voivodeship who has shown a warm signal (in-person interest or a referral) and has a weak or absent website
- **When** the operator quickly generates that business's site from public data and walks them through it
- **Then** the owner sees their own working site, discusses customization, and can become a paying client

#### Acceptance Criteria

- The demo is generated only after a warm signal — not pre-built cold under the business's brand.
- The generated demo lives on an unlisted/noindex URL until the owner consents to it being public.
- Customization (sections, styles, content) is possible via the admin panel during/after the meeting.
- No unsolicited electronic message is ever sent to the prospect — contact is in person only.

### US-02: Inbound prospect discovers and inquires (secondary path)

- **Given** a local business owner searching online or browsing social for a website solution
- **When** they find Hazelgrouse via GBP/search/social and land on `hazelgrouse.pl`
- **Then** they see relevant demos + clear positioning and can submit an inquiry through the landing form

#### Acceptance Criteria

- The landing showcases all 6 demos with working links and states the offer clearly.
- The inquiry form captures a lead the operator can follow up on (the prospect initiated contact — legal).
- Social links in the footer resolve to real, active profiles.

## Business Logic

**The launch routes every growth action through a legality-and-capacity filter, always preferring the
highest-trust legal channel available (in-person demo > referral > inbound), and generates a per-prospect
demo only when a warm signal justifies it — never cold electronic outreach.**

This is a *new decision rule* the GTM launch adds (not an infrastructure-only change). Its inputs are the
operator's current funnel state (who has shown interest, which channels are live, remaining solo capacity)
and the legal boundary (RODO). Its output is a prioritized next action: which prospect to build a demo
for, which channel to feed, which in-person visit or referral to pursue. The operator encounters it as a
clear "do the highest-leverage legal thing next" ordering rather than a scattershot to-do list — and it is
the same logic the existing **Kaizen Growth** goal engine already enforces via its off-limits list and
single-next-step planner, so the strategy should express RODO + channel preference as Kaizen off-limits /
milestones rather than as a parallel system.

## Non-Functional Requirements

- No unsolicited electronic message (SMS, email, call) ever reaches a scraped/leads-list business — a
  binary legal guarantee (RODO: Prawo telekomunikacyjne art. 172; UŚUDE art. 10).
- Personal/business data obtained by scraping is used only to build demos and plan legal (in-person /
  referral / notice-board) contact — never as a contact list for electronic outreach.
- A per-prospect demo generated from public data is not publicly indexable (noindex / unlisted) until the
  named business consents to it being live under their brand.
- The public landing page loads fast enough to support conversion and local SEO — user-perceived load
  under ~2.5 s on a mid-range mobile connection.
- Every public-facing surface (landing, demos, social profiles) presents one coherent Hazelgrouse brand
  and contains no dead or placeholder links.
- All public copy for the beachhead is in Polish and appropriate to a local tradesperson audience.

## Constraints & Preserved Behavior

- **Template→DB→live flow preserved:** any portfolio/landing/theme edit follows edit-template-JSON →
  `db:seed` → restart; sites render from PostgreSQL, not the filesystem. Never assume template edits are
  live without seeding.
- **Live factory must not regress:** the Astro rendering engine, the `/admin` panel, and all 6 existing
  demo sites (`template-*.hazelgrouse.pl`) must keep working throughout.
- **Theming rules apply** to any UI/portfolio changes: semantic tokens only, no hardcoded colors/spacing
  (per CLAUDE.md), driven by `theme.json`.
- **External platforms live outside the repo:** Google Business Profile, Facebook/Instagram/TikTok
  accounts, and ad-platform accounts are operator-managed and not part of the codebase or its data model.
- **Solo-capacity is a hard constraint,** not a preference: the strategy's cadence must be sustainable by
  one part-time person; tactics that require a team or ongoing paid budget are out of scope or optional.
- **RODO is the governing legal constraint** for all outreach and data handling in this project.

## Non-Goals

Functional non-goals (capabilities this launch will not build/do):

- **No expansion beyond the beachhead** — other niches (law, restaurant, art, sacrum, tech) and other
  voivodeships are a deliberate later phase, not this launch. *(Follows from the beachhead decision.)*
- **No new template verticals built** — the 6 existing demos are the catalog; "complete templates" means
  polish + showcase the existing ones, not create new industries. *(Confirmed with operator.)*
- **No custom CRM / marketing-automation build** — prospects are tracked via the existing Kaizen Growth
  goal engine + admin panel; no new tooling is built for this launch. *(Follows from the edge decision.)*
- **No multi-language marketing** — marketing + landing copy is Polish-only for now; the demos' de/en/uk
  translations are not a launch concern.

Non-functional non-goals (quality dimensions this launch will not aim for):

- **No ongoing paid-ads budget** — only the single time-boxed free-credit experiment (FR-015); no
  committed monthly spend. *(Follows from the FR-015 Socrates resolution.)*
- **No rebrand / new design system** — work within the current Hazelgrouse identity and theming.
- **No compliance beyond RODO baseline** — meet RODO; pursue no additional certifications or formal SLAs.

## Product framing (seeds `/sdd-prd` frontmatter — not a PRD section)

- `product_type`: **other** — a go-to-market / online-marketing strategy layered over the existing
  Hazelgrouse web platform (the landing/portfolio changes make it partly `web-app`, hence the nuance).
- `target_scale`: **{ users: small, qps: low, data_volume: small }** — local beachhead audience; the
  first success bar is a handful of paying clients laddering toward the north-star of 10.
- `timeline_budget`: **null** — product-feature mode, no hard deadline; steady solo cadence with a soft
  ~90-day rollout reference from `STRATEGIA_INTERNET.md`.

## Forward: existing assets to build on (informational — for /sdd-prd & planning)

- `STRATEGIA_INTERNET.md` — the drafted RODO-safe inbound strategy; FR-001 extends/operationalizes it.
- `templates/template-portfolio/` — the landing page; FR-005/006/007/009 act here (via template→DB→seed).
- Kaizen Growth (`pnpm goal:next`, `/admin/goals`) — expresses RODO as off-limits + the next-step loop;
  the business-logic rule should live here, not in a parallel system.
- The OSM lead scraper — voivodeship-scoped; sources prospect lists for demo/planning only (not outreach).

## Open Questions

1. **Does a working inbound contact/inquiry form already exist in the templates, or must one be added?**
   — Owner: operator/dev. Affects FR-014 (new vs modified).
2. **RODO + brand handling of warm-signal per-prospect demos** — what is the lawful basis and the consent
   flow for building an unlisted site under a named business's brand before they pay? — Owner: operator.
   Not a blocker for the strategy, but must be settled before the wedge runs at scale.
3. **Which ad platform currently offers free promotional credits (Google Ads vs Meta), and what is the
   explicit stop-metric + time-box for the FR-015 experiment?** — Owner: operator.
4. **Exact pricing tiers / "from X zł" figures for FR-005** — Owner: operator; needed before the landing
   states prices publicly.

## Quality cross-check

All required elements present — no gaps. Open items above are captured as Open Questions (they do not
make the PRD hollow) and will be mirrored into `prd.md` by `/sdd-prd`.

- Access Control: present
- Business Logic (one-sentence rule): present
- Project artifacts: present
- Timeline-cost ack: n/a (product-feature)
- Non-Goals: present
- Preserved behavior: present

