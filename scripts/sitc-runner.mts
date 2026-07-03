#!/usr/bin/env tsx
/**
 * SITC orchestrator entrypoint — the REAL long-running consumer (DESIGN §4–§8).
 *
 * Assembles the full pipeline (target ingestion → lockTiers → per-section sweep →
 * gates → strategy-routed delivery) via `runFull`, wiring the real collaborators:
 * claude -p worker, isolation render, hybrid scorer, pairwise judge, gate
 * toolchain. SCAFFOLDING for operator review — see DEPLOY.md.
 *
 * ⚠️ GOVERNANCE: the per-section MUTATE step spawns headless `claude -p` with
 * Edit/Write (an autonomous agent loop). That is gated behind SITC_ENABLE_WORKER=1.
 * Without it, the runner performs target ingestion + prints the execution PLAN and
 * exits — NO autonomous edits, NO branch merge. The first live run is an explicit
 * operator action, never automatic.
 *
 * Usage (on the VPS):
 *   DATABASE_URL=…/hazelgrouse-db SITC_ENGINE_URL=http://localhost:4321 \
 *     pnpm tsx scripts/sitc-runner.ts --run <id> --owner vps          # safe: plan only
 *   SITC_ENABLE_WORKER=1 … pnpm tsx scripts/sitc-runner.ts --run <id> # LIVE autonomous run
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { initDb } from "../packages/db/src/client.js";
import { DrizzleRunStore } from "../packages/db/src/sitc-store.js";
import { DrizzleLessonStore } from "../packages/db/src/sitc-lesson-store.js";
import { DrizzleJudgeCalibrationStore } from "../packages/db/src/sitc-judge-store.js";
import { checkJudgeHealth } from "../packages/sitc-core/src/scorer/judge-health.js";
import { WorktreeManager } from "../packages/sitc-core/src/orchestrator/worktree.js";
import { WorktreePool } from "../packages/sitc-core/src/orchestrator/worktree-pool.js";
import { EngineManager } from "../packages/sitc-core/src/orchestrator/engine-manager.js";
import { defaultEmbedder, probeEmbedder } from "../packages/sitc-core/src/learning/embed.js";
import { retrieveLessons, lessonsToPromptBlock } from "../packages/sitc-core/src/learning/retrieval.js";
import { createClaudeWorker } from "../packages/sitc-core/src/claude-worker.js";
import { CostMeter, runCostRoi, cacheReadShareByLabel } from "../packages/sitc-core/src/cost-meter.js";
import { captureTarget, summarizeBandImages } from "../packages/sitc-core/src/scorer/capture.js";
import { segmentTarget } from "../packages/sitc-core/src/steps/segment.js";
import { cropBands } from "../packages/sitc-core/src/steps/crop-bands.js";
import { alignSections, targetImageMap } from "../packages/sitc-core/src/steps/align-sections.js";
import { renderSection, harnessUrl, measureHorizontalOverflow, MOBILE_GUARD } from "../packages/sitc-core/src/steps/render.js";
import { mobileGuardVerdict } from "../packages/sitc-core/src/scorer/breakpoints.js";
import { scoreSection } from "../packages/sitc-core/src/scorer/score.js";
import { suggestStrategy } from "../packages/sitc-core/src/scorer/rubric.js";
import { pairwiseJudge } from "../packages/sitc-core/src/scorer/pairwise.js";
import { sanityGate } from "../packages/sitc-core/src/loop/sanity.js";
import { createMutateCollaborator } from "../packages/sitc-core/src/loop/mutate-collaborator.js";
import { createSanityChecks, createRegressionChecks, createAcceptanceChecks } from "../packages/sitc-core/src/delivery/checks.js";
import { createRealExistingSsim } from "../packages/sitc-core/src/delivery/existing-ssim.js";
import { resolveAcceptanceTarget, buildAndServePreview, type PreviewServer } from "../packages/sitc-core/src/delivery/preview-server.js";
import { runFull } from "../packages/sitc-core/src/pipeline/run.js";
import { toArmMetrics } from "../packages/sitc-core/src/experiment/lessons-ab.js";
import { summarizeConvergence, renderConvergenceReport, planEscalation, type UnitConvergence } from "../packages/sitc-core/src/loop/convergence.js";
import { runSweep } from "../packages/sitc-core/src/loop/sweep.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL required (control DB)");
  const engineUrl = process.env.SITC_ENGINE_URL ?? "http://localhost:4321";
  const model = process.env.SITC_MODEL ?? "sonnet";
  const workerEnabled = process.env.SITC_ENABLE_WORKER === "1";
  // I1 / §18-G: the OFF arm of the lessons A/B. With this set, no lessons are
  // retrieved into the worker prompt → run.metrics is directly comparable to a
  // lessons-on run via scripts/sitc-lessons-ab.mts.
  const lessonsDisabled = process.env.SITC_DISABLE_LESSONS === "1";
  // I4 — delivery landing. Local no-ff merge always accumulates on the VPS's
  // `develop` so the next run seeds improved (CONCLUSIONS #7). Pushing is
  // outward-facing (triggers prod deploy) → opt-in. PR mode pushes the branch +
  // opens a gh PR for needs_review runs instead of leaving them for cherry-pick.
  const landing = {
    push: process.env.SITC_DELIVERY_PUSH === "1",
    openPr: process.env.SITC_DELIVERY_PR === "1",
    remote: process.env.SITC_GIT_REMOTE ?? "origin",
  };
  const owner = arg("owner") ?? "vps";
  const runId = Number(arg("run"));
  if (!runId) throw new Error("--run <id> required");

  initDb(dbUrl);
  const store = new DrizzleRunStore();
  const run = await store.getRun(runId);
  if (!run) throw new Error(`run ${runId} not found`);
  const template = run.templateName;
  const targetUrl = run.targetUrl;
  const templatePath = path.join(REPO_ROOT, "templates", template, `${template}.json`);
  const profile = JSON.parse(await fs.readFile(templatePath, "utf8"));
  const homeSections: Array<{ type: string }> = profile?.pages?.home?.sections ?? [];

  const artifactsDir = path.join(REPO_ROOT, ".sitc", "runs", String(runId));
  await fs.mkdir(artifactsDir, { recursive: true });

  console.log(`▶ run #${runId}  template=${template}  target=${targetUrl}  owner=${owner}  worker=${workerEnabled ? "LIVE" : "disabled (plan only)"}  lessons=${lessonsDisabled ? "OFF (A/B off-arm)" : "on"}`);

  // I9 — live cost/ROI meter: every `claude -p` call feeds it (onUsage); collab
  // calls are scoped by type so cost attributes to mutate/score/judge.
  const meter = new CostMeter();
  const mkWorkerModel = (m: string) => createClaudeWorker({ model: m, onUsage: (u) => meter.record(u) });
  const mkWorker = () => mkWorkerModel(model);

  // embedder preflight (DESIGN §9.3) — confirms SITC_EMBED_CMD wiring + dim before the run
  const embed = defaultEmbedder();
  const probe = await probeEmbedder(embed);
  console.log(`• embedder: ${probe.source}  dim=${probe.dim}  ${probe.ok ? `ok (${probe.latencyMs}ms)` : `DEGRADED: ${probe.error}`}`);

  // ── target ingestion (DESIGN §4.3) ─────────────────────────────────────────
  console.log("• capturing target …");
  const cap = await captureTarget({ url: targetUrl, outDir: path.join(artifactsDir, "target") });
  const desktopShot = cap.screenshots.desktop;
  const readRunner = mkWorker();
  console.log("• segmenting target …");
  // Prefer DOM-measured section boundaries (accurate + complete) over VLM pixel
  // guesses (which under-segment a multi-section page and mis-align everything).
  // Fall back to VLM segmentation only if DOM extraction found < 2 sections.
  // raw bands; cropBands re-normalizes against the true decoded image height.
  const bands =
    cap.domBands.length >= 2
      ? cap.domBands.map((b, i) => ({ index: i, type: "unknown", yStart: b.yStart, yEnd: b.yEnd, style: b.style }))
      : await segmentTarget(readRunner, desktopShot, { model });
  console.log(`  segmentation: ${cap.domBands.length >= 2 ? `DOM (${cap.domBands.length} sections)` : "VLM fallback"}`);
  const crops = await cropBands({ screenshotPath: desktopShot, bands, outDir: path.join(artifactsDir, "crops") });
  const cropPaths = Object.fromEntries(crops.map((c) => [c.band.index, c.path]));
  // align against the SAME normalized bands that were cropped.
  const alignment = alignSections(crops.map((c) => c.band), homeSections);
  const sectionIds = homeSections.map((s, i) => `${s.type}#${i}`);
  const targetFor = targetImageMap(alignment, sectionIds, cropPaths);

  // Ground-truth styling per section (measured CSS; normalizeBands preserves the
  // spread `style` field through cropping). Maps band index → our section via the
  // same alignment used for crops.
  const fmtStyle = (s: any): string =>
    [
      `page/section background ${s.bg}`,
      `body text ${s.text}`,
      `brand/accent color ${s.accent}`,
      `heading font "${s.headingFont}"`,
      `body font "${s.bodyFont}"`,
      `corner radius ${s.radius}`,
      s.card ? `cards: background ${s.card.bg}, border ${s.card.border}` : "",
      s.button ? `buttons: background ${s.button.bg}, text ${s.button.text}` : "",
    ]
      .filter(Boolean)
      .join("; ");
  const styleByBand: Record<number, string> = {};
  for (const c of crops) {
    const st = (c.band as any).style;
    const imgs = (c.band as any).images as import("../packages/sitc-core/src/scorer/capture.js").BandImage[] | undefined;
    let s = st ? fmtStyle(st) : "";
    // I11 — append the section's reference imagery shape so the worker picks a
    // closer-aspect placeholder/R2 asset (not the target's actual bytes).
    if (imgs?.length) s += (s ? "; " : "") + `imagery: ${summarizeBandImages(imgs)}`;
    if (s) styleByBand[c.band.index] = s;
  }
  const styleFor: Record<string, string> = {};
  for (const e of alignment) {
    if (e.status === "matched" && e.ourSectionIndex != null && e.targetBandIndex != null) {
      const id = sectionIds[e.ourSectionIndex];
      const s = styleByBand[e.targetBandIndex];
      if (id && s) styleFor[id] = s;
    }
  }

  const matched = alignment.filter((e) => e.status === "matched" && e.ourSectionIndex != null);
  console.log(`• alignment: ${matched.length} matched / ${alignment.filter((e) => e.status === "target-only").length} target-only / ${alignment.filter((e) => e.status === "ours-only").length} ours-only`);

  // ── GLOBAL CHROME units (navbar + footer) — evolved alongside sections ──────
  // They're not page sections: navbar = the captured top header crop; footer =
  // the last target-only band crop. Both render via the harness chrome mode.
  const chromeIds: string[] = [];
  if (cap.navbarBand) {
    const navCrop = await cropBands({
      screenshotPath: desktopShot,
      bands: [{ index: 0, type: "navbar", yStart: cap.navbarBand.yStart, yEnd: cap.navbarBand.yEnd }],
      outDir: path.join(artifactsDir, "crops-chrome", "navbar"),
      normalize: false,
    });
    if (navCrop[0]) {
      targetFor["navbar"] = navCrop[0].path;
      styleFor["navbar"] = fmtStyle(cap.navbarBand.style) + (cap.navbarBand.images?.length ? `; imagery: ${summarizeBandImages(cap.navbarBand.images)}` : "");
      chromeIds.push("navbar");
    }
  }
  const targetOnly = alignment.filter((e) => e.status === "target-only" && e.targetBandIndex != null).map((e) => e.targetBandIndex as number);
  const footerBandIdx = targetOnly.length ? targetOnly[targetOnly.length - 1] : null;
  if (footerBandIdx != null && cropPaths[footerBandIdx]) {
    targetFor["footer"] = cropPaths[footerBandIdx];
    if (styleByBand[footerBandIdx]) styleFor["footer"] = styleByBand[footerBandIdx];
    chromeIds.push("footer");
  }
  console.log(`• chrome units: ${chromeIds.length ? chromeIds.join(", ") : "none"}`);

  // sections we will evolve = matched ones that have a target crop
  const evolve = matched
    .map((e) => ({ idx: e.ourSectionIndex as number, id: sectionIds[e.ourSectionIndex as number] }))
    .filter((s) => targetFor[s.id]);

  if (!workerEnabled) {
    console.log("\n── PLAN (worker disabled) ─────────────────────────────────");
    for (const s of evolve) console.log(`  evolve ${s.id.padEnd(18)} → target crop ${path.basename(targetFor[s.id])}`);
    for (const id of chromeIds) console.log(`  evolve ${id.padEnd(18)} → target crop ${path.basename(targetFor[id])}`);
    console.log("\nSet SITC_ENABLE_WORKER=1 to run the autonomous loop (operator action). No edits made.");
    process.exit(0);
  }

  // ── I7: run-start judge-drift gate (opt-in) ─────────────────────────────────
  // Replay the durable calibration triples through the pairwise judge; REFUSE the
  // run if agreement/order-stability dropped, so a drifting judge can't converge on
  // (and auto-merge) the wrong design. Runs before any engine/worktree setup so a
  // failure aborts cheaply. Graceful: empty set → gate skipped, run proceeds.
  if (process.env.SITC_JUDGE_GATE === "1") {
    const judgeStore = new DrizzleJudgeCalibrationStore();
    const health = await checkJudgeHealth(readRunner, judgeStore, { model, now: new Date() }).catch((e) => {
      console.log(`  ⚖ judge-health check errored — gate skipped: ${String(e).slice(0, 120)}`);
      return null;
    });
    if (!health || !health.report) {
      console.log("  ⚖ judge-health: no calibration triples in sitc_judge_calibration — gate SKIPPED (seed triples to enable).");
    } else {
      await judgeStore.recordResults(health.rows).catch(() => {});
      const g = health.gate!;
      console.log(`  ⚖ judge-health: agreement ${(g.agreement * 100).toFixed(0)}%  order-stability ${(g.orderStability * 100).toFixed(0)}%  (n=${g.confidentN})`);
      if (!g.ok) {
        console.error(`  ✗ judge-health gate FAILED — refusing to run (drift risk):\n    - ${g.reasons.join("\n    - ")}`);
        process.exit(3);
      }
    }
  }

  // ── LIVE: real collaborators + runFull ──────────────────────────────────────
  // Worktrees can live outside the repo (SITC_WORKTREE_ROOT) — required when the
  // runner's filesystem copy-on-write would otherwise discard in-repo writes.
  const worktree = new WorktreeManager({ repoRoot: REPO_ROOT, worktreeRoot: process.env.SITC_WORKTREE_ROOT });
  await worktree.createRunBranch(runId);

  // I3 — persistent slot worktree pool: code-changing iterations reuse a warm
  // worktree+engine across the run (reset to champion on acquire) instead of cold-
  // compiling a fresh worktree each time. Sized to the worker concurrency.
  const worktreePool = new WorktreePool(worktree, runId, run.maxWorkers ?? 3);

  // Per-worktree render engine (DESIGN §4.4 fidelity fix): each challenger is
  // screenshotted through an engine launched FROM its own worktree, so edits to
  // packages/ui (extend-variant / new-variant / new-section) are actually
  // rendered. Without this the scorer judged the unchanged base. LRU-capped to
  // the worker count so we never run more engines than concurrent iterations.
  const engines = new EngineManager({
    repoRoot: REPO_ROOT,
    // Headroom (I2): a full round of code-changing strategies needs up to maxWorkers
    // per-worktree engines; the +2 keeps the shared tune-json champion engine warm
    // alongside them instead of LRU-evicting it (which would re-cold-compile next round).
    maxEngines: (run.maxWorkers ?? 3) + 2,
    log: (m) => console.log(`  ⚙ ${m}`),
  });

  // Reliable teardown — without this a crash/Ctrl-C leaks per-worktree astro dev
  // engines (+ their vite/esbuild children), which compounded across runs until
  // the machine saturated (load 24) and every render timed out.
  // I2 observability: how many renders took the warm shared-engine path (tune-json)
  // vs a cold per-worktree compile (code-changing strategies).
  let warmRenders = 0;
  let coldRenders = 0;

  // I5 — acceptance target: prod build > operator URL > dev fallback (perf not
  // enforced on dev, since unbundled numbers are inflated/meaningless).
  const acceptanceTarget = resolveAcceptanceTarget({
    acceptanceUrl: process.env.SITC_ACCEPTANCE_URL,
    build: process.env.SITC_ACCEPTANCE_BUILD === "1",
  });
  console.log(`• acceptance: ${acceptanceTarget.note}`);
  let preview: PreviewServer | null = null;
  // For build mode the URL only exists after the champion is built (post-sweep), so
  // it's a lazy thunk the acceptance gate resolves once at gate time.
  const acceptanceUrl =
    acceptanceTarget.mode === "build"
      ? async () => {
          const champ = await worktree.champion(runId);
          const tree = await worktree.ensureBaseWorktree(runId, champ);
          preview = await buildAndServePreview({
            worktreePath: tree,
            // Evolved-template content needs the run DB seeded with the champion
            // (operator step); perf/bundle characteristics are meaningful regardless.
            databaseUrl: process.env.SITC_PREVIEW_DATABASE_URL ?? dbUrl,
            log: (m) => console.log(`  🏗 ${m}`),
          });
          return `${preview.url}/?business=${template}`;
        }
      : acceptanceTarget.mode === "url"
        ? acceptanceTarget.url!
        : `${engineUrl}/?business=${template}`;

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    await preview?.stop().catch(() => {});
    await engines.stopAll().catch(() => {});
    await worktree.teardown(runId, {}).catch(() => {});
  };
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.once(sig, () => void cleanup().finally(() => process.exit(130)));
  }
  const indexById = Object.fromEntries(evolve.map((s) => [s.id, s.idx]));

  // lessons retrieval (DESIGN §9.2) — advisory hints into the worker prompt; degrades
  // to empty (no lessons) if the store is empty or pgvector is unavailable.
  const lessonStore = new DrizzleLessonStore();
  const lessonsFor = async (ctx: { sectionId: string; strategy: string; critique?: string }) => {
    try {
      const text = `${ctx.sectionId} ${ctx.strategy} ${ctx.critique ?? ""}`.trim();
      const hits = await retrieveLessons(lessonStore, embed, { scope: ctx.sectionId.split("#")[0], text });
      return lessonsToPromptBlock(hits);
    } catch {
      return "";
    }
  };

  // Factory so the I13 escalated pass can rebuild it with a stronger model.
  const buildMutate = (m: string) =>
    createMutateCollaborator({
      repoRoot: REPO_ROOT,
      runner: mkWorkerModel(m), // Edit/Write authorized inside authorVariant
      targetImageFor: (id: string) => targetFor[id],
      sectionTypeFor: (id: string) => id.split("#")[0], // "hero#0" → "hero"
      targetStyleFor: (id: string) => styleFor[id], // measured ground-truth CSS + imagery (I11)
      templateName: template, // worker may edit ONLY this template's JSON
      lessonsFor: lessonsDisabled ? undefined : lessonsFor, // OFF arm injects no lessons (I1 A/B)
      model: m,
    });
  const mutateCollaborator = buildMutate(model);
  const collab = {
    // I9 — scope each AI collab by call-type so cost attributes to mutate/score/judge.
    mutate: (ctx: any) => meter.scope("mutate", () => mutateCollaborator(ctx)),
    sanity: (ctx: { worktreePath: string; changedFiles: string[]; strategy: any }) =>
      sanityGate({ worktreePath: ctx.worktreePath, changedFiles: ctx.changedFiles, strategy: ctx.strategy, checks: createSanityChecks({}), templateName: template }),
    render: async (ctx: { worktreePath: string; sectionId: string; strategy: string; base: string }) => {
      // The edited JSON ALWAYS comes from the worker's own worktree (via profilePath).
      const wtTemplate = path.join(ctx.worktreePath, "templates", template, `${template}.json`);
      const chrome = ctx.sectionId === "navbar" || ctx.sectionId === "footer" ? (ctx.sectionId as "navbar" | "footer") : undefined;
      const index = chrome ? 0 : indexById[ctx.sectionId];
      // I2 — strategy-routed render path:
      //   tune-json   → component code is identical to the iteration's `base`
      //                 champion, so render through a SHARED, already-warm engine
      //                 pinned at that champion (one per champion generation, reused
      //                 across every tune-json iteration). No cold Vite compile.
      //   code edits  → render from the worker's OWN worktree engine, because the
      //                 worker's component edits live there and must be compiled.
      const jsonOnly = ctx.strategy === "tune-json";
      const engineWorktree = jsonOnly ? await worktree.ensureBaseWorktree(runId, ctx.base) : ctx.worktreePath;
      if (jsonOnly) warmRenders++; else coldRenders++;
      // Warm-up compiles the EXACT page (serialized across engines) so the
      // screenshot below doesn't race a cold Vite compile under worker concurrency.
      const warmupUrl = harnessUrl({ baseUrl: "http://127.0.0.1", business: template, index, profilePath: wtTemplate, chrome });
      const baseUrl = await engines.ensure(engineWorktree, { warmupUrl });
      const r = await renderSection({ baseUrl, business: template, index, profilePath: wtTemplate, waitForMs: 240000, chrome });
      const out = path.join(artifactsDir, "renders", `${ctx.sectionId}-${Date.now()}.png`);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, r.png);
      return { ourImg: out };
    },
    score: (ctx: { ourImg: string; targetImg: string }) => meter.scope("score", () => scoreSection(readRunner, { ourImg: ctx.ourImg, targetImg: ctx.targetImg, model })),
    judge: (ctx: { champion: string; challenger: string; target: string }) => meter.scope("judge", () => pairwiseJudge(readRunner, ctx, { model })),
    // I12 — mobile guard (opt-in): a desktop-winning challenger that introduces
    // mobile horizontal overflow vs the champion is rejected (kept invisible until
    // delivery before). Renders both at mobile (champion from its base worktree).
    ...(process.env.SITC_SCORE_MOBILE === "1"
      ? {
          guard: async (ctx: { worktreePath: string; sectionId: string; base: string }) => {
            const chrome = ctx.sectionId === "navbar" || ctx.sectionId === "footer" ? (ctx.sectionId as "navbar" | "footer") : undefined;
            const index = chrome ? 0 : indexById[ctx.sectionId];
            const overflowAt = async (tree: string) => {
              const tpl = path.join(tree, "templates", template, `${template}.json`);
              const warmupUrl = harnessUrl({ baseUrl: "http://127.0.0.1", business: template, index, profilePath: tpl, chrome });
              const baseUrl = await engines.ensure(tree, { warmupUrl });
              return measureHorizontalOverflow({ baseUrl, business: template, index, profilePath: tpl, chrome, breakpoint: MOBILE_GUARD }).catch(() => 0);
            };
            const challengerOverflowPx = await overflowAt(ctx.worktreePath);
            const championOverflowPx = await overflowAt(await worktree.ensureBaseWorktree(runId, ctx.base));
            const v = mobileGuardVerdict({ championOverflowPx, challengerOverflowPx });
            if (!v.ok) console.log(`      ⚠ mobile guard rejected ${ctx.sectionId}: ${v.reason}`);
            return v;
          },
        }
      : {}),
  };

  const initialStates = [...evolve.map((s) => s.id), ...chromeIds].map((id) => ({
    sectionId: id,
    strategy: "tune-json" as const,
    score: 0,
    threshold: 0.85,
    attempts: 0,
    locked: false,
    frozen: false,
  }));

  // Per-unit convergence tracking — drives the "loop done → manual fixes" handoff.
  const unitStats: Record<string, UnitConvergence> = {};
  for (const s of initialStates) unitStats[s.sectionId] = { sectionId: s.sectionId, promotions: 0, threshold: s.threshold };

  let result;
  try {
    result = await runFull({
    runId, store, worktree, runner: mkWorker(), owner,
    seed: { templatePath },
    targetScreenshots: Object.values(cap.screenshots),
    groundTruthStyle: cap.globalStyle, // exact measured palette/fonts/radius for the theme pass
    targetImgFor: (id) => targetFor[id],
    collab,
    initialStates,
    maxWorkers: run.maxWorkers,
    // Coverage floor (CONCLUSIONS #6): guarantee every in-play unit is attempted
    // ≥N times before budget re-rolls a peer. Default 1; override via env.
    minCoverage: process.env.SITC_MIN_COVERAGE ? Number(process.env.SITC_MIN_COVERAGE) : undefined,
    onIteration: (sectionId, r) => {
      const score = r.score ? ` score=${r.score.score.toFixed(3)}` : "";
      const reason = r.critique ? ` — ${r.critique.slice(0, 240).replace(/\s+/g, " ")}` : "";
      const files = r.changedFiles.length ? ` files=${r.changedFiles.length}` : "";
      console.log(`  · ${sectionId.padEnd(16)} ${r.outcome}${score}${files}${reason}  [${meter.line()}]`);
      // I8 — advisory strategy hint from the structured per-dimension findings.
      if (r.score?.vlm?.findings?.length) {
        const hint = suggestStrategy(r.score.vlm.findings, r.score.vlm.breakdown);
        if (hint.suggested !== "tune-json") console.log(`      ↳ hint: ${hint.suggested} — ${hint.rationale}`);
      }
      // Track convergence: promotions + best score + the latest unclosed-gap critique.
      const u = unitStats[sectionId];
      if (u) {
        if (r.outcome === "promoted") u.promotions++;
        if (r.score) u.bestScore = Math.max(u.bestScore ?? 0, r.score.score);
        if (r.outcome !== "promoted" && r.critique) u.lastCritique = r.critique;
      }
    },
    gates: {
      // build/validate are real; existing-template SSIM (I6) renders every OTHER
      // template on the run-branch champion vs the develop baseline and diffs them,
      // so a shared-component edit that regresses another business fails the gate.
      regression: createRegressionChecks({
        repoRoot: REPO_ROOT,
        ssimPairs: createRealExistingSsim({
          repoRoot: REPO_ROOT,
          runId,
          worktree,
          engines,
          excludeTemplate: template,
          outDir: path.join(artifactsDir, "regression"),
          maxTemplates: process.env.SITC_REGRESSION_MAX_TEMPLATES ? Number(process.env.SITC_REGRESSION_MAX_TEMPLATES) : undefined,
          log: (m) => console.log(`  🛡 ${m}`),
        }),
      }),
      acceptance: createAcceptanceChecks({ url: acceptanceUrl, enforcePerf: acceptanceTarget.enforcePerf }),
    },
    budget: run.budgetIterations ? { maxIterations: run.budgetIterations } : undefined,
    landing,
    worktreePool,
    model,
    });
  } catch (e) {
    await cleanup();
    throw e;
  }

  // I13 — escalated pass (opt-in): if the run converged with component-code gaps the
  // worker DECLINED (vs genuine asset/layout-primitive gaps), try ONE pass over just
  // those units with a stronger model + forced new-variant strategy (explicit
  // component authoring) before handing them to a human. Runs before cleanup so the
  // engines/worktrees are still warm.
  if (process.env.SITC_ESCALATE === "1") {
    const pre = summarizeConvergence(Object.values(unitStats));
    const plan = planEscalation(pre);
    if (pre.converged && plan.escalatable.length) {
      const escModel = process.env.SITC_ESCALATION_MODEL ?? model;
      console.log(`\n── ESCALATION — ${plan.escalatable.length} component-code gap(s), one pass @ ${escModel} (forced new-variant) ──`);
      const escMutate = buildMutate(escModel);
      const escCollab = { ...collab, mutate: (ctx: any) => meter.scope("mutate", () => escMutate(ctx)) };
      const escStates = plan.escalatable.map((f) => ({
        sectionId: f.sectionId,
        strategy: "new-variant" as const,
        score: unitStats[f.sectionId]?.bestScore ?? 0,
        threshold: unitStats[f.sectionId]?.threshold ?? 0.85,
        attempts: 0,
        locked: false,
        frozen: false,
      }));
      const esc = await runSweep({
        worktree,
        runId,
        collab: escCollab,
        targetImgFor: (id) => targetFor[id],
        initialStates: escStates,
        championImg: result.championImg ?? undefined,
        maxWorkers: Math.max(1, Math.min(plan.escalatable.length, run.maxWorkers ?? 3)),
        maxRounds: 1,
        worktreePool,
        store,
        onIteration: (sectionId, r) => {
          console.log(`  · ${sectionId.padEnd(16)} ${r.outcome}${r.score ? ` score=${r.score.score.toFixed(3)}` : ""}`);
          const u = unitStats[sectionId];
          if (u) {
            if (r.outcome === "promoted") u.promotions++;
            if (r.score) u.bestScore = Math.max(u.bestScore ?? 0, r.score.score);
            if (r.outcome !== "promoted" && r.critique) u.lastCritique = r.critique;
          }
        },
      }).catch((e) => { console.log(`  escalation errored: ${String(e).slice(0, 140)}`); return null; });
      if (esc) console.log(`  escalation: ${esc.promotions} promotion(s)${esc.promotions ? " — commit + re-run the normal loop to continue" : " — no gain; the gaps go to manual"}`);
    }
  }

  await cleanup();
  console.log(`\n✔ run #${runId} finished: status=${result.finalStatus}  thresholdReached=${result.thresholdReached}  strategies=[${result.strategiesUsed.join(",")}]`);
  console.log(`  renders: ${warmRenders} via shared champion engine (tune-json, I2) / ${coldRenders} via pooled slot engine (code-changing, I3)`);

  // I9 — real cost/ROI for this run (vs. the pre-launch estimate).
  const costSnap = meter.snapshot();
  const roi = runCostRoi(costSnap, { promotions: result.metrics?.promotions ?? 0, lockedCount: result.metrics?.lockedCount ?? 0 });
  const byLabel = Object.entries(costSnap.byLabel)
    .map(([k, v]) => `${k} $${v.costUsd.toFixed(4)}/${(v.totalTokens / 1000).toFixed(1)}k`)
    .join("  ");
  console.log(`  cost: $${costSnap.costUsd.toFixed(4)} · ${(costSnap.totalTokens / 1000).toFixed(1)}k tok · ${costSnap.calls} calls · cache-read ${(roi.cacheReadShare * 100).toFixed(0)}%`);
  console.log(`  by-call: ${byLabel || "—"}`);
  console.log(`  ROI: ${roi.usdPerPromotion != null ? `$${roi.usdPerPromotion}/promotion` : "no promotions"}  ·  ${roi.usdPerLockedSection != null ? `$${roi.usdPerLockedSection}/locked section` : "0 locked"}`);
  // I10 — is the warm authoring kit being prompt-cached across spawns? `mutate`
  // carries the big static kit, so its cache-read share is the headline signal.
  const cacheByLabel = cacheReadShareByLabel(costSnap);
  const cacheStr = Object.entries(cacheByLabel).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join("  ");
  const mutCache = cacheByLabel.mutate ?? 0;
  console.log(`  cache-read share: ${cacheStr || "—"}`);
  console.log(`  ↳ kit caching (mutate): ${mutCache >= 0.5 ? `GOOD (${(mutCache * 100).toFixed(0)}%) — warm kit reused` : mutCache > 0 ? `PARTIAL (${(mutCache * 100).toFixed(0)}%)` : "NONE — kit re-sent uncached each spawn; front-load the static prefix or run scripts/sitc-cache-probe.mts to confirm"}`);
  await fs.writeFile(path.join(artifactsDir, "cost.json"), JSON.stringify({ ...costSnap, roi, cacheReadShareByLabel: cacheByLabel }, null, 2)).catch(() => {});

  // I4 — delivery outcome + durable record (no manual cherry-pick).
  if (result.merged) console.log(`  ✅ auto-merged onto develop: ${result.merged.develop}${result.pushed ? " (pushed)" : " (local only — set SITC_DELIVERY_PUSH=1 to push)"}`);
  else console.log(`  ⏸ needs_review — branch sitc/run-${runId} kept${result.pushed ? " (pushed)" : ""}${result.prUrl ? `  PR: ${result.prUrl}` : ""}`);
  await fs
    .writeFile(
      path.join(artifactsDir, "delivery.json"),
      JSON.stringify(
        { runId, finalStatus: result.finalStatus, decision: result.delivery?.decision, merged: result.merged ?? null, pushed: !!result.pushed, prUrl: result.prUrl ?? null, reasons: result.delivery?.reasons ?? [] },
        null,
        2,
      ),
    )
    .catch(() => {});

  // I1 / §18-G — persist this run's arm metrics so the lessons A/B can compare it
  // to a run with the opposite SITC_DISABLE_LESSONS setting (scripts/sitc-lessons-ab.mts).
  if (result.metrics) {
    const arm = toArmMetrics(lessonsDisabled ? "lessons-off" : "lessons-on", result.metrics, {
      runId,
      template,
      targetUrl,
    });
    const metricsPath = path.join(artifactsDir, "metrics.json");
    await fs.writeFile(metricsPath, JSON.stringify(arm, null, 2)).catch(() => {});
    const it = Object.entries(result.metrics.iterationsToLock)
      .map(([k, v]) => `${k}=${v ?? "—"}`)
      .join(" ");
    console.log(`  metrics: locked ${result.metrics.lockedCount}/${result.metrics.sectionCount}  invocations=${result.metrics.workerInvocations}  iters-to-lock[ ${it} ]`);
    console.log(`  arm (${arm.arm}) written → ${metricsPath}`);
  }

  // Convergence handoff (DESIGN §8.1): if the run added nothing, the loop is done —
  // surface the residual gaps as a manual-fix backlog instead of running again.
  const report = summarizeConvergence(Object.values(unitStats));
  const reportMd = renderConvergenceReport(runId, report);
  const reportPath = path.join(artifactsDir, "manual-followups.md");
  await fs.writeFile(reportPath, reportMd).catch(() => {});
  if (report.converged) {
    console.log(`\n── CONVERGED — 0 promotions; the loop has nothing left to add. ──`);
    console.log(`   Next step: MANUAL fixes for the residual gaps (the loop's strategies can't reach them).`);
    for (const f of report.followUps) console.log(`   • ${f.sectionId}${f.needsCode ? " [needs code]" : ""}: ${f.gap.slice(0, 160)}`);
    console.log(`   Full backlog: ${reportPath}`);
  } else {
    console.log(`\n  ${report.promotions} promotion(s) — still improving; commit + run again before switching to manual fixes. Backlog: ${reportPath}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error("sitc-runner failed:", e); process.exit(1); });
