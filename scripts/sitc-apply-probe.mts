#!/usr/bin/env tsx
/**
 * Apply-phase probe — does the worker's edit path land a known-feasible,
 * unambiguous edit in THIS environment? Isolates the apply step from analyze,
 * alignment, and legit-infeasibility. Run in a plain terminal:
 *   DATABASE_URL=… pnpm tsx scripts/sitc-apply-probe.mts
 */
import { WorktreeManager } from "../packages/sitc-core/src/orchestrator/worktree.js";
import { createClaudeWorker } from "../packages/sitc-core/src/claude-worker.js";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";

const REPO = process.cwd();
const sh = (cmd: string, args: string[], cwd?: string) =>
  new Promise<string>((r) => execFile(cmd, args, { cwd, maxBuffer: 1 << 25 }, (_e, o) => r(o || "")));

const wt = new WorktreeManager({ repoRoot: REPO });
await wt.createRunBranch(900);
const w = await wt.addWorkerWorktree(900, "probe");
const file = "templates/template-sacrum/template-sacrum.json";
const target = `${REPO}/.sitc/runs/7/crops/band-3-services.png`;
const hasTarget = await fs.access(target).then(() => true).catch(() => false);

const before = (await sh("grep", ["-c", "ServicesDarkCards", `${w.path}/${file}`])).trim();
console.log(`worktree: ${w.path}`);
console.log(`ServicesDarkCards BEFORE: ${before}  (target crop present: ${hasTarget})`);

const prompt = `You are a code editor executing a fixed edit. Do NOT re-evaluate — just apply it.
Use Grep to find the exact current string in the file, then use the Edit tool to change it. Make the edit on disk now.

EDIT:
File: ${file}
Change: in the home page services section (the object with "type":"services"), change its "variant" value (currently "grid") to "ServicesDarkCards".

When done, say which file you edited.`;

const out = await createClaudeWorker({ model: "sonnet" }).run(prompt, {
  allowedTools: ["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
  workdir: w.path,
  model: "sonnet",
}).catch((e) => `ERROR: ${String(e).slice(0, 120)}`);

const after = (await sh("grep", ["-c", "ServicesDarkCards", `${w.path}/${file}`])).trim();
const status = (await sh("git", ["status", "--porcelain"], w.path)).trim();
console.log(`\nworker said: ${out.slice(0, 160)}`);
console.log(`ServicesDarkCards AFTER: ${after}`);
console.log(`git status: ${status || "(clean)"}`);
console.log(`\n${after !== before ? "✅ APPLY WORKS — edit persisted in this environment" : "❌ APPLY FAILED — no change persisted"}`);

await wt.teardown(900, { deleteBranch: true });
process.exit(0);
