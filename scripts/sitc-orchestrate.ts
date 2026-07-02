/**
 * SITC orchestrator runner (Phase 1 control-plane demo / smoke test).
 *
 * The "consumer" side of the admin control plane: drives a run through the state
 * machine against the LIVE control DB using a STUB worker (no AI, no renders).
 * Proves UI → DB → orchestrator → state machine → DB → UI end-to-end.
 *
 * Run locally (talks to the VPS control DB):
 *   DATABASE_URL="postgresql://…/hazelgrouse-db" \
 *     pnpm tsx scripts/sitc-orchestrate.ts [--new] [--run <id>] [--iterations N] [--clear-commands] [--owner local]
 *
 * Defaults to creating a fresh demo run. NOTE: a real run needs the live
 * collaborators wired (gate 3) — this stub only exercises the control plane.
 */
// Import workspace SOURCE via relative paths (repo convention for scripts, e.g.
// strategic-scheduler.ts) + only the specific modules needed — avoids pulling
// @mshorizon/schema / playwright through the package barrels.
import { initDb } from "../packages/db/src/client.js";
import { DrizzleRunStore } from "../packages/db/src/sitc-store.js";
import { Orchestrator, type SectionWorker } from "../packages/sitc-core/src/orchestrator/orchestrator.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required (point it at the control DB)");
  initDb(url);
  const store = new DrizzleRunStore();

  const owner = arg("owner") ?? "local";
  const iterations = Number(arg("iterations") ?? 6);

  // resolve target run: --run <id>, else create a fresh demo run
  let runId: number;
  const runArg = arg("run");
  if (runArg && !has("new")) {
    runId = Number(runArg);
    const run = await store.getRun(runId);
    if (!run) throw new Error(`run ${runId} not found`);
    if (run.budgetIterations == null) await store.updateRun(runId, { budgetIterations: iterations });
    console.log(`▶ targeting existing run #${runId} (${run.templateName}, status=${run.status})`);
  } else {
    const run = await store.createRun({
      templateName: "template-demo",
      targetUrl: "https://example.com/",
      budgetIterations: iterations,
    });
    runId = run.id;
    console.log(`▶ created fresh demo run #${runId} (budget ${iterations} iterations)`);
  }

  // optionally clear queued commands (e.g. stale test clicks) so the demo runs clean
  if (has("clear-commands")) {
    let cleared = 0;
    for (let c = await store.nextCommand(runId); c; c = await store.nextCommand(runId)) {
      await store.consumeCommand(c.id);
      cleared++;
    }
    if (cleared) console.log(`  cleared ${cleared} queued command(s)`);
  }

  // STUB worker — climbs the score, no real work. Logs each iteration.
  const worker: SectionWorker = async ({ iterationNo }) => {
    const sectionId = `section-${((iterationNo - 1) % 4) + 1}`;
    const score = Math.min(0.95, 0.5 + 0.08 * iterationNo);
    console.log(`  · iteration ${iterationNo} → ${sectionId} score ${score.toFixed(2)} (stub)`);
    return { sectionId, score, outcome: "promoted", snapshotCommit: `stub-${iterationNo}` };
  };

  const orch = new Orchestrator({ store, worker, owner, leaseTtlMs: 60_000 });
  console.log(`▶ orchestrating run #${runId} as owner="${owner}" …`);
  const outcome = await orch.run(runId);

  const final = await store.getRun(runId);
  const last = await store.lastIteration(runId);
  console.log(`\n✔ done: status=${final?.status} reason=${outcome.reason} iterationsRun=${outcome.iterationsRun} lastIteration=${last?.iterationNo ?? 0}`);
  console.log(`  refresh /admin/template-creator → run #${runId} should now reflect this.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("orchestrate failed:", e);
  process.exit(1);
});
