/**
 * Self-Improving Template Creator — control-plane schema (DESIGN §10).
 *
 * Lives in the main control DB (run-scoped RENDER DBs are separate, §13.2).
 * `sitc_lessons.embedding` requires the pgvector extension.
 *
 * NOTE: not yet pushed to any DB. Apply with `drizzle-kit push` against the
 * control DB only after review (it issues DDL against production Postgres).
 */
import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  real,
  vector,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const SITC_RUN_STATUSES = [
  "idle",
  "running",
  "awaiting_approval",
  "paused",
  "done",
  "needs_review",
  "aborted",
] as const;
export type SitcRunStatus = (typeof SITC_RUN_STATUSES)[number];

export const SITC_STRATEGIES = [
  "tune-json",
  "extend-variant",
  "new-variant",
  "new-section",
] as const;
export type SitcStrategy = (typeof SITC_STRATEGIES)[number];

export const SITC_SECTION_OUTCOMES = ["promoted", "reverted", "sanity_failed"] as const;
export type SitcSectionOutcome = (typeof SITC_SECTION_OUTCOMES)[number];

/** Embedding dimension — adjust to the chosen embedding model (Phase 6). */
export const SITC_EMBED_DIM = 1536;

export const sitcRuns = pgTable("sitc_runs", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull(),
  targetUrl: text("target_url").notNull(),
  status: text("status").$type<SitcRunStatus>().notNull().default("idle"),
  modelVersion: text("model_version"),
  promptVersion: text("prompt_version"),
  budgetTokens: integer("budget_tokens"),
  budgetSeconds: integer("budget_seconds"),
  budgetIterations: integer("budget_iterations"),
  weights: jsonb("weights").$type<Record<string, number>>().default({}),
  maxWorkers: integer("max_workers").notNull().default(3),
  scoredBreakpoints: jsonb("scored_breakpoints").$type<unknown[]>().default([]),
  themeLocked: boolean("theme_locked").notNull().default(false),
  atomsLocked: boolean("atoms_locked").notNull().default(false),
  branch: text("branch"),
  runDbUrl: text("run_db_url"),
  targetManifest: jsonb("target_manifest"),
  acceptanceReport: jsonb("acceptance_report"),
  /** Owner host holding the single-owner lease (VPS|local). */
  lockedBy: text("locked_by"),
  leaseExpiresAt: timestamp("lease_expires_at"),
  cleanedUp: boolean("cleaned_up").notNull().default(false),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  bestOverallScore: real("best_overall_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sitcIterations = pgTable(
  "sitc_iterations",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id").notNull(),
    iterationNo: integer("iteration_no").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    notes: text("notes"),
  },
  (t) => ({
    runIdx: index("sitc_iter_run_idx").on(t.runId),
    runIterUnique: uniqueIndex("sitc_iter_run_no_uq").on(t.runId, t.iterationNo),
  }),
);

export const sitcSectionScores = pgTable(
  "sitc_section_scores",
  {
    id: serial("id").primaryKey(),
    iterationId: integer("iteration_id").notNull(),
    sectionId: text("section_id").notNull(),
    strategy: text("strategy").$type<SitcStrategy>(),
    outcome: text("outcome").$type<SitcSectionOutcome>(),
    vlmScore: real("vlm_score"),
    pixelScore: real("pixel_score"),
    score: real("score"),
    abVerdict: text("ab_verdict"),
    isChampion: boolean("is_champion").notNull().default(false),
    critique: text("critique"),
    screenshotOurs: text("screenshot_ours"),
    screenshotTarget: text("screenshot_target"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ iterIdx: index("sitc_score_iter_idx").on(t.iterationId) }),
);

export const sitcChampions = pgTable(
  "sitc_champions",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id").notNull(),
    sectionId: text("section_id").notNull(),
    score: real("score"),
    snapshotCommit: text("snapshot_commit"),
    variantName: text("variant_name"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({ runSectionUnique: uniqueIndex("sitc_champ_run_section_uq").on(t.runId, t.sectionId) }),
);

export const sitcCommands = pgTable(
  "sitc_commands",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id").notNull(),
    type: text("type").notNull(), // pause|resume|abort|approve|approve_merge|set_max_workers
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    consumedAt: timestamp("consumed_at"),
  },
  (t) => ({ runUnconsumedIdx: index("sitc_cmd_run_idx").on(t.runId, t.consumedAt) }),
);

export const sitcLessons = pgTable(
  "sitc_lessons",
  {
    id: serial("id").primaryKey(),
    scope: text("scope").notNull(),
    designTraits: jsonb("design_traits").$type<string[]>().default([]),
    trigger: text("trigger").notNull(),
    lesson: text("lesson").notNull(),
    embedding: vector("embedding", { dimensions: SITC_EMBED_DIM }),
    evidenceRunId: integer("evidence_run_id"),
    scoreDelta: real("score_delta"),
    confidence: real("confidence").notNull().default(0),
    uses: integer("uses").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    archived: boolean("archived").notNull().default(false),
  },
  (t) => ({ scopeIdx: index("sitc_lessons_scope_idx").on(t.scope, t.archived) }),
);

export const sitcJudgeCalibration = pgTable("sitc_judge_calibration", {
  id: serial("id").primaryKey(),
  championImg: text("champion_img").notNull(),
  challengerImg: text("challenger_img").notNull(),
  targetImg: text("target_img").notNull(),
  humanAnswer: text("human_answer").notNull(), // "champion" | "challenger"
  judgeAnswer: text("judge_answer"),
  agreed: boolean("agreed"),
  checkedAt: timestamp("checked_at"),
});

export type SitcRun = typeof sitcRuns.$inferSelect;
export type NewSitcRun = typeof sitcRuns.$inferInsert;
export type SitcIteration = typeof sitcIterations.$inferSelect;
export type NewSitcIteration = typeof sitcIterations.$inferInsert;
export type SitcSectionScore = typeof sitcSectionScores.$inferSelect;
export type NewSitcSectionScore = typeof sitcSectionScores.$inferInsert;
export type SitcChampion = typeof sitcChampions.$inferSelect;
export type NewSitcChampion = typeof sitcChampions.$inferInsert;
export type SitcCommand = typeof sitcCommands.$inferSelect;
export type NewSitcCommand = typeof sitcCommands.$inferInsert;
export type SitcLesson = typeof sitcLessons.$inferSelect;
export type NewSitcLesson = typeof sitcLessons.$inferInsert;
export type SitcJudgeCalibration = typeof sitcJudgeCalibration.$inferSelect;
export type NewSitcJudgeCalibration = typeof sitcJudgeCalibration.$inferInsert;
