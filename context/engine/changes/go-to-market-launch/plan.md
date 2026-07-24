# Go-To-Market Launch Implementation Plan

## Overview

Execute the first go-to-market launch for Hazelgrouse Studio. Make the landing page
(`hazelgrouse.pl`, rendered from the `template-portfolio` business) presentable and
conversion-ready, verify the inbound funnel plumbing (contact form + analytics), consolidate the
marketing strategy into one RODO-safe operating loop wired to the Kaizen Growth goal engine, and
produce the presence playbook (GBP + social + a bounded paid-ads experiment). Strategy-first,
solo-executable, and without destabilizing the live factory.

## Current State Analysis

- **Landing** = `templates/template-portfolio/template-portfolio.json` → seeded to PostgreSQL →
  rendered by `apps/engine` at `hazelgrouse.pl`. Edits go live only via the template→DB→seed→restart
  flow (per CLAUDE.md).
- **Portfolio showcase** (`/pages/home/sections[3]`, `templateItems[]`) lists only 3 of 6 demos —
  law, restaurant, specialist. **Missing: art, sacrum, tech.** Their preview PNGs
  (`apps/engine/public/template-previews/{art,sacrum,tech}.png`) do **not** exist and must be captured
  from the live demo sites. Present PNGs: law, restaurant, specialist, admin-panel.
- **Dead links:** footer `columns[1]` has 4 links with `"value": "#"`; 6 blog-post links use `href:"#"`
  (home + blog page), and reference 3 missing `blog-*.png` previews.
- **Social links** are placeholders: `/business/socials` (`facebook.com/hazelgrouse` etc.) and footer
  `columns[2]` (bare `facebook.com`/`instagram.com`/`linkedin.com`). No TikTok/YouTube.
- **Contact form exists and works:** `template-portfolio.json` renders a `contact` section (variant
  `panel`) → `ContactPanel` (`packages/ui/src/sections/contact/`) → POSTs to
  `apps/engine/src/pages/api/contact.ts` → emails via Resend to `kontakt@hazelgrouse.studio`
  (rate-limited; optional Turnstile CAPTCHA/SMS/push). Submissions are **not** persisted to a DB.
  **Gaps:** no RODO consent checkbox on the form; delivery depends on `RESEND_API_KEY` being set.
- **Analytics:** Umami is referenced in the repo (`updateSiteUmamiId`) and there is a
  `CookieConsentBanner.astro`; the landing's Umami wiring + event firing must be verified.
- **Kaizen Growth:** `goals`/`goalSteps` tables + `/admin/goals`. `BASELINE_OFF_LIMITS`
  (`scripts/lib/goal-step.ts`) already forbids cold outreach. RODO reinforcement → the off-limits
  textarea; beachhead + channel preference → the north-star title text. **No code change needed.**
- **Strategy docs:** `STRATEGIA_INTERNET.md` is a complete RODO-safe inbound playbook (§0–11 + KPIs +
  90-day plan + Kaizen wiring). It references a conflicting sibling `STRATEGIA_MARKETINGOWA.md`
  (cold-SMS-based) that contradicts the RODO guardrail.
- **Locales:** the landing has 4 translation files — `pl`, `en`, `de`, `uk` (primary `pl`).

## Desired End State

`hazelgrouse.pl` showcases all 6 live demos with working links and a transparent "from X zł" offer;
the contact form is RODO-compliant and verified to deliver; landing analytics track visits + CTA
clicks + form submits with a documented UTM scheme; there is exactly one authoritative, RODO-safe
strategy document sharpened to the tradesperson/mazowieckie beachhead, with the Kaizen `/admin/goals`
operating loop documented; and a presence playbook exists for staged GBP+FB→IG→TikTok setup plus a
time-boxed paid-ads experiment. Verify by loading the live landing, submitting a test inquiry, and
confirming events in Umami.

### Key Discoveries:

- Showcase items live at `template-portfolio.json` `/pages/home/sections[3]/templateItems[]`, keyed
  `t:home.3.templateItems.{M}.{name,description,tags.0}` across `translations/{pl,en,de,uk}.json`.
- Contact form is fully wired end-to-end (`apps/engine/src/pages/api/contact.ts`) — email-only, no DB.
- Consent checkbox is the compliance gap; the shared form UI is in `packages/ui/src/sections/contact/`
  and must stay industry-agnostic (used by every business, not just the landing).
