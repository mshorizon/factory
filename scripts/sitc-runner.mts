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
import { WorktreeManager } from "../packages/sitc-core/src/orchestrator/worktree.js";
import { EngineManager } from "../packages/sitc-core/src/orchestrator/engine-manager.js";
import { defaultEmbedder, probeEmbedder } from "../packages/sitc-core/src/learning/embed.js";
import { retrieveLessons, lessonsToPromptBlock } from "../packages/sitc-core/src/learning/retrieval.js";
import { createClaudeWorker } from "../packages/sitc-core/src/claude-worker.js";
import { captureTarget } from "../packages/sitc-core/src/scorer/capture.js";
import { segmentTarget } from "../packages/sitc-core/src/steps/segment.js";
import { cropBands } from "../packages/sitc-core/src/steps/crop-bands.js";
import { alignSections, targetImageMap } from "../packages/sitc-core/src/steps/align-sections.js";
import { renderSection, harnessUrl } from "../packages/sitc-core/src/steps/render.js";
import { scoreSection } from "../packages/sitc-core/src/scorer/score.js";
import { pairwiseJudge } from "../packages/sitc-core/src/scorer/pairwise.js";
import { sanityGate } from "../packages/sitc-core/src/loop/sanity.js";
import { createMutateCollaborator } from "../packages/sitc-core/src/loop/mutate-collaborator.js";
import { createSanityChecks, createRegressionChecks, createAcceptanceChecks } from "../packages/sitc-core/src/delivery/checks.js";
import { runFull } from "../packages/sitc-core/src/pipeline/run.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL required (control DB)");
  const engineUrl = process.env.SITC_ENGINE_URL ?? "http://localhost:4321";
  const model = process.env.SITC_MODEL ?? "sonnet";
  const workerEnabled = process.env.SITC_ENABLE_WORKER === "1";
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

  console.log(`▶ run #${runId}  template=${template}  target=${targetUrl}  owner=${owner}  worker=${workerEnabled ? "LIVE" : "disabled (plan only)"}`);

  // embedder preflight (DESIGN §9.3) — confirms SITC_EMBED_CMD wiring + dim before the run
  const embed = defaultEmbedder();
  const probe = await probeEmbedder(embed);
  console.log(`• embedder: ${probe.source}  dim=${probe.dim}  ${probe.ok ? `ok (${probe.latencyMs}ms)` : `DEGRADED: ${probe.error}`}`);

  // ── target ingestion (DESIGN §4.3) ─────────────────────────────────────────
  console.log("• capturing target …");
  const cap = await captureTarget({ url: targetUrl, outDir: path.join(artifactsDir, "target") });
  const desktopShot = cap.screenshots.desktop;
  const readRunner = createClaudeWorker({ model });
  console.log("• segmenting target …");
  // raw bands; cropBands re-normalizes against the true decoded image height.
  const bands = await segmentTarget(readRunner, desktopShot, { model });
  const crops = await cropBands({ screenshotPath: desktopShot, bands, outDir: path.join(artifactsDir, "crops") });
  const cropPaths = Object.fromEntries(crops.map((c) => [c.band.index, c.path]));
  // align against the SAME normalized bands that were cropped.
  const alignment = alignSections(crops.map((c) => c.band), homeSections);
  const sectionIds = homeSections.map((s, i) => `${s.type}#${i}`);
  const targetFor = targetImageMap(alignment, sectionIds, cropPaths);

  const matched = alignment.filter((e) => e.status === "matched" && e.ourSectionIndex != null);
  console.log(`• alignment: ${matched.length} matched / ${alignment.filter((e) => e.status === "target-only").length} target-only / ${alignment.filter((e) => e.status === "ours-only").length} ours-only`);

  // sections we will evolve = matched ones that have a target crop
  const evolve = matched
    .map((e) => ({ idx: e.ourSectionIndex as number, id: sectionIds[e.ourSectionIndex as number] }))
    .filter((s) => targetFor[s.id]);

  if (!workerEnabled) {
    console.log("\n── PLAN (worker disabled) ─────────────────────────────────");
    for (const s of evolve) console.log(`  evolve ${s.id.padEnd(18)} → target crop ${path.basename(targetFor[s.id])}`);
    console.log("\nSet SITC_ENABLE_WORKER=1 to run the autonomous loop (operator action). No edits made.");
    process.exit(0);
  }

  // ── LIVE: real collaborators + runFull ──────────────────────────────────────
  // Worktrees can live outside the repo (SITC_WORKTREE_ROOT) — required when the
  // runner's filesystem copy-on-write would otherwise discard in-repo writes.
  const worktree = new WorktreeManager({ repoRoot: REPO_ROOT, worktreeRoot: process.env.SITC_WORKTREE_ROOT });
  await worktree.createRunBranch(runId);

  // Per-worktree render engine (DESIGN §4.4 fidelity fix): each challenger is
  // screenshotted through an engine launched FROM its own worktree, so edits to
  // packages/ui (extend-variant / new-variant / new-section) are actually
  // rendered. Without this the scorer judged the unchanged base. LRU-capped to
  // the worker count so we never run more engines than concurrent iterations.
  const engines = new EngineManager({
    repoRoot: REPO_ROOT,
    maxEngines: (run.maxWorkers ?? 3) + 1,
    log: (m) => console.log(`  ⚙ ${m}`),
  });

  // Reliable teardown — without this a crash/Ctrl-C leaks per-worktree astro dev
  // engines (+ their vite/esbuild children), which compounded across runs until
  // the machine saturated (load 24) and every render timed out.
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
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

  const collab = {
    mutate: createMutateCollaborator({
      repoRoot: REPO_ROOT,
      runner: createClaudeWorker({ model }), // Edit/Write authorized inside authorVariant
      targetImageFor: (id: string) => targetFor[id],
      sectionTypeFor: (id: string) => id.split("#")[0], // "hero#0" → "hero"
      lessonsFor,
      model,
    }),
    sanity: (ctx: { worktreePath: string; changedFiles: string[]; strategy: any }) =>
      sanityGate({ worktreePath: ctx.worktreePath, changedFiles: ctx.changedFiles, strategy: ctx.strategy, checks: createSanityChecks({}), templateName: template }),
    render: async (ctx: { worktreePath: string; sectionId: string }) => {
      // Render against THIS worktree's engine so the worker's component edits show.
      const wtTemplate = path.join(ctx.worktreePath, "templates", template, `${template}.json`);
      const index = indexById[ctx.sectionId];
      // Warm-up compiles the EXACT section page (serialized across engines) so the
      // screenshot below doesn't race a cold Vite compile under worker concurrency.
      const warmupUrl = harnessUrl({ baseUrl: "http://127.0.0.1", business: template, index, profilePath: wtTemplate });
      const baseUrl = await engines.ensure(ctx.worktreePath, { warmupUrl });
      const r = await renderSection({ baseUrl, business: template, index, profilePath: wtTemplate, waitForMs: 240000 });
      const out = path.join(artifactsDir, "renders", `${ctx.sectionId}-${Date.now()}.png`);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, r.png);
      return { ourImg: out };
    },
    score: (ctx: { ourImg: string; targetImg: string }) => scoreSection(readRunner, { ourImg: ctx.ourImg, targetImg: ctx.targetImg, model }),
    judge: (ctx: { champion: string; challenger: string; target: string }) => pairwiseJudge(readRunner, ctx, { model }),
  };

  const initialStates = evolve.map((s) => ({ sectionId: s.id, strategy: "tune-json" as const, score: 0, threshold: 0.85, attempts: 0, locked: false, frozen: false }));

  let result;
  try {
    result = await runFull({
    runId, store, worktree, runner: createClaudeWorker({ model }), owner,
    seed: { templatePath },
    targetScreenshots: Object.values(cap.screenshots),
    targetImgFor: (id) => targetFor[id],
    collab,
    initialStates,
    maxWorkers: run.maxWorkers,
    onIteration: (sectionId, r) => {
      const score = r.score ? ` score=${r.score.score.toFixed(3)}` : "";
      const reason = r.critique ? ` — ${r.critique.slice(0, 240).replace(/\s+/g, " ")}` : "";
      const files = r.changedFiles.length ? ` files=${r.changedFiles.length}` : "";
      console.log(`  · ${sectionId.padEnd(16)} ${r.outcome}${score}${files}${reason}`);
    },
    gates: {
      // build/validate are real; existing-template SSIM is a documented stub to wire
      // (render every existing template on the run branch vs develop, diff). See DEPLOY.md.
      regression: createRegressionChecks({ repoRoot: REPO_ROOT, ssimPairs: async () => [] }),
      acceptance: createAcceptanceChecks({ url: `${engineUrl}/?business=${template}` }),
    },
    budget: run.budgetIterations ? { maxIterations: run.budgetIterations } : undefined,
    model,
    });
  } catch (e) {
    await cleanup();
    throw e;
  }

  await cleanup();
  console.log(`\n✔ run #${runId} finished: status=${result.finalStatus}  thresholdReached=${result.thresholdReached}  strategies=[${result.strategiesUsed.join(",")}]`);
  if (result.merged) console.log(`  merged onto develop: ${result.merged.develop}`);
  process.exit(0);
}

main().catch((e) => { console.error("sitc-runner failed:", e); process.exit(1); });
