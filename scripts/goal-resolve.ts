#!/usr/bin/env tsx
/**
 * Kaizen Growth bug resolver — `pnpm goal:resolve` (FR-013).
 *
 * Opens an INTERACTIVE Claude Code session (no `-p`) seeded with the current
 * accepted `bug` step, so the operator can fix it with approvals. Uses the local
 * subscription and is local-only by design (like `pnpm goal:next`). The operator
 * marks the step Resolved in the Goals tab when done — this command never does.
 *
 * Usage:
 *   DATABASE_URL=... pnpm goal:resolve
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { initDb, getActiveGoal, getCurrentStep } from "../packages/db/src/index.js";

const REPO_ROOT = resolve(process.cwd());
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

async function main() {
  initDb(DATABASE_URL);

  const goal = await getActiveGoal();
  if (!goal) {
    console.log("No active goal set. Open the Goals tab in /admin and set one first.");
    process.exit(0);
  }

  const step = await getCurrentStep(goal.id);
  if (!step || step.status !== "accepted" || step.type !== "bug") {
    console.log(
      "No accepted bug step to resolve. Accept a bug-type step in the Goals tab first, then re-run `pnpm goal:resolve`."
    );
    process.exit(0);
  }

  const seed = `You are helping resolve a bug / harder task for Hazelgrouse Studio's site factory.

NORTH-STAR GOAL: ${goal.title}

TASK${step.milestoneLabel ? ` (milestone: ${step.milestoneLabel})` : ""}:
${step.title}

WHY THIS STEP:
${step.rationale ?? "(no rationale recorded)"}

Work with me interactively: read the relevant code, propose changes, and I'll approve each
action. Follow the rules in CLAUDE.md. When we're done I'll mark this step Resolved in the
Goals tab.`;

  // Interactive: no `-p`, no `--output-format`, no `--dangerously-skip-permissions`.
  // The operator drives and approves each tool use.
  const res = spawnSync("claude", [seed], { stdio: "inherit", cwd: REPO_ROOT });
  process.exit(res.status ?? 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
