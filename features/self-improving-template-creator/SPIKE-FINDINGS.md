# Phase −1 Spike — Findings & Go/No-Go

> Validates the two load-bearing bets in the v1 spec before committing the build roadmap
> (see [`README.md`](./README.md) §14 and [`DESIGN.md`](./DESIGN.md) §4.4 / §7.2a).
> **Date:** 2026-06-15 · **Result: BOTH BETS HOLD → GO.**

---

## TL;DR

| Bet | Question | Result |
| :--- | :--- | :--- |
| **Spike 1 — isolation-render fidelity (§4.4)** | Is a section rendered alone close enough that a score on it is trustworthy? | **PASS** — harness reproduces sections faithfully; the VLM (the actual scorer) judges isolated ≈ in-page as `same_design: identical`. |
| **Spike 2 — pairwise-judge reliability (§7.2a)** | Does the pairwise judge agree with humans and resist positional bias? | **PASS** — **100% order-stability** (0 positional bias), **90% agreement** on confident triples. |

No load-bearing decision was invalidated. **The spec stays at v1; proceed to the build (README §14, Phase 0+).**

---

## Spike 1 — isolation-render fidelity

**Method.** Built a real harness route, `apps/engine/src/pages/sitc-harness/section.astro`, that renders ONE
section through the **actual `BaseLayout` + `SectionDispatcher`** (so theme CSS-var injection, variant
resolution, and wrapper bg/spacing are the real code paths) with no navbar/footer/siblings. Then screenshotted
the same section both **in-page** (full engine render) and **isolated** (harness), and compared
(`packages/tests/sitc-spike-fidelity.mjs`, Playwright + pixelmatch). Reference business: `template-specialist`
(the live `specialist` site), desktop 1440px.

**Key data (hero, services, ref, ctaBanner, testimonials, blog):**
- Dimensions match **exactly** (e.g. hero 1440×935 in-page == isolated).
- A decisive architectural finding surfaced: **`getBgClass`/spacing in `SectionDispatcher` depend only on the
  section's own `background` + `isHomePage` — not on neighbors.** So a single-section render produces a
  byte-identical wrapper to in-page. Isolation is structurally sound *by construction*.
- Raw element-level pixel-diff was **noisy and unreliable** (0.5% on static sections → 50% on image/animated
  ones) — driven by entrance animations, scroll-reveal state, fixed-chrome overlap, image cropping, and a few-px
  vertical offset (in-page nav-offset context). **Not design differences.**
- The **VLM scorer judged every flagged section `same_design: true, layout_match: "identical"`**, attributing
  all diffs to photo content / cropping / position — i.e. exactly what §7 says to discount.

**Conclusion.** Isolation rendering is faithful at the level that matters (design system). It also **empirically
confirms** the spec's choice to make the VLM the primary signal and pixel-diff only a coarse guard (§7), and to
neutralize animations / scroll-reveal and exclude fixed chrome before scoring (a concrete requirement for the
Phase-2 scorer).

**Artifacts:** `screenshots/sitc-spike/{hero,services}-{inpage,isolated,diff}.png`.

## Spike 2 — pairwise-judge reliability

**Method.** Captured 6 visually distinct hero designs across templates
(`packages/tests/sitc-capture.mjs` → `screenshots/sitc-spike/lib/`). Built 12 `(target, A, B)` triples — 10 with
confident ground truth + 2 deliberately ambiguous (layout-similarity vs palette-similarity). Ran an
**order-symmetric** pairwise judge (`packages/tests/sitc-spike-judge.mjs`, `claude -p`, model `sonnet`,
`--allowedTools Read`): each triple judged in **both** slot orders. Metrics: agreement with human ground truth,
and order-stability (does the verdict follow content, not slot position?).

**Results.**
- **Order-stability: 12/12 (100%)** — every triple resolved identically in both orders. The documented
  positional-bias failure mode did **not** appear on this sample.
- **Agreement: 9/10 (90%)** on confident triples via order-symmetric voting.
- The single miss (`target=restaurant`: judge chose `sacrum` over `tech`) is **defensible** — restaurant shares a
  large atmospheric photo with sacrum; borderline taste, not a clear error. Both ambiguous triples resolved
  sensibly (judge weighted palette in one, layout in the other).

**Conclusion.** The pairwise judge is trustworthy as the promotion mechanism, and order-symmetric voting works.

---

## Caveats / what the spike did NOT prove

1. **Gross vs subtle discrimination.** Spike 2 used cross-*template* (large) design differences. The real loop
   compares a champion and a challenger that both approximate one target with **subtle** deltas. 100% stability /
   90% agreement on gross differences is necessary, not sufficient — **subtle-delta reliability must be measured
   during Phase 2 on a larger, harder calibration set** (this is exactly the `sitc_judge_calibration` set in §10).
2. **Small N.** 12 triples, one section type (hero), one judge model (`sonnet`). Expand to the ~20+ multi-section
   set the spec calls for, and re-check across the model that the real system will pin (§1.1).
3. **In-page reference instability.** `specialist.dev` returned HTTP 500 during the spike (the very dev-instability
   §13.2 cites) — confirming the choice of an **isolated run-scoped DB** for real runs.

## Incidental fixes / artifacts produced

- **`apps/engine/src/lib/logger.ts`** — made the dev `pino-pretty` transport **degrade gracefully** (it was
  hard-crashing *all* middleware locally when the transport couldn't resolve under pnpm+Vite SSR). Genuine
  resilience improvement; keep.
- **`apps/engine/src/pages/sitc-harness/section.astro`** — the isolation harness route. This is effectively the
  seed of the Phase-2 render harness; keep (dev/spike route).
- **Spike scripts** (`packages/tests/sitc-spike-fidelity.mjs`, `sitc-capture.mjs`, `sitc-spike-judge.mjs`) and
  **`pixelmatch`/`pngjs`** devDeps in `@mshorizon/tests`.
- Screenshots under `screenshots/sitc-spike/`.

## Decision

**GO.** Both load-bearing bets hold. Spec remains **v1** (no v1.1 needed). Begin the build at README §14 Phase 0
(`sitc-core` extraction) → Phase 1 (DB/state) → Phase 2 (promote the spike harness + scorer to production, and
**build the calibration set first** to close caveat #1 before the loop runs autonomously).
