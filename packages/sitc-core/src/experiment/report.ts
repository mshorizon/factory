/**
 * Cross-run trend report (todo I31 / DESIGN §18-G).
 *
 * THE GAP THIS CLOSES: dozens of run dirs under `.sitc/runs/` and nothing
 * aggregated them — "are runs getting cheaper / converging faster?" (§18-G, the
 * feature's headline claim) was unanswerable. Pure aggregation over the per-run
 * artifacts (`metrics.json` / `cost.json` / `delivery.json`); the script
 * `scripts/sitc-report.mts` feeds it from disk.
 */
import type { RunMetrics } from "../pipeline/run.js";

export interface RunArtifacts {
  /** Run id (the `.sitc/runs/<id>` dir name). */
  runId: string;
  metrics?: (Partial<RunMetrics> & { arm?: string; template?: string; targetUrl?: string }) | null;
  cost?: {
    costUsd?: number;
    totalTokens?: number;
    calls?: number;
    roi?: { usdPerPromotion?: number | null; usdPerLockedSection?: number | null; cacheReadShare?: number };
  } | null;
  delivery?: { finalStatus?: string; decision?: string; merged?: unknown; prUrl?: string | null; reasons?: string[] } | null;
}

export interface RunsReportRow {
  runId: string;
  template: string;
  arm: string;
  locked: number | null;
  sections: number | null;
  rounds: number | null;
  invocations: number | null;
  promotions: number | null;
  costUsd: number | null;
  usdPerPromotion: number | null;
  delivery: string;
  firstReason: string;
}

export interface TemplateTrend {
  template: string;
  runs: number;
  /** Cost of the first vs latest run WITH cost data (is it getting cheaper?). */
  firstCostUsd: number | null;
  lastCostUsd: number | null;
  /** Locked share (locked/sections) first vs latest run with metrics. */
  firstLockedShare: number | null;
  lastLockedShare: number | null;
  merged: number;
}

export interface RunsReport {
  rows: RunsReportRow[];
  trends: TemplateTrend[];
  /** Run dirs with no parseable artifacts at all (telemetry landed in later runs). */
  skipped: string[];
}

const numericRunOrder = (a: string, b: string) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b);

export function aggregateRuns(artifacts: RunArtifacts[]): RunsReport {
  const skipped: string[] = [];
  const rows: RunsReportRow[] = [];
  for (const a of [...artifacts].sort((x, y) => numericRunOrder(x.runId, y.runId))) {
    if (!a.metrics && !a.cost && !a.delivery) {
      skipped.push(a.runId);
      continue;
    }
    const m = a.metrics ?? {};
    rows.push({
      runId: a.runId,
      template: m.template ?? "?",
      arm: m.arm ?? "?",
      locked: m.lockedCount ?? null,
      sections: m.sectionCount ?? null,
      rounds: m.rounds ?? null,
      invocations: m.workerInvocations ?? null,
      promotions: m.promotions ?? null,
      costUsd: a.cost?.costUsd ?? null,
      usdPerPromotion: a.cost?.roi?.usdPerPromotion ?? null,
      delivery: a.delivery ? `${a.delivery.finalStatus ?? "?"}${a.delivery.merged ? " (merged)" : a.delivery.prUrl ? " (PR)" : ""}` : "?",
      firstReason: a.delivery?.reasons?.[0]?.slice(0, 90) ?? "",
    });
  }

  const byTemplate = new Map<string, RunsReportRow[]>();
  for (const r of rows) {
    if (r.template === "?") continue;
    byTemplate.set(r.template, [...(byTemplate.get(r.template) ?? []), r]);
  }
  const trends: TemplateTrend[] = [...byTemplate.entries()].map(([template, trs]) => {
    const withCost = trs.filter((r) => r.costUsd != null);
    const withShare = trs.filter((r) => r.locked != null && r.sections);
    const share = (r: RunsReportRow) => (r.locked as number) / (r.sections as number);
    return {
      template,
      runs: trs.length,
      firstCostUsd: withCost[0]?.costUsd ?? null,
      lastCostUsd: withCost[withCost.length - 1]?.costUsd ?? null,
      firstLockedShare: withShare.length ? share(withShare[0]) : null,
      lastLockedShare: withShare.length ? share(withShare[withShare.length - 1]) : null,
      merged: trs.filter((r) => r.delivery.includes("merged")).length,
    };
  });

  return { rows, trends, skipped };
}

const usd = (n: number | null) => (n == null ? "—" : `$${n.toFixed(2)}`);
const pct = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)}%`);

/** Markdown report for the operator (also readable as plain terminal text). */
export function renderRunsReport(report: RunsReport): string {
  const rows = report.rows
    .map(
      (r) =>
        `| ${r.runId} | ${r.template} | ${r.arm} | ${r.locked ?? "—"}/${r.sections ?? "—"} | ${r.rounds ?? "—"} | ${r.invocations ?? "—"} | ${r.promotions ?? "—"} | ${usd(r.costUsd)} | ${r.usdPerPromotion == null ? "—" : `$${r.usdPerPromotion}`} | ${r.delivery} | ${r.firstReason} |`,
    )
    .join("\n");
  const trends = report.trends
    .map(
      (t) =>
        `- **${t.template}** — ${t.runs} run(s), ${t.merged} merged; cost ${usd(t.firstCostUsd)} → ${usd(t.lastCostUsd)}; locked ${pct(t.firstLockedShare)} → ${pct(t.lastLockedShare)}`,
    )
    .join("\n");
  return `# SITC — cross-run report (§18-G)

| run | template | arm | locked | rounds | invocations | promotions | cost | $/promo | delivery | first gate reason |
| --: | :-- | :-- | :-- | --: | --: | --: | --: | --: | :-- | :-- |
${rows || "| — | (no runs with artifacts) | | | | | | | | | |"}

## Per-template trend (first → latest)
${trends || "- no template has runs with metrics yet"}
${report.skipped.length ? `\n> ${report.skipped.length} run dir(s) had no artifacts (pre-telemetry runs): ${report.skipped.join(", ")}` : ""}
`;
}
