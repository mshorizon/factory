#!/usr/bin/env tsx
/**
 * SITC cross-run trend report (todo I31 / DESIGN §18-G).
 *
 * Sweeps `.sitc/runs/<id>/{metrics,cost,delivery}.json` into one table + a
 * per-template trend ("are runs getting cheaper / locking more?"), printed to
 * stdout and written to `.sitc/report.md`.
 *
 * Usage: pnpm sitc:report [--dir .sitc/runs] [--out .sitc/report.md]
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { aggregateRuns, renderRunsReport, type RunArtifacts } from "../packages/sitc-core/src/experiment/report.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };

async function readJson(p: string): Promise<any | null> {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const runsDir = path.resolve(REPO_ROOT, arg("dir") ?? ".sitc/runs");
  const outPath = path.resolve(REPO_ROOT, arg("out") ?? ".sitc/report.md");
  let dirs: string[] = [];
  try {
    dirs = (await fs.readdir(runsDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    console.error(`no runs dir at ${runsDir}`);
    process.exit(1);
  }
  const artifacts: RunArtifacts[] = [];
  for (const runId of dirs) {
    const base = path.join(runsDir, runId);
    artifacts.push({
      runId,
      metrics: await readJson(path.join(base, "metrics.json")),
      cost: await readJson(path.join(base, "cost.json")),
      delivery: await readJson(path.join(base, "delivery.json")),
    });
  }
  const report = renderRunsReport(aggregateRuns(artifacts));
  console.log(report);
  await fs.writeFile(outPath, report).catch(() => {});
  console.log(`→ written to ${outPath}`);
}

main().catch((e) => { console.error("sitc-report failed:", e); process.exit(1); });
