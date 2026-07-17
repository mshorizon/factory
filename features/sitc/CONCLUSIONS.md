# SITC — Conclusions & Improvement Roadmap

What we learned getting the loop to actually produce design improvements end-to-end, and where to take
the feature next. Written after the first sustained live runs against a real target
(`trbki-sacrum-home.base44.app` → `template-sacrum`).

## Status: it works

The loop runs end-to-end and produces real, scored design improvements. On `template-sacrum` it evolved
all units to **navbar 0.90 · services 0.86 · hero 0.80 · project ~0.87 · about 0.74 · footer** (capped by a
config gap, fixed manually), then **converged** (a run with 0 promotions), then handed off the residual gaps
for manual fixing. That full arc — evolve → converge → manual handoff — is the intended lifecycle.

## Hard-won engineering conclusions (these will bite again if forgotten)

1. **Render fidelity needs a per-worktree engine.** The original harness swapped only the JSON profile and
   rendered with the *main* repo's components, so `extend-variant`/`new-variant`/`new-section` edits (which
   live in the worktree's `packages/ui`) were invisible — the scorer judged the unchanged base and every
   component promotion was noise. Fix: launch `astro dev` **from the worktree** with a `SITC_RENDER_ENGINE`
   alias so `@mshorizon/ui` resolves to that tree (`orchestrator/engine-manager.ts`).

2. **Force entrance animations to their final state before screenshotting.** Sections use framer-motion
   (`initial opacity:0` + transform, often staggered). CSS animation-freezing doesn't touch JS-set inline
   styles, so cards rendered blank and scored as empty. Reveal step in `steps/render.ts` sets opacity→1 /
   transform→none on the section subtree.

3. **DOM-based target segmentation beats VLM pixel guesses.** The VLM under-segmented a multi-section page
   into a few coarse bands whose y-ranges straddled real section boundaries, so sections were scored against
   the *wrong* content (and `about` was orphaned, 0 iterations). Reading the target's real section
   boundaries from the DOM (`scorer/capture.ts`) gave clean, complete, correctly-aligned bands.

4. **Ground-truth CSS beats VLM color/font guesses.** Measuring the target's computed styles (exact hex,
   font families, radius — global + per-band) and feeding them to the theme pass + worker prompt closed the
   "close but not precise" gap (e.g. dark-vs-light icon badges).

5. **Fail fast on render errors.** A broken worker edit makes Astro SSR 500; the renderer used to hang on a
   visibility wait for 240s per such iteration. Detect HTTP ≥400 / error overlay and revert in seconds — the
   error then feeds the worker's next critique.

6. **Machine contention is the dominant *local* failure mode — not the code.** Antivirus (Defender) scanning
   worktree/vite churn, IDE indexing, and other projects' dev daemons drove load to 40–50 and made Vite
   compiles time out or `FailedToLoadModuleSSR`. At load <15 everything works. SITC runs locally, so **run it
   on a quiet machine** — close Docker/IDE indexers/other dev daemons first. Also: spawn engines detached +
   kill the process group, and tear down on crash/signal, or orphaned engines compound until the box saturates.

7. **Scope the worker to its own template.** It would otherwise propose edits to other businesses' templates
   (correctly rejected by the allowlist, but wasting iterations). Prompt + a defensive plan filter keep it in
   `templates/<run-template>/`.

8. **The loop converges — then it's a human's turn.** Eventually a run lands 0 promotions because every unit
   matches OR its remaining gap is unreachable by the strategies (component code the worker declines, a
   broken asset, a layout primitive). That's not a failure — `loop/convergence.ts` emits the residual gaps as
   a manual backlog (DESIGN §8.1). The sacrum footer "Strony" column, the broken `about` image, and the
   navbar item set were all fixed this way.

## Improvement roadmap (highest leverage first)

1. ~~**Render-engine performance.**~~ ✅ **Addressed (I2 + I3).** Cold Vite compile per render was the main cost.
   Two fixes landed: **I2** routes `tune-json` (the dominant, JSON-only strategy) through a shared per-champion
   base engine — never compiles; **I3** gives the code-changing strategies a **pool of persistent slot worktrees**
   reused across iterations (reset to champion on acquire) so their engines stay warm + HMR is incremental,
   instead of a fresh cold worktree each time. See `tasks.md` I2/I3.

2. **Automate the delivery → develop merge.** Clean `tune-json`/`extend-variant` runs are designed to
   auto-merge (§8); in practice we cherry-picked run branches by hand. Wire the routing so converged, gate-
   passing runs land on `develop` (or open a PR) without manual cherry-picks.

3. **DRY the chrome prop-assembly.** The footer/navbar prop mapping (incl. the auto "Strony" pages column) is
   duplicated across ~8 page files + the harness. The `hidePagesColumn` fix only covers the home page + SITC
   harness. Extract a shared `buildFooterColumns`/`buildNavbarProps` helper so a fix applies site-wide and the
   harness can't drift from the real page.

4. ~~**Target asset handling.**~~ ✅ **Reference imagery captured (I11).** Capture now records each section's
   imagery SHAPE/ROLE (aspect-ratio bucket, full-bleed-background flag, count — not the bytes, per the IP posture)
   and feeds it to the worker via the `targetStyle` seam, so it picks a closer-aspect placeholder/R2 asset (a
   16:9 hero vs a 1:1 thumbnail, §18-F). Downloading the actual target bytes stays out of scope (design
   inspiration, not asset copying). See `tasks.md` I11.

5. ~~**Structured, per-dimension scoring.**~~ ✅ **Done (I8).** `scorer/rubric.ts` turns the VLM output into a
   per-dimension breakdown + a severity-tagged must-fix checklist (`normalizeFindings`/`renderCritique`); the
   worker now gets that checklist as its steering critique instead of a prose blob, and `suggestStrategy` maps
   the dominant gap to a strategy hint (token gaps → tune-json, structural → new-variant). See `tasks.md` I8.

6. ~~**Scheduler coverage guarantee.**~~ ✅ **Done (I14).** `about` once got 0 iterations because higher-gap
   peers hogged every round (pure gap priority) and the run settled on budget before it was ever dispatched.
   Fixed with a coverage floor: `SectionState` gained a never-reset `dispatches` counter, and `pickNext` now
   sorts in-play units below the floor (`minCoverage`, default 1) strictly before covered peers — so every
   in-play unit is attempted ≥N times before any peer is re-rolled beyond it (bounded by rounds×maxWorkers).
   Operator override `SITC_MIN_COVERAGE`. See `tasks.md` I14.

7. **Budget defaults down.** opus converges fast and most units no-op as "already matches" once the template
   is close — budget ~12–15 (not 30–60) is plenty for incremental runs. Each run should commit to `develop`
   so the next run starts from the improved state (accumulate, don't restart).

8. ~~**Multi-breakpoint scoring.**~~ ✅ **Mobile guard wired (I12).** The §5.2-step-6 mobile guard was never
   actually implemented (mobile was captured, never consulted). Now an additive `guard` collaborator + opt-in
   `SITC_SCORE_MOBILE=1`: a desktop-winning challenger that introduces mobile horizontal overflow vs the champion
   is rejected. `combineBreakpointScores` is the pure primitive for full weighted both-breakpoint scoring next
   (needs mobile target crops from ingestion). See `tasks.md` I12.
