/**
 * Lessons WRITE-path (DESIGN §9.4, todo I15) — closes the learning loop.
 *
 * THE GAP THIS CLOSES: `distillLessons`/`dedupeLessons`/`recordUse`/`computeConfidence`
 * were exported but never called — runs only READ lessons, so the store never grew,
 * confidence never moved off 0, and the "self-improving" claim wasn't operating.
 *
 * One factory owns the full lifecycle for a run:
 *   • `lessonsFor`      — drop-in for the mutate collaborator's seam: retrieves
 *                         (traits threaded, embeddings memoized) AND remembers which
 *                         lesson ids were injected per section.
 *   • `recordIteration` — call from onIteration: attributes the outcome to the
 *                         injected lessons (recordUse → recompute confidence →
 *                         archive when disproven) and appends to the distill history.
 *                         No-ops (worker declared "already matches") attribute nothing.
 *   • `finalize`        — end-of-run distill → dedupe → insert. A duplicate proposal
 *                         is treated as independent re-derivation: evidence bump
 *                         (use+win) on the existing row instead of a new near-dupe.
 *
 * Everything degrades gracefully (advisory subsystem): store/embedding failures are
 * swallowed per-call so learning can never fail a run.
 */
import type { WorkerRunner } from "../types.js";
import { computeConfidence, shouldArchive } from "./confidence.js";
import { distillLessons, dedupeLessons, type IterationDatum } from "./distill.js";
import type { EmbedFn } from "./embed.js";
import type { LessonStore } from "./lesson-store.js";
import { retrieveLessons, lessonsToPromptBlock } from "./retrieval.js";

/** Controlled trait vocabulary — shared by capture-derived tags and the distill prompt, so the §9.2 trait pre-filter actually matches. */
export const TRAIT_VOCAB = [
  "dark",
  "light",
  "serif",
  "sans-serif",
  "rounded",
  "sharp",
  "minimal",
  "colorful",
  "image-heavy",
  "text-heavy",
] as const;