- Kaizen off-limits is config-only via `/admin/goals` — the strategy just needs to document the exact
  text to paste.

## What We're NOT Doing

- **No expansion beyond the beachhead** (other niches / voivodeships) — later phase.
- **No new template verticals** — the 6 demos are the catalog; "complete templates" = polish + showcase.
- **No custom CRM / marketing-automation build** — prospects tracked via Kaizen + admin; no new tooling.
- **No DB persistence of contact submissions** — email-only delivery is sufficient for launch.
- **No multi-language marketing** — Polish-only marketing copy (the landing keeps its 4 UI locales).
- **No ongoing paid-ads budget** — only the single time-boxed free-credit experiment.
- **No rebrand / new design system**, **no compliance beyond RODO baseline**.
- **No cold electronic outreach anywhere** — hard RODO guardrail.
- **No inventing pricing figures or privacy-policy legal copy** — those are operator-supplied inputs.

## Implementation Approach

Sequence prerequisites before amplification (per `STRATEGIA_INTERNET.md` §0/§10): first make the
landing convert (Phases 1–2), then make it measurable (Phase 3), then consolidate the strategy + wire
the Kaizen loop (Phase 4), then produce the outbound-presence playbook (Phase 5). All landing changes
follow the template→DB→seed→restart flow and respect semantic-token theming. Manual verification for
each landing phase is "seen live on the dev/prod landing."

## Critical Implementation Details

- **Template→DB→live ordering:** editing `template-portfolio.json` or its translations changes nothing
  live until `pnpm run db:seed` (from `packages/db`, with `DATABASE_URL`) runs and the dev server
  restarts. Every landing phase's manual verification depends on this having been run.
- **Shared contact UI blast radius:** the consent checkbox is added to a `packages/ui` contact
  variant used by *all* businesses. It must be driven by config (opt-in / labeled via the section's
  `form` config) so it does not force a checkbox onto businesses that haven't set privacy copy — or be
  applied to the `panel` variant the landing uses with a config-gated flag. Keep it industry-agnostic.

## Phase 1: Landing presentability & links

### Overview

Showcase all 6 demos, remove every dead link, and add the transparent offer/pricing section so a
landing visitor sees a complete, credible portfolio with a clear "what it costs / how to start" path.

### Changes Required:

#### 1. Capture the three missing demo previews

**File**: `apps/engine/public/template-previews/{art,sacrum,tech}.png`

**Intent**: The showcase needs real screenshots of the art, sacrum, and tech demos before they can be
listed; a card with a broken image is worse than no card.

**Contract**: Three PNGs matching the dimensions/aspect of the existing `law.png` /
`specialist.png` / `restaurant.png`, captured from `https://template-{art,sacrum,tech}.hazelgrouse.pl/`
(desktop viewport, above-the-fold hero). Capture via Playwright; save to the previews directory.

#### 2. Add the 3 demos to the showcase

**File**: `templates/template-portfolio/template-portfolio.json`

**Intent**: List art, sacrum, and tech alongside the existing three so the portfolio reflects the full
catalog (FR-006).

**Contract**: Three new entries in `/pages/home/sections[3]/templateItems[]` (indices 3–5), each with
`screenshot` (`/template-previews/{art,sacrum,tech}.png`), `demoUrl`
(`https://template-{art,sacrum,tech}.hazelgrouse.pl/`), and `name`/`description`/`tags` as translation
keys `t:home.3.templateItems.{3,4,5}.*`. Follow the exact shape of items 0–2.

#### 3. Add translations for the 3 new demos

**File**: `templates/template-portfolio/translations/{pl,en,de,uk}.json`

**Intent**: Populate the copy for the new showcase keys in all four locales so no raw `t:` key renders.

**Contract**: Keys `home.3.templateItems.{3,4,5}.{name,description,tags.0}` added to each of the 4 locale
files, matching the nesting of items 0–2. Polish is authoritative; other locales translated from it.

#### 4. Remove all dead links

**File**: `templates/template-portfolio/template-portfolio.json`

**Intent**: No public dead links (FR-007). Footer `columns[1]` (4 links) and the 6 blog-post `href:"#"`
links currently go nowhere.

