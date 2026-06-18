import { WorktreeManager } from "../packages/sitc-core/src/orchestrator/worktree.js";
import { assembleAuthoringKit } from "../packages/sitc-core/src/steps/authoring-kit.js";
import { planEdits } from "../packages/sitc-core/src/steps/author-variant.js";
import { createClaudeWorker } from "../packages/sitc-core/src/claude-worker.js";
const REPO = process.cwd();
const wt = new WorktreeManager({ repoRoot: REPO });
await wt.createRunBranch(90);
const w = await wt.addWorkerWorktree(90, "diag");
const kit = await assembleAuthoringKit({ repoRoot: w.path, sectionType: "services" });
const { plan, raw } = await planEdits(createClaudeWorker({ model:"sonnet" }), {
  kit, strategy:"tune-json", targetImage:`${REPO}/.sitc/runs/7/crops/band-3-services.png`, workdir:w.path, model:"sonnet",
});
console.log("=== RAW model output ===");
console.log(typeof raw === "string" ? raw : JSON.stringify(raw, null, 2));
console.log("=== NORMALIZED plan ===");
console.log("feasible:", plan.feasible, "| edits:", plan.edits.length, "| summary:", plan.summary);
await wt.teardown(90,{deleteBranch:true});
process.exit(0);
