# ADR-0017: Anthropic API Key Usage Scope

**Status:** accepted  
**Date:** 2026-04-27

## Context

The Anthropic API key (`ANTHROPIC_API_KEY`) is a paid, rate-limited resource. An earlier implementation added on-the-fly AI content generation triggered by end-user page visits (service detail pages), calling the Claude API every time a service page lacked blog content. This created unbounded API usage driven by anonymous traffic — not by deliberate business owner actions.

## Decision

The Anthropic API key must be used **only** in the website creation flow on `hazelgrouse.pl`, specifically when a business owner is actively generating or scaffolding a new site using the **template-tech-agency** template (formerly `portfolio-tech`). This is a one-time, intentional action gated behind authentication.

All other runtime paths — rendering pages, enriching service detail pages, etc. — must **not** call the Anthropic API.

## Consequences

**Positive:**
- API costs are proportional to business creation events (bounded, predictable).
- No anonymous traffic can trigger AI calls.
- Service detail pages render from manually authored content or linked blog posts only.

**Negative:**
- Service pages without explicit content or a linked blog will show no extended description (acceptable — the base service card description is sufficient).
- Removing the auto-generation shortcut means content must be authored intentionally.

## Alternatives considered

- **Keep auto-generation but rate-limit per business** — still couples AI cost to page traffic; harder to reason about billing.
- **Cache aggressively** — reduces repeat calls but first-hit cost remains; also couples AI to the rendering engine.