**Contract**: Footer `columns[1]` link targets point to real internal sections/pages or the link is
removed. Blog-post links either point to real `/blog/<slug>` targets or the placeholder blog items are
removed; if kept, replace the 3 missing `blog-*.png` references with existing assets or remove the
images. No `"value": "#"` / `href: "#"` remains in the file.

#### 5. Add the offer / pricing section

**File**: `templates/template-portfolio/template-portfolio.json` (+ `translations/*.json`)

**Intent**: State the offer plainly with transparent "from X zł" + packages (FR-005) so visitors
self-qualify. Operator supplies the actual figures.

**Contract**: A pricing/offer section in the home page config (use an existing `packages/ui` pricing
section variant if one exists; otherwise a features/offer section), with a "from X zł" headline and
2–3 packages, copy in all 4 locales. Price figures and package names are **operator-supplied** at
implementation (placeholders like `{{PRICE_FROM}}` until provided). Wire the existing hero/nav CTA to it.

#### 6. Seed and publish

**File**: (deploy action) `packages/db` `db:seed`

**Intent**: Push the template edits into PostgreSQL so they render live.

**Contract**: `cd packages/db && DATABASE_URL="…" pnpm run db:seed`, then restart the dev server
(`pm2 restart astro-dev`) per CLAUDE.md.

### Success Criteria:

#### Automated Verification:

- [ ] `template-portfolio.json` parses as valid JSON and validates against the business schema
- [ ] The three preview files exist: `test -f apps/engine/public/template-previews/{art,sacrum,tech}.png`
- [ ] Type check passes: `pnpm type-check`
- [ ] The engine builds: `pnpm --filter @mshorizon/engine build`
- [ ] No `"#"` link values remain: `grep -c '"#"' templates/template-portfolio/template-portfolio.json` returns 0

#### Manual Verification:

- [ ] After `db:seed` + restart, `hazelgrouse.pl` shows all 6 demo cards, each linking to its live demo
- [ ] Every footer and blog link resolves (no dead `#` navigation)
- [ ] The offer/pricing section renders with the operator's figures in all 4 locales
- [ ] No raw `t:` translation keys are visible on the page

---

## Phase 2: Contact form RODO compliance & verification

### Overview

Make the existing inbound contact form legally usable — add a consent checkbox + privacy-policy link —
and verify it actually delivers inquiries to the operator.

### Changes Required:

#### 1. Add a RODO consent checkbox to the contact form

**File**: `packages/ui/src/sections/contact/ContactPanel.tsx` (the variant the landing uses)

**Intent**: A prospect must give informed consent to data processing before submitting (RODO). The
form currently has no consent control.

**Contract**: A required consent checkbox with a config-driven label + privacy-policy link, gating the
submit button, added to the `panel` variant. Config-gated so businesses without privacy copy are not
forced into a broken checkbox — keep the component industry-agnostic. Submit is blocked until checked.

#### 2. Surface the consent copy + privacy link in config

**File**: `templates/template-portfolio/template-portfolio.json` (+ `translations/*.json`)

**Intent**: Provide the consent label and privacy-policy target for the landing's contact section.

**Contract**: The contact section `form` config carries a `consent` label (translation key, 4 locales)
and a link to the privacy policy. Operator supplies the privacy-policy copy.

#### 3. Ensure a privacy policy exists

**File**: `templates/template-portfolio/template-portfolio.json` (a `/privacy` page or linked doc)

**Intent**: The consent link must resolve to a real privacy policy naming the data administrator.

**Contract**: A privacy-policy page/section reachable from the consent link and the cookie banner.
Legal copy is operator-supplied; the plan provides the page structure + link wiring.

#### 4. Verify delivery

**File**: (verification only) `apps/engine/src/pages/api/contact.ts`, environment

**Intent**: Confirm the form emails reach the operator — the endpoint returns 503 without
`RESEND_API_KEY` and 400 without a recipient.

**Contract**: `RESEND_API_KEY` is set in the engine environment and the recipient
(`config.notifications.email` or `business.contact.email`) is the operator's real inbox. A submitted
test inquiry arrives by email.

### Success Criteria:

#### Automated Verification:

- [ ] Type check passes: `pnpm type-check`
- [ ] UI package builds: `pnpm --filter @mshorizon/ui build`
- [ ] `ContactPanel` renders with the consent checkbox in existing UI tests/storybook (or a smoke render)

