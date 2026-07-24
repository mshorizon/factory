# Go-To-Market Launch — Plan Brief

> Full plan: `context/engine/changes/go-to-market-launch/plan.md`
> PRD: `context/engine/foundation/go-to-market-launch/prd.md`

## What & Why

Stand up Hazelgrouse Studio's first go-to-market launch. The factory can produce SME sites in minutes
but has no inbound demand, no social presence, and can't legally cold-outreach (RODO). This makes the
landing convert, verifies the funnel, consolidates one RODO-safe strategy wired to the Kaizen loop, and
produces the presence playbook — all solo-executable.

## Starting Point

`hazelgrouse.pl` (the `template-portfolio` business) shows only 3 of 6 demos, has dead `#` links and
placeholder social links, and a working-but-non-compliant contact form (emails via Resend, no consent
checkbox). `STRATEGIA_INTERNET.md` is already a full RODO-safe playbook but sits next to a conflicting
cold-SMS doc. Kaizen Growth already forbids cold outreach at the baseline.

## Desired End State

The landing showcases all 6 live demos with working links + a transparent "from X zł" offer; the contact
form is RODO-compliant and verified to deliver; landing traffic + CTA clicks + form submits are tracked
with a documented UTM scheme; there is one authoritative beachhead-focused strategy with the `/admin/goals`
operating loop documented; and a presence playbook exists for staged GBP+FB→IG→TikTok plus a bounded
paid-ads experiment.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Beachhead | Tradespeople, mazowieckie (PL-14) | Focus beats breadth for a solo operator | Shape/PRD |
| Conversion wedge | Demo generated *after* a warm signal, unlisted until consent | Avoids RODO/brand risk of cold pre-building | Shape (Socrates) |
| Contact form scope | Consent checkbox + verify delivery; email-only | Form already works; lowest-effort compliance | Plan |
| Cold-SMS doc | Archive with superseded header | Removes the RODO landmine, keeps history | Plan |
| Measurement | Wire Umami + UTM on landing | Real tracking using existing repo infra | Plan |
| Kaizen wiring | Config-only via /admin/goals | Matches "no custom tooling" non-goal | Plan (research) |
| Channels | GBP+FB first, then IG, then TikTok | Staged rollout protects solo capacity | Shape (Socrates) |
| Pricing / privacy copy | Operator-supplied inputs | Plan builds structure; won't invent figures/legal text | Plan |

## Scope

**In scope:** landing showcase (all 6 demos), dead-link + social-link cleanup, offer/pricing section,
contact-form consent + delivery verification, Umami/UTM measurement, strategy consolidation + Kaizen
config docs, presence playbook, paid-ads experiment spec.

**Out of scope:** beachhead expansion, new template verticals, DB persistence of inquiries, custom
CRM/automation, multi-language marketing, ongoing paid budget, rebrand, cold outreach of any kind.

## Architecture / Approach

Prerequisites before amplification: make the landing convert (Ph 1–2) → make it measurable (Ph 3) →
consolidate strategy + wire Kaizen loop (Ph 4) → produce outbound-presence playbook (Ph 5). All landing
edits go through the template→DB→`db:seed`→restart flow and respect semantic-token theming. The consent
checkbox lives in the shared `packages/ui` contact component and must stay industry-agnostic (config-gated).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Landing presentability & links | 6 demos shown, no dead links, offer section | Screenshot capture + 4-locale translations; pricing figures pending |
| 2. Contact form compliance & verify | RODO consent checkbox + verified email delivery | Shared UI blast radius; RESEND_API_KEY/recipient must be set |
| 3. Measurement wiring | Umami + events + UTM scheme | Verifying events actually fire on the live landing |
| 4. Strategy consolidation & Kaizen loop | One beachhead strategy + pasteable /admin/goals config | Ensuring the LLM planner honors prose preferences |
| 5. Presence playbook & launch checklist | GBP/social checklist, trust content, real links, ads spec | Depends on operator creating external accounts |

**Prerequisites:** access to the live demo sites (for screenshots), `DATABASE_URL` for seeding,
`RESEND_API_KEY` + operator inbox, Umami access, `/admin/goals` (super-admin). Operator-supplied:
pricing figures + privacy-policy copy.
**Estimated effort:** ~4–6 solo sessions across 5 phases (Ph 1 the largest; Ph 4–5 doc-heavy).

## Open Risks & Assumptions

- Pricing figures and privacy-policy legal copy are operator-supplied; Phase 1/2 stall on those inputs.
- The Kaizen channel-preference is prose in the north-star title (LLM honors it), not a structured field.
- Social-link wiring (Ph 5) is gated on the operator actually creating the external profiles.
- Demo sites must be live and presentable when screenshots are captured.

## Success Criteria (Summary)

- A visitor to `hazelgrouse.pl` sees all 6 demos, a clear offer, working links, and can submit a
  RODO-compliant inquiry that reaches the operator.
- Landing traffic and conversions are visible in Umami by source.
- One coherent RODO-safe strategy drives `pnpm goal:next` toward legal, on-strategy next steps.
