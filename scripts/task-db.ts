#!/usr/bin/env tsx
/**
 * CLI helper for run-tasks.sh — direct DB access without HTTP auth.
 *
 * Commands:
 *   get-pending              → JSON of oldest pending task (or empty string)
 *   set-status <id> <status> → update status
 *   set-on-hold <id>         → reads question from stdin, sets on_hold + clarification
 *   append-answer <id>       → reads answer from stdin, appends to description, sets pending
 */

import { initDb, getFirstPendingTask, getTaskById, updateTask, TASK_STATUSES } from "../packages/db/src/index.js";
import type { TaskStatus } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const [, , cmd, ...args] = process.argv;

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

async function main() {
  switch (cmd) {
    case "get-pending": {
      const task = await getFirstPendingTask();
      if (task) process.stdout.write(JSON.stringify(task));
      break;
    }

    case "set-status": {
      const [id, status] = args;
      if (!id || !status) { process.stderr.write("Usage: set-status <id> <status>\n"); process.exit(1); }
      if (!TASK_STATUSES.includes(status as TaskStatus)) {
        process.stderr.write(`Invalid status: ${status}. Valid: ${TASK_STATUSES.join(", ")}\n`);
        process.exit(1);
      }
      await updateTask(id, { status: status as TaskStatus });
      break;
    }

    case "set-on-hold": {
      const [id] = args;
      if (!id) { process.stderr.write("Usage: set-on-hold <id>  (question on stdin)\n"); process.exit(1); }
      const clarification = await readStdin();
      if (!clarification) { process.stderr.write("set-on-hold: question must be on stdin\n"); process.exit(1); }
      await updateTask(id, { status: "on_hold", clarification });
      break;
    }

    case "set-summary": {
      const [id] = args;
      if (!id) { process.stderr.write("Usage: set-summary <id>  (summary on stdin)\n"); process.exit(1); }
      const summary = await readStdin();
      if (!summary) { process.stderr.write("set-summary: summary must be on stdin\n"); process.exit(1); }
      await updateTask(id, { summary });
      break;
    }

    case "append-answer": {
      const [id] = args;
      if (!id) { process.stderr.write("Usage: append-answer <id>  (answer on stdin)\n"); process.exit(1); }
      const task = await getTaskById(id);
      if (!task) { process.stderr.write(`Task not found: ${id}\n`); process.exit(1); }
      const answer = await readStdin();
      if (!answer) { process.stderr.write("append-answer: answer must be on stdin\n"); process.exit(1); }
      await updateTask(id, {
        status: "pending",
        description: task.description + `\n\n---\nClarification: ${answer}`,
        clarification: null,
      });
      break;
    }

    default:
      process.stderr.write(`Unknown command: ${cmd}\nAvailable: get-pending, set-status, set-on-hold, set-summary, append-answer\n`);
      process.exit(1);
  }
}

main().then(() => process.exit(0)).catch((err) => { process.stderr.write(String(err) + "\n"); process.exit(1); });
