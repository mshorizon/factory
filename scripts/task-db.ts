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

import { initDb, getFirstPendingTask, updateTask, TASK_STATUSES } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const [, , cmd, ...args] = process.argv;

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
    // If stdin is a TTY (no pipe), resolve immediately
    if (process.stdin.isTTY) resolve("");
  });
}

switch (cmd) {
  case "get-pending": {
    const task = await getFirstPendingTask();
    if (task) {
      process.stdout.write(JSON.stringify(task));
    }
    // empty output = no pending tasks
    break;
  }

  case "set-status": {
    const [id, status] = args;
    if (!id || !status) {
      process.stderr.write("Usage: set-status <id> <status>\n");
      process.exit(1);
    }
    if (!TASK_STATUSES.includes(status as any)) {
      process.stderr.write(`Invalid status: ${status}. Valid: ${TASK_STATUSES.join(", ")}\n`);
      process.exit(1);
    }
    await updateTask(id, { status: status as any });
    break;
  }

  case "set-on-hold": {
    const [id] = args;
    if (!id) {
      process.stderr.write("Usage: set-on-hold <id>  (question on stdin)\n");
      process.exit(1);
    }
    const clarification = await readStdin();
    if (!clarification) {
      process.stderr.write("set-on-hold: question must be provided on stdin\n");
      process.exit(1);
    }
    await updateTask(id, { status: "on_hold", clarification });
    break;
  }

  case "append-answer": {
    const [id] = args;
    if (!id) {
      process.stderr.write("Usage: append-answer <id>  (answer on stdin)\n");
      process.exit(1);
    }
    // Re-fetch to get current description
    const { getTaskById } = await import("../packages/db/src/index.js");
    const task = await getTaskById(id);
    if (!task) {
      process.stderr.write(`Task not found: ${id}\n`);
      process.exit(1);
    }
    const answer = await readStdin();
    if (!answer) {
      process.stderr.write("append-answer: answer must be provided on stdin\n");
      process.exit(1);
    }
    const updatedDescription = task.description + `\n\n---\nClarification: ${answer}`;
    await updateTask(id, {
      status: "pending",
      description: updatedDescription,
      clarification: null,
    });
    break;
  }

  default: {
    process.stderr.write(
      `Unknown command: ${cmd}\nAvailable: get-pending, set-status, set-on-hold, append-answer\n`
    );
    process.exit(1);
  }
}

process.exit(0);