/** Relative luminance (0..1) of a #rgb/#rrggbb hex; null if unparseable. */
function hexLuminance(hex: unknown): number | null {
  if (typeof hex !== "string") return null;
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derive trait tags (from TRAIT_VOCAB) from the captured target's measured global
 * style (`captureTarget().globalStyle`). Defensive: unknown shape → [].
 */
export function traitTagsFromStyle(style: unknown): string[] {
  const s = style as Record<string, unknown> | null | undefined;
  const tags: string[] = [];
  const lum = hexLuminance(s?.bg);
  if (lum != null) tags.push(lum < 0.4 ? "dark" : "light");
  const fonts = `${s?.headingFont ?? ""} ${s?.bodyFont ?? ""}`.toLowerCase();
  if (fonts.trim()) {
    tags.push(/(?<!sans[- ])serif|garamond|playfair|georgia|lora|merriweather|cormorant/.test(fonts) ? "serif" : "sans-serif");
  }
  const r = parseFloat(String(s?.radius ?? ""));
  if (Number.isFinite(r)) tags.push(r >= 8 ? "rounded" : "sharp");
  return tags;
}

export interface LessonWritePathOpts {
  store: LessonStore;
  embed: EmbedFn;
  /** Recorded as evidenceRunId on inserted lessons. */
  runId?: number;
  /** Target trait tags (traitTagsFromStyle) — threaded into retrieval + distill. */
  designTraits?: string[];
  /** Inject retrieved lessons into the worker prompt (the A/B ON arm). Default true. When false, `lessonsFor` returns "" but outcomes/history are still recorded so the OFF arm still WRITES lessons. */
  inject?: boolean;
  topK?: number;
  model?: string;
  /** Max history items fed to the distiller (promoted + critiqued reverts first). */
  maxHistoryItems?: number;
  log?: (m: string) => void;
}

export interface DistillOutcome {
  proposed: number;
  inserted: number;
  /** Near-duplicates of existing lessons → evidence bump instead of insert. */
  merged: number;
}

export interface LessonWritePath {
  lessonsFor(ctx: { sectionId: string; strategy: string; critique?: string }): Promise<string>;
  /** Sync-friendly (fire from onIteration); pending work is awaited by finalize(). */
  recordIteration(sectionId: string, r: { outcome: string; critique?: string; score?: { score: number } }): void;
  finalize(runner: WorkerRunner, input?: { traits?: Record<string, unknown> }): Promise<DistillOutcome>;
  readonly history: IterationDatum[];
}

/**
 * Order the history for distillation: everything the model can learn from first —
 * promotions (what worked), then critiqued non-promotions (what failed and why) —
 * capped at `max` items with critiques truncated (word-boundary-safe budgeting is
 * handled item-wise in distillLessons).
 */
export function sampleHistory(history: IterationDatum[], max = 40): IterationDatum[] {
  const promoted = history.filter((h) => h.outcome === "promoted");
  const critiqued = history.filter((h) => h.outcome !== "promoted" && h.critique);
  const rest = history.filter((h) => h.outcome !== "promoted" && !h.critique);
  return [...promoted, ...critiqued, ...rest]
    .slice(0, max)
    .map((h) => ({ ...h, critique: h.critique?.slice(0, 280) }));
}

export function createLessonWritePath(opts: LessonWritePathOpts): LessonWritePath {
  const log = opts.log ?? (() => {});
  const inject = opts.inject ?? true;
  /** lesson ids injected into the LAST mutate per section — attributed exactly once. */
  const injected = new Map<string, number[]>();
  /** last strategy seen per section (lessonsFor is called per mutate). */
  const lastStrategy = new Map<string, string>();
  /** best score seen per section, for scoreDelta attribution on promote. */
  const prevScore = new Map<string, number>();
  const history: IterationDatum[] = [];
  /** async store work spawned from sync recordIteration — settled in finalize(). */
  const pending: Promise<unknown>[] = [];
  const embedCache = new Map<string, Promise<number[]>>();
  const embed: EmbedFn = (text) => {
    let hit = embedCache.get(text);
    if (!hit) {
      hit = opts.embed(text);
      embedCache.set(text, hit);
    }
    return hit;
  };

  const lessonsFor = async (ctx: { sectionId: string; strategy: string; critique?: string }): Promise<string> => {
    lastStrategy.set(ctx.sectionId, ctx.strategy);
    if (!inject) return "";
    try {
      const text = `${ctx.sectionId} ${ctx.strategy} ${ctx.critique ?? ""}`.trim();
      const hits = await retrieveLessons(
        opts.store,
        embed,
        { scope: ctx.sectionId.split("#")[0], designTraits: opts.designTraits, text },
        { topK: opts.topK },
      );
      injected.set(ctx.sectionId, hits.map((h) => h.lesson.id));
      return lessonsToPromptBlock(hits);
    } catch {
      injected.set(ctx.sectionId, []);
      return "";
    }
  };

  const recordIteration = (sectionId: string, r: { outcome: string; critique?: string; score?: { score: number } }): void => {
    const won = r.outcome === "promoted";
    const score = r.score?.score;
    const before = prevScore.get(sectionId);
    const scoreDelta = won && score != null && before != null ? score - before : undefined;
    if (won && score != null) prevScore.set(sectionId, score);
    else if (score != null && before == null) prevScore.set(sectionId, score);
    history.push({
      sectionId,
      strategy: lastStrategy.get(sectionId) ?? "unknown",
      outcome: r.outcome,
      scoreDelta,
      critique: r.critique,
    });

    // Attribute the outcome to the lessons injected into THIS mutate. A no-op means
    // the worker didn't act on anything — neither a win nor a loss for the lessons.
    const ids = injected.get(sectionId) ?? [];
    injected.delete(sectionId);
    if (!ids.length || r.outcome === "no-op") return;
    for (const id of ids) {
      pending.push(
        (async () => {
          const rec = await opts.store.recordUse(id, won);
          const confidence = computeConfidence({ uses: rec.uses, wins: rec.wins, scoreDelta: rec.scoreDelta ?? undefined });
          await opts.store.update(id, { confidence });
          if (shouldArchive(confidence, rec.uses)) {
            await opts.store.archive(id);
            log(`lesson #${id} archived (confidence ${confidence.toFixed(2)} after ${rec.uses} uses)`);
          }
        })().catch(() => undefined), // advisory — never fail the run
      );
    }
  };

  const finalize = async (runner: WorkerRunner, input?: { traits?: Record<string, unknown> }): Promise<DistillOutcome> => {
    await Promise.allSettled(pending);
    const none: DistillOutcome = { proposed: 0, inserted: 0, merged: 0 };
    if (!history.length) return none;
    const traits = input?.traits ?? (opts.designTraits?.length ? { tags: opts.designTraits } : {});
    const proposed = await distillLessons(runner, {
      traits,
      history: sampleHistory(history, opts.maxHistoryItems),
      model: opts.model,
    });
    if (!proposed.length) return none;

    const existing = await opts.store.all();
    const { fresh, duplicates } = await dedupeLessons(existing, proposed, embed);
    let inserted = 0;
    for (const p of fresh) {
      try {
        const embedding = await embed(`${p.trigger} ${p.lesson} ${p.designTraits.join(" ")}`);
        await opts.store.insert({
          scope: p.scope,
          designTraits: p.designTraits,
          trigger: p.trigger,
          lesson: p.lesson,
          embedding,
          evidenceRunId: opts.runId,
          scoreDelta: p.scoreDelta,
        });
        inserted++;
      } catch (e) {
        log(`lesson insert failed: ${String(e).slice(0, 120)}`);
      }
    }
    // A re-derived duplicate is independent evidence the existing lesson works.
    for (const d of duplicates) {
      pending.push(
        (async () => {
          const rec = await opts.store.recordUse(d.existingId, true);
          await opts.store.update(d.existingId, {
            confidence: computeConfidence({ uses: rec.uses, wins: rec.wins, scoreDelta: rec.scoreDelta ?? undefined }),
          });
        })().catch(() => undefined),
      );
    }
    await Promise.allSettled(pending);
    log(`lessons: ${proposed.length} proposed → ${inserted} inserted, ${duplicates.length} merged into existing`);
    return { proposed: proposed.length, inserted, merged: duplicates.length };
  };

  return { lessonsFor, recordIteration, finalize, history };
}