#### Manual Verification:

- [ ] The submit button is disabled until the consent checkbox is ticked
- [ ] The consent label links to a working privacy policy naming the data administrator
- [ ] A test inquiry submitted on the landing arrives in the operator's inbox
- [ ] Consent checkbox does not appear/break on other businesses that haven't configured it

---

## Phase 3: Measurement wiring

### Overview

Make the funnel measurable: confirm the landing tracks visits and key conversion events, and define the
UTM + weekly-review discipline so channel performance is legible (FR-002).

### Changes Required:

#### 1. Verify/enable Umami on the landing

**File**: landing site config / `updateSiteUmamiId` (`packages/db`)

**Intent**: The landing must collect pageviews and be attributable by source.

**Contract**: The `template-portfolio` site has a valid Umami website ID set (via `updateSiteUmamiId`
or config) and the tracking script loads on `hazelgrouse.pl`.

#### 2. Confirm conversion events fire

**File**: `packages/ui/src/sections/contact/ContactPanel.tsx` (existing `umami.track('contact-form-submit')`), CTA elements

**Intent**: Beyond pageviews, track the two conversion signals: CTA clicks and form submits.

**Contract**: `contact-form-submit` fires on successful submit (already present — verify), and the
primary "free demo / see pricing" CTA fires a tracked event. Add a tracked event to the CTA if missing.

#### 3. Document the UTM scheme + weekly review

**File**: `STRATEGIA_INTERNET.md` (§9 already drafts this — finalize)

**Intent**: A single documented UTM convention so every channel link is attributable, plus a 10-minute
weekly-review ritual.

**Contract**: A concrete UTM table (`utm_source` values per channel: gbp/tiktok/olx/tablica/google/meta)
and the weekly-review checklist confirmed in §9. No code.

### Success Criteria:

#### Automated Verification:

- [ ] Type check passes: `pnpm type-check`
- [ ] The Umami tracking script tag is present in the landing's rendered HTML (grep the built/served page)

#### Manual Verification:

- [ ] A visit to `hazelgrouse.pl` appears in the Umami dashboard
- [ ] Clicking the primary CTA and submitting the form each register as events in Umami
- [ ] The UTM scheme + weekly-review ritual are documented and unambiguous

---

## Phase 4: Strategy consolidation & Kaizen operating loop

### Overview

Leave exactly one authoritative, RODO-safe strategy document sharpened to the beachhead, and document
the Kaizen `/admin/goals` operating loop so `pnpm goal:next` proposes legal, on-strategy steps.

### Changes Required:

#### 1. Archive the conflicting cold-SMS strategy

**File**: `STRATEGIA_MARKETINGOWA.md` → an archive location

**Intent**: The cold-SMS doc contradicts the RODO guardrail and is a landmine; remove it from the active
set while keeping history.

**Contract**: Move `STRATEGIA_MARKETINGOWA.md` to an archive folder (e.g. `docs/archive/`) and prepend a
header noting it is **superseded by `STRATEGIA_INTERNET.md` for RODO reasons — do not use**. Any reusable
pricing/offer content it holds is lifted into `STRATEGIA_INTERNET.md` first.

#### 2. Sharpen the inbound strategy to the beachhead

**File**: `STRATEGIA_INTERNET.md`

**Intent**: Make the (already strong) playbook explicitly target tradespeople in mazowieckie and encode
the demo-after-warm-signal wedge, staged channels, and the weekly cadence as the operating loop
(FR-001/003/004).

**Contract**: A beachhead section (tradespeople / mazowieckie / `specialist` demo), the FR-012
warm-signal-first rule (no cold pre-building; unlisted/noindex until consent), the staged channel
rollout (GBP+FB → IG → TikTok), and confirmation that §3 (content engine) + §10 (weekly cadence) are
THE operating loop. Remove the reference to the now-archived cold-SMS doc.

#### 3. Document the Kaizen operating-loop config

**File**: `STRATEGIA_INTERNET.md` (§11) and/or `context/engine/changes/go-to-market-launch/` note

**Intent**: The RODO + beachhead + channel-preference config is set purely via `/admin/goals`; document
the exact text to paste so the loop is reproducible.

