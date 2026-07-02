# bc-check — future improvements

- [ ] **Mobile viewport pass** — second run at 390×844 (`mobile-safari` matches
      `packages/tests/playwright.config.ts`); responsive regressions are invisible at 1440px.
- [ ] **Diff images** — `pixelmatch` accepts an output buffer; write
      `<type>-<index>.diff.png` next to the crops so failures are eyeballable instantly.
- [ ] **CI / cron integration** — run nightly (system crontab next to the strategic
      scheduler) or as a pre-`release` gate (`pnpm release:check`); notify on failures.
- [ ] **Masking dynamic regions** — blog listings, testimonial carousels, maps. Both envs
      read the same DB so content usually matches, but if a section proves noisy, mask by
      selector before screenshotting.
- [ ] **Threshold auto-calibration** — run prod-vs-prod (two loads of the same env) to
      measure the noise floor per template and set the threshold just above it.
- [ ] **VLM judge for semantic diffs** — `packages/sitc-core/src/scorer/vlm.ts` could
      classify a failing pair as "intentional redesign" vs "broken layout".
- [ ] **Parallelize templates** — currently sequential; a small concurrency pool (2–3
      contexts) would cut runtime, but watch the dev server (single PM2 process) load.
- [ ] **Cookie/consent banner dismissal** — none observed on template sites today; if one
      appears, port `dismissBanners` from `packages/sitc-core/src/scorer/capture.ts`.
- [ ] **Compare a local build against prod** — would let `/bc-fix` verify fixes without
      waiting for a develop redeploy (spin up `apps/engine` locally, override the base URL).
