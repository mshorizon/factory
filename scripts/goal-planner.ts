#!/usr/bin/env tsx
/**
 * Kaizen Growth planner — `pnpm goal:next`.
 *
 * Computes the single next small step toward the active north-star goal using
 * the LOCAL Claude subscription (Claude Code CLI, `claude -p`) — NO API key.
 * Runs locally in the repo root so Claude can read the architecture docs and
 * current code/git state directly (repo-aware). Writes exactly one `proposed`
 * step to the DB; the web Goals view displays it.
 *
 * This is LOCAL-ONLY by design — it will not work where `claude` is not
 * authenticated (e.g. the prod VPS).
 *
 * Usage:
 *   DATABASE_URL=... pnpm goal:next
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import {
  initDb,
  getActiveGoal,
  createGoalStep,
  getCurrentStepWithTask,
  listTasks,
} from "../packages/db/src/index.js";
import {
  BASELINE_OFF_LIMITS,
  extractJsonObject,
  validateStep,
  type PlannedStep,
} from "./lib/goal-step.js";

const REPO_ROOT = resolve(process.cwd());
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

const MAX_ATTEMPTS = 3;

function notify(msg: string) {
  // Escape backslashes and quotes: msg is model-generated and is interpolated into
  // AppleScript source, so an unescaped `"` could break out and inject script.
  const safe = msg.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  spawnSync("osascript", ["-e", `display notification "${safe}" with title "Kaizen Growth"`], {
    stdio: "ignore",
  });
}

function buildPrompt(
  goalTitle: string,
  avoidList: string | null,
  progress: string,
  corrective?: string
): string {
  const offLimits = [
    ...BASELINE_OFF_LIMITS,
    ...(avoidList
      ? avoidList
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : []),
  ]
    .map((l) => `  - ${l}`)
    .join("\n");

  return `You are a strategic advisor for Hazelgrouse Studio, a "Site Factory" that generates
SME websites from JSON. Your job: pick the SINGLE smallest next action that most advances the
operator's north-star goal — small enough to start in one short sitting, never a multi-day blob.

NORTH-STAR GOAL:
  ${goalTitle}

CURRENT PROGRESS (recent tasks from the DB):
${progress}

OFF-LIMITS — you must NEVER suggest any of these:
${offLimits}

INSTRUCTIONS:
1. Read the repo's architecture docs (CLAUDE.md, docs/adr/*) and inspect the current code/git
   state so your suggestion is grounded in what actually exists. Do NOT modify any files.
2. Propose exactly ONE next step. Classify its execution type:
   - "human": the operator does it manually (e.g. a decision, outreach the operator is willing to do).
   - "code": a small, well-scoped code change.
   - "bug": a defect or harder change needing interactive debugging.
3. Every reference in your step must point to something that actually exists (no hallucinations).
4. Output ONLY a single minified JSON object and NOTHING else — no prose, no markdown fences:
   {"title": string (<=120 chars), "type": "human"|"code"|"bug", "rationale": string, "milestoneLabel": string}
   "milestoneLabel" is the milestone this step belongs to under the north-star.${
     corrective ? `\n\nYOUR PREVIOUS OUTPUT WAS INVALID: ${corrective} Return corrected JSON only.` : ""
   }`;
}

function invokeClaude(prompt: string): string {
  // Read-only by design: the planner only needs to READ the repo and emit JSON.
  // We deliberately do NOT pass --dangerously-skip-permissions — the prompt embeds
  // task descriptions that can contain externally-sourced text, and an unsupervised
  // full-access agent would be a prompt-injection → RCE vector. Restricting to
  // read tools means any injected "modify a file" instruction is simply denied.
  const READ_ONLY_TOOLS = [
    "Read",
    "Glob",
    "Grep",
    "Bash(git log:*)",
    "Bash(git status:*)",
    "Bash(git diff:*)",
  ];
  const res = spawnSync(
    "claude",
    ["-p", prompt, "--output-format", "json", "--allowedTools", ...READ_ONLY_TOOLS],
    { encoding: "utf-8", maxBuffer: 1024 * 1024 * 20, cwd: REPO_ROOT }
  );
  if (res.status !== 0) {
    throw new Error(`claude exited ${res.status}: ${res.stderr || "(no stderr)"}`);
  }
  // `--output-format json` wraps the model text in a result envelope; fall back
  // to raw stdout if the envelope shape is unexpected.
  const raw = res.stdout ?? "";
  try {
    const env = JSON.parse(raw);
    if (env && typeof env.result === "string") return env.result;
  } catch {
    /* not an envelope — use raw */
  }
  return raw;
}

function summarizeProgress(tasks: { status: string; description: string }[]): string {
  if (tasks.length === 0) return "  (no tasks recorded yet)";
  return tasks
    .slice(0, 15)
    .map((t) => `  - [${t.status}] ${t.description.slice(0, 100)}`)
    .join("\n");
}

async function main() {
  initDb(DATABASE_URL);

  const goal = await getActiveGoal();
  if (!goal) {
    console.log(
      "No active goal set. Open the Goals tab in /admin and set a north-star goal first, then re-run `pnpm goal:next`."
    );
    process.exit(0);
  }

  // In-flight guard: refuse to propose a new step while the current step's task is still
  // running — superseding it here would orphan a task the runner is actively working.
  const cur = await getCurrentStepWithTask(goal.id);
  // Block while the task is unfinished — pending/in-progress, or on_hold (Claude asked a
  // clarifying question the operator must answer). Superseding here would orphan that task.
  if (
    cur?.task &&
    (cur.task.status === "pending" ||
      cur.task.status === "in-progress" ||
      cur.task.status === "on_hold")
  ) {
    console.log(
      `A task is still open for the current step ("${cur.step.title}", task ${cur.task.status}). ` +
        "Let it finish or answer its question (or resolve/skip the step in the Goals tab) before computing a new step."
    );
    process.exit(0);
  }

  const tasks = await listTasks();
  const progress = summarizeProgress(tasks);

  let step: PlannedStep | null = null;
  let corrective: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Computing next step (attempt ${attempt}/${MAX_ATTEMPTS})…`);
    const prompt = buildPrompt(goal.title, goal.avoidList, progress, corrective);
    let text: string;
    try {
      text = invokeClaude(prompt);
    } catch (err) {
      console.error(`claude invocation failed: ${(err as Error).message}`);
      process.exit(1);
    }
    const json = extractJsonObject(text);
    if (!json) {
      corrective = "No JSON object found in output.";
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      corrective = "Output was not valid JSON.";
      continue;
    }
    const result = validateStep(parsed);
    if (result.ok) {
      step = result.value;
      break;
    }
    corrective = result.errors.join("; ");
    console.warn(`  invalid step: ${corrective}`);
  }

  if (!step) {
    console.error(`Failed to obtain a valid step after ${MAX_ATTEMPTS} attempts. Nothing written.`);
    process.exit(1);
  }

  const saved = await createGoalStep({
    goalId: goal.id,
    title: step.title,
    type: step.type,
    rationale: step.rationale,
    milestoneLabel: step.milestoneLabel,
  });
  console.log(`\n✅ Next step (${saved.type}) under "${step.milestoneLabel}":\n   ${saved.title}\n   ${step.rationale}`);
  notify(`Next step: ${saved.title.slice(0, 60)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