**Contract**: The exact north-star **title** text (beachhead + channel preference, e.g. "10 paying
tradesperson clients in mazowieckie, won primarily in-person, then referral, then inbound") and the exact
**off-limits** text (RODO no-cold-outreach reinforcement), plus a one-line note that
`BASELINE_OFF_LIMITS` already covers cold outreach. No schema/code change.

### Success Criteria:

#### Automated Verification:

- [ ] `STRATEGIA_MARKETINGOWA.md` no longer exists at the repo root: `test ! -f STRATEGIA_MARKETINGOWA.md`
- [ ] The archived copy exists with the superseded header
- [ ] No active doc references cold SMS as a live tactic: `grep -ril "cold sms" --include=*.md .` returns only the archived file

#### Manual Verification:

- [ ] `STRATEGIA_INTERNET.md` reads as a single coherent beachhead-focused operating loop
- [ ] The documented `/admin/goals` north-star + off-limits text is present and pasteable
- [ ] Pasting that config and running `pnpm goal:next` proposes an on-strategy, RODO-safe step

---

## Phase 5: Presence playbook & launch checklist

### Overview

Produce the operator-facing playbook for the outbound presence (GBP + social, staged) and the bounded
paid-ads experiment, add genuine trust-signal content to the landing, and wire the real social links
once profiles exist.

### Changes Required:

#### 1. Staged social/GBP setup checklist

**File**: a new playbook doc (e.g. `docs/presence-playbook.md`) — condensed from `STRATEGIA_INTERNET.md` §1/§3/§4

**Intent**: A concrete, checkbox setup guide the operator executes to stand up presence in the right
order (GBP + Facebook first, then Instagram, then TikTok) — FR-008/010.

**Contract**: Step-by-step setup for GBP (category, service-area, description, first reviews) and
Facebook, then IG, then TikTok, each with the exact profile fields, the landing URL + UTM, and the
"post one build per week" content cadence. Operator executes; the plan delivers the checklist.

#### 2. Trust-signals content on the landing

**File**: `templates/template-portfolio/template-portfolio.json` (+ `translations/*.json`)

**Intent**: Give a skeptical local owner genuine reasons to trust — real demos + "who's behind
Hazelgrouse" (FR-011). No fabricated reviews.

**Contract**: A short about/trust section (who runs the studio, the "site in minutes + you own the admin
panel" promise, the 6 live demos as proof), copy in 4 locales. Reviews only added later when real.

#### 3. Wire real social links

**File**: `templates/template-portfolio/template-portfolio.json`

**Intent**: Replace placeholder social links with the real profiles once created (FR-009), adding
TikTok.

**Contract**: `/business/socials` and footer `columns[2]` updated to the real GBP/Facebook/Instagram/
TikTok URLs. This step's manual precondition is "profiles created" (Phase 5 step 1). Until then, links
may be omitted rather than left as placeholders.

#### 4. Time-boxed paid-ads experiment spec

**File**: `STRATEGIA_INTERNET.md` (§5) or the presence playbook

**Intent**: Define the single free-credit ad experiment as a bounded, stop-conditioned test (FR-015).

**Contract**: Which platform's free credits, the campaign target (landing CTA / form submit), a fixed
end date, and the explicit success metric (e.g. cost/lead < threshold) that decides continue-or-stop.
No ongoing budget committed.

### Success Criteria:

#### Automated Verification:

- [ ] Type check passes: `pnpm type-check`
- [ ] `template-portfolio.json` still valid + no `"#"`/placeholder social domains remain once links are wired
- [ ] The presence playbook doc exists

#### Manual Verification:

- [ ] The GBP + social setup checklist is complete enough to execute without further questions
- [ ] The landing's trust section renders in all 4 locales with genuine (non-fabricated) content
- [ ] Once profiles exist, footer + `/business/socials` links open the real profiles (incl. TikTok)
- [ ] The paid-ads experiment spec has a platform, a stop date, and a numeric success metric

---

## Testing Strategy

### Automated:

- JSON validity + schema validation for `template-portfolio.json` after every edit.
- `pnpm type-check` and per-package builds (`@mshorizon/engine`, `@mshorizon/ui`).
- Grep guards: no `"#"` link values; no active-doc cold-SMS references; Umami script present.

### Manual Testing Steps:

1. Run `db:seed` + restart; load `hazelgrouse.pl`; confirm 6 demos, working links, pricing, trust section.
2. Submit a test inquiry with consent unchecked (blocked) and checked (delivered by email).
3. Confirm pageview + CTA-click + form-submit events in Umami.
4. Paste the documented north-star + off-limits into `/admin/goals`; run `pnpm goal:next`; confirm the
   proposed step is on-strategy and RODO-safe.

## Migration Notes

No data migration. All changes are content/config (`template-portfolio.json` + translations), a shared
UI component (consent checkbox), documentation, and environment/config verification. The only stateful
action is `db:seed`, which overwrites the `template-portfolio` business config from the template — the
established, reversible template→DB flow.

## References

- PRD: `context/engine/foundation/go-to-market-launch/prd.md`
- Shape notes: `context/engine/foundation/go-to-market-launch/shape-notes.md`
- Strategy playbook: `STRATEGIA_INTERNET.md`
- Landing: `templates/template-portfolio/template-portfolio.json`
- Contact form: `packages/ui/src/sections/contact/`, `apps/engine/src/pages/api/contact.ts`
- Kaizen: `apps/engine/src/components/admin/GoalsView.tsx`, `packages/db/src/goals.ts`, `scripts/lib/goal-step.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Landing presentability & links

#### Automated

- [ ] 1.1 template-portfolio.json parses + validates against the business schema
- [ ] 1.2 art/sacrum/tech preview PNGs exist in apps/engine/public/template-previews/
- [ ] 1.3 Type check passes: `pnpm type-check`
- [ ] 1.4 Engine builds: `pnpm --filter @mshorizon/engine build`
- [ ] 1.5 No `"#"` link values remain in template-portfolio.json

#### Manual

- [ ] 1.6 Live landing shows all 6 demo cards, each linking to its live demo
- [ ] 1.7 Every footer and blog link resolves (no dead `#`)
- [ ] 1.8 Offer/pricing section renders with operator figures in all 4 locales
- [ ] 1.9 No raw `t:` translation keys visible on the page

### Phase 2: Contact form RODO compliance & verification

#### Automated

- [ ] 2.1 Type check passes: `pnpm type-check`
- [ ] 2.2 UI package builds: `pnpm --filter @mshorizon/ui build`
- [ ] 2.3 ContactPanel renders with the consent checkbox (smoke render / test)

#### Manual

- [ ] 2.4 Submit is disabled until the consent checkbox is ticked
- [ ] 2.5 Consent label links to a working privacy policy naming the data administrator
- [ ] 2.6 A test inquiry arrives in the operator's inbox
- [ ] 2.7 Consent checkbox doesn't break other businesses that haven't configured it

### Phase 3: Measurement wiring

#### Automated

- [ ] 3.1 Type check passes: `pnpm type-check`
- [ ] 3.2 Umami tracking script tag present in the landing's rendered HTML

#### Manual

- [ ] 3.3 A visit to hazelgrouse.pl appears in the Umami dashboard
- [ ] 3.4 CTA click + form submit each register as Umami events
- [ ] 3.5 UTM scheme + weekly-review ritual are documented and unambiguous

### Phase 4: Strategy consolidation & Kaizen operating loop

#### Automated

- [ ] 4.1 STRATEGIA_MARKETINGOWA.md no longer at repo root (`test ! -f`)
- [ ] 4.2 Archived copy exists with the superseded header
- [ ] 4.3 No active doc references cold SMS as a live tactic (grep returns only the archived file)

#### Manual

- [ ] 4.4 STRATEGIA_INTERNET.md reads as one coherent beachhead-focused operating loop
- [ ] 4.5 The `/admin/goals` north-star + off-limits text is present and pasteable
- [ ] 4.6 Pasting that config + running `pnpm goal:next` proposes an on-strategy, RODO-safe step

### Phase 5: Presence playbook & launch checklist

#### Automated

- [ ] 5.1 Type check passes: `pnpm type-check`
- [ ] 5.2 template-portfolio.json valid + no placeholder social domains remain once wired
- [ ] 5.3 Presence playbook doc exists

#### Manual

- [ ] 5.4 GBP + social setup checklist is executable without further questions
- [ ] 5.5 Trust section renders in all 4 locales with genuine content
- [ ] 5.6 Once profiles exist, footer + /business/socials links open the real profiles (incl. TikTok)
- [ ] 5.7 Paid-ads experiment spec has a platform, a stop date, and a numeric success metric
