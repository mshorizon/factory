#!/usr/bin/env tsx
/**
 * Strategic Scheduler — calls Anthropic API to generate 5 strategic suggestions
 * based on current project context (CONTEXT.md, recent tasks, ADRs).
 *
 * Idempotent: running twice on the same day does nothing if suggestions already exist.
 *
 * Usage:
 *   DATABASE_URL=... ANTHROPIC_API_KEY=... tsx scripts/strategic-scheduler.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { writeFileSync } from "node:fs";

import {
  initDb,
  getPendingStrategicSuggestions,
  countTodaySuggestions,
  createStrategicSuggestion,
  getDb,
} from "../packages/db/src/index.js";
import { tasks } from "../packages/db/src/schema.js";
import { eq, desc } from "drizzle-orm";

const ROOT = resolve(process.cwd());
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY is not set");
  process.exit(1);
}

initDb(DATABASE_URL);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── helpers ──────────────────────────────────────────────────────────────────

function readContext(): string {
  return readFileSync(join(ROOT, "CONTEXT.md"), "utf-8");
}

function readAdrTitles(): { id: string; title: string; status: string }[] {
  const adrDir = join(ROOT, "docs", "adr");
  let files: string[];
  try {
    files = readdirSync(adrDir).filter((f) => f.match(/^\d{4}-.+\.md$/));
  } catch {
    return [];
  }

  return files.map((file) => {
    const content = readFileSync(join(adrDir, file), "utf-8");
    const titleMatch = content.match(/^# ADR-\d+: (.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\* (\w+)/);
    return {
      id: file.replace(/\.md$/, ""),
      title: titleMatch?.[1] ?? file,
      status: statusMatch?.[1] ?? "unknown",
    };
  });
}

async function getRecentDoneTasks(limit = 30) {
  const db = getDb();
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "done"))
    .orderBy(desc(tasks.updatedAt))
    .limit(limit);
  return rows;
}

function updateContextMetrics(pendingCount: number) {
  const contextPath = join(ROOT, "CONTEXT.md");
  let content = readFileSync(contextPath, "utf-8");

  const metricLine = `- Open strategic suggestions: ${pendingCount}`;
  const existingMetricRegex = /^- Open strategic suggestions: \d+$/m;

  if (existingMetricRegex.test(content)) {
    content = content.replace(existingMetricRegex, metricLine);
  } else {
    // Append to ## 7. METRICS section
    content = content.replace(
      /(## 7\. METRICS[\s\S]*?)(\n---|\n## |\s*$)/,
      `$1\n${metricLine}$2`
    );
  }

  writeFileSync(contextPath, content, "utf-8");
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Idempotency check: don't run twice on the same day
  const todayCount = await countTodaySuggestions();
  if (todayCount > 0) {
    console.log(`Scheduler already ran today (${todayCount} suggestions exist). Skipping.`);
    process.exit(0);
  }

  const contextMd = readContext();
  const adrs = readAdrTitles();
  const recentTasks = await getRecentDoneTasks(30);
  const pendingSuggestions = await getPendingStrategicSuggestions();

  const adrList = adrs
    .map((a) => `- ${a.id}: ${a.title} [${a.status}]`)
    .join("\n");

  const taskList = recentTasks
    .map((t) => `- [${t.status}] ${t.domain}/${t.location}: ${t.description.slice(0, 120)}`)
    .join("\n");

  const pendingList = pendingSuggestions
    .map((s) => `- ${s.title} (${s.category}, priority ${s.priority})`)
    .join("\n");

  const prompt = `You are a strategic advisor for a web agency called Hazelgrouse Studio that builds a multi-tenant "Site Factory" for local businesses.

Below is the current project state:

## CONTEXT.md
${contextMd}

## Architecture Decision Records (ADRs)
${adrList || "None yet"}

## Recent completed tasks (last 30)
${taskList || "None"}

## Already pending strategic suggestions (do NOT duplicate these)
${pendingList || "None"}

---

Generate exactly 5 strategic suggestions that will move this project forward the most right now.
Balance across: technical debt, new features, marketing, client acquisition, and infrastructure.
Consider the project phase (go-to-market prep), current active templates, and what logical next steps are.

Return ONLY a valid JSON array with no preamble, no markdown, no backticks. Each element:
{
  "title": "short imperative title (max 60 chars)",
  "rationale": "1-2 sentences on why this is worth doing now",
  "category": "tech_debt" | "feature" | "marketing" | "client_acquisition" | "infrastructure",
  "priority": 1-5,
  "effort": "s" | "m" | "l" | "xl"
}`;

  console.log("Calling Anthropic API...");

  let responseText: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    responseText = block.text.trim();
  } catch (err) {
    console.error("Anthropic API call failed:", err);
    process.exit(1);
  }

  let suggestions: {
    title: string;
    rationale: string;
    category: string;
    priority: number;
    effort: string;
  }[];

  try {
    suggestions = JSON.parse(responseText);
    if (!Array.isArray(suggestions)) throw new Error("Response is not an array");
  } catch (err) {
    console.error("Failed to parse API response as JSON:");
    console.error(responseText);
    process.exit(1);
  }

  let inserted = 0;
  for (const s of suggestions) {
    try {
      await createStrategicSuggestion({
        title: s.title,
        rationale: s.rationale,
        category: s.category,
        priority: s.priority,
        effort: s.effort,
        status: "pending",
        createdBy: "claude_scheduler",
      });
      inserted++;
    } catch (err) {
      console.error(`Failed to insert suggestion "${s.title}":`, err);
    }
  }

  console.log(`Inserted ${inserted} strategic suggestions.`);

  // Update CONTEXT.md metrics
  const totalPending = (await getPendingStrategicSuggestions()).length;
  updateContextMetrics(totalPending);
  console.log(`CONTEXT.md updated: ${totalPending} open suggestions.`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
