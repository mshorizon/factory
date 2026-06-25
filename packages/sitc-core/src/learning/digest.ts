/**
 * LESSONS.md digest (DESIGN §9.1).
 *
 * Human-readable, Git-reviewable view of the top lessons by confidence, grouped
 * by scope. Auto-regenerated at run end; the orchestrator writes the returned
 * string to `features/sitc/LESSONS.md`.
 */
import type { LessonRecord } from "./lesson-store.js";

export interface DigestOptions {
  /** Max lessons per scope (default 10). */
  perScope?: number;
  title?: string;
}

export function renderLessonsDigest(lessons: LessonRecord[], opts: DigestOptions = {}): string {
  const perScope = opts.perScope ?? 10;
  const active = lessons.filter((l) => !l.archived);
  const byScope = new Map<string, LessonRecord[]>();
  for (const l of active) {
    const arr = byScope.get(l.scope) ?? [];
    arr.push(l);
    byScope.set(l.scope, arr);
  }
  const scopes = [...byScope.keys()].sort();
  const out: string[] = [];
  out.push(`# ${opts.title ?? "Self-Improving Template Creator — Lessons"}`);
  out.push("");
  out.push(
    "> Auto-generated from `sitc_lessons` (DESIGN §9). Top lessons by confidence, grouped by scope. " +
      "Curate via the admin Lessons browser; do not hand-edit (regenerated each run).",
  );
  out.push("");
  out.push(`_${active.length} active lessons across ${scopes.length} scopes._`);
  for (const scope of scopes) {
    const items = (byScope.get(scope) ?? []).sort((a, b) => b.confidence - a.confidence).slice(0, perScope);
    out.push("");
    out.push(`## ${scope}`);
    out.push("");
    for (const l of items) {
      out.push(`- **(conf ${l.confidence.toFixed(2)}, ${l.wins}/${l.uses})** _${l.trigger}_ → ${l.lesson}`);
    }
  }
  out.push("");
  return out.join("\n");
}
