#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I15 (lessons WRITE-path).
 * InMemoryLessonStore + hashingEmbedder + a fake WorkerRunner — no model, no DB.
 *
 * Run: pnpm tsx packages/tests/sitc-lesson-write-path.check.mts
 *
 * Covers:
 *   A. traitTagsFromStyle — dark/light, serif/sans, rounded/sharp, garbage-safe.
 *   B. sampleHistory + serializeHistory — informative-first ordering, item-boundary
 *      truncation (every emitted line parses as JSON).
 *   C. Write-path lifecycle — retrieval injects + remembers ids; recordIteration
 *      attributes won/lost (recordUse → confidence) and skips no-ops; a disproven
 *      lesson archives; the OFF arm injects nothing but still records history.
 *   D. finalize — distill → dedupe → insert (fresh embedded + evidenceRunId) and
 *      duplicate → evidence bump on the existing row, no near-dupe insert.
 *   E. Store candidates — trait-less lessons are wildcards (not filtered out by a
 *      trait-carrying query).
 */
import { createLessonWritePath, traitTagsFromStyle, sampleHistory } from "../sitc-core/src/learning/write-path.js";
import { serializeHistory, type IterationDatum } from "../sitc-core/src/learning/distill.js";
import { InMemoryLessonStore } from "../sitc-core/src/learning/lesson-store.js";
import { hashingEmbedder } from "../sitc-core/src/learning/embed.js";
import type { WorkerRunner } from "../sitc-core/src/types.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const embed = hashingEmbedder();
const fakeRunner = (lessons: unknown[]): WorkerRunner => ({
  run: async () => "",
  runJson: async <T,>() => ({ lessons }) as T,
});

// ── A. traitTagsFromStyle ────────────────────────────────────────────────────
console.log("A. traitTagsFromStyle");
{
  const dark = traitTagsFromStyle({ bg: "#111827", headingFont: "Playfair Display", bodyFont: "Lora", radius: "12px" });
  ok(dark.includes("dark"), "near-black bg → dark");
  ok(dark.includes("serif"), "Playfair/Lora → serif");
  ok(dark.includes("rounded"), "12px radius → rounded");
  const light = traitTagsFromStyle({ bg: "#ffffff", headingFont: "Inter, sans-serif", bodyFont: "Inter", radius: "2px" });
  ok(light.includes("light") && light.includes("sans-serif") && light.includes("sharp"), "white/Inter/2px → light+sans-serif+sharp");
  ok(traitTagsFromStyle(null).length === 0, "null style → []");
  ok(traitTagsFromStyle({ bg: "oklch(0.2 0 0)", radius: "huh" }).length === 0, "unparseable bg/radius → []");
}

// ── B. sampleHistory + serializeHistory ──────────────────────────────────────
console.log("B. sampleHistory + serializeHistory");
{
  const hist: IterationDatum[] = [
    { sectionId: "a#0", strategy: "tune-json", outcome: "reverted", critique: "x".repeat(500) },
    { sectionId: "b#1", strategy: "tune-json", outcome: "no-op" },
    { sectionId: "c#2", strategy: "extend-variant", outcome: "promoted", scoreDelta: 0.1 },
  ];
  const s = sampleHistory(hist, 2);
  ok(s.length === 2 && s[0].outcome === "promoted", "promoted first, cap respected");
  ok(s[1].critique!.length === 280, "critique truncated to 280");
  const many: IterationDatum[] = Array.from({ length: 100 }, (_, i) => ({ sectionId: `s#${i}`, strategy: "tune-json", outcome: "reverted", critique: `critique ${i} ${"y".repeat(150)}` }));
  const out = serializeHistory(many, 2000);
  ok(out.length <= 2000, "budget respected");
  const lines = out.split("\n");
  ok(lines.length > 1 && lines.every((l) => { try { JSON.parse(l); return true; } catch { return false; } }), "every emitted line is valid JSON (no mid-token truncation)");
}

// ── C. lifecycle: inject → attribute → archive ───────────────────────────────
console.log("C. write-path lifecycle");
{
  const store = new InMemoryLessonStore();
  const seeded = await store.insert({ scope: "hero", designTraits: ["dark"], trigger: "t", lesson: "use dark hero overlays", embedding: await embed("use dark hero overlays") });
  const wp = createLessonWritePath({ store, embed, runId: 99, designTraits: ["dark"] });

  const block = await wp.lessonsFor({ sectionId: "hero#0", strategy: "tune-json", critique: "too bright" });
  ok(block.includes("use dark hero overlays"), "retrieval injects the seeded lesson");

  wp.recordIteration("hero#0", { outcome: "promoted", score: { score: 0.8 } });
  await new Promise((r) => setTimeout(r, 10));
  let rec = (await store.all())[0];
  ok(rec.uses === 1 && rec.wins === 1, "promoted → recordUse(won)");
  ok(rec.confidence > 0, "confidence recomputed off 0");

  // outcome with no preceding injection attributes nothing
  wp.recordIteration("hero#0", { outcome: "reverted", critique: "worse" });
  await new Promise((r) => setTimeout(r, 10));
  rec = (await store.all())[0];
  ok(rec.uses === 1, "no injection since last attribution → no double-count");

  // a no-op iteration doesn't blame the lessons
  await wp.lessonsFor({ sectionId: "hero#0", strategy: "tune-json" });
  wp.recordIteration("hero#0", { outcome: "no-op" });
  await new Promise((r) => setTimeout(r, 10));
  ok((await store.all())[0].uses === 1, "no-op → no attribution");

  // three losses → confidence < floor → archived
  for (let i = 0; i < 3; i++) {
    await wp.lessonsFor({ sectionId: "hero#0", strategy: "tune-json" });
    wp.recordIteration("hero#0", { outcome: "reverted" });
  }
  await new Promise((r) => setTimeout(r, 20));
  const after = await store.all(true);
  ok(after[0].uses === 4 && after[0].wins === 1, "losses recorded");
  ok(after[0].archived, "disproven lesson archived (decay)");
  ok(wp.history.length === 6, "all iterations recorded in history");
  ok(seeded.id === after[0].id, "same row throughout");
}

// OFF arm: no injection, history still recorded
{
  const store = new InMemoryLessonStore();
  await store.insert({ scope: "hero", trigger: "t", lesson: "l", embedding: await embed("l") });
  const wp = createLessonWritePath({ store, embed, inject: false });
  const block = await wp.lessonsFor({ sectionId: "hero#0", strategy: "tune-json" });
  wp.recordIteration("hero#0", { outcome: "promoted", score: { score: 0.9 } });
  await new Promise((r) => setTimeout(r, 10));
  ok(block === "", "OFF arm injects nothing");
  ok((await store.all())[0].uses === 0, "OFF arm attributes nothing");
  ok(wp.history.length === 1 && wp.history[0].strategy === "tune-json", "OFF arm still records history + strategy");
}

// ── D. finalize: distill → dedupe → insert/merge ─────────────────────────────
console.log("D. finalize");
{
  const store = new InMemoryLessonStore();
  const existingText = "match the target's accent color exactly using measured hex";
  await store.insert({ scope: "color", designTraits: ["dark"], trigger: "accent mismatch", lesson: existingText, embedding: await embed(`accent mismatch ${existingText} dark`) });

  const wp = createLessonWritePath({ store, embed, runId: 42, designTraits: ["dark"] });
  wp.recordIteration("hero#0", { outcome: "promoted", score: { score: 0.9 }, critique: "good" });

  const runner = fakeRunner([
    // duplicate of the existing row (same embedded text → cosine 1)
    { scope: "color", designTraits: ["dark"], trigger: "accent mismatch", lesson: existingText, scoreDelta: 0.05 },
    // genuinely fresh
    { scope: "hero", designTraits: ["dark", "serif"], trigger: "flat hero on editorial designs", lesson: "prefer serif display headings with a tight measure", scoreDelta: 0.1 },
  ]);
  const out = await wp.finalize(runner, { traits: { bg: "#111" } });
  ok(out.proposed === 2 && out.inserted === 1 && out.merged === 1, `distill outcome proposed=2/inserted=1/merged=1 (got ${JSON.stringify(out)})`);
  const all = await store.all();
  ok(all.length === 2, "no near-duplicate row added");
  const freshRow = all.find((l) => l.scope === "hero")!;
  ok(!!freshRow.embedding && freshRow.evidenceRunId === 42, "fresh lesson embedded + evidenceRunId stamped");
  const merged = all.find((l) => l.scope === "color")!;
  ok(merged.uses === 1 && merged.wins === 1 && merged.confidence > 0, "duplicate → evidence bump on existing row");

  // empty history → no distill call
  const wp2 = createLessonWritePath({ store, embed });
  const out2 = await wp2.finalize(fakeRunner([{ scope: "x", designTraits: [], trigger: "t", lesson: "l" }]));
  ok(out2.proposed === 0 && out2.inserted === 0, "empty history → distill skipped");

  // store failure is swallowed (advisory)
  const broken = new InMemoryLessonStore();
  (broken as any).all = async () => { throw new Error("pg down"); };
  const wp3 = createLessonWritePath({ store: broken, embed });
  wp3.recordIteration("a#0", { outcome: "promoted" });
  let threw = false;
  try { await wp3.finalize(fakeRunner([{ scope: "x", designTraits: [], trigger: "t", lesson: "l" }])); } catch { threw = true; }
  ok(threw, "finalize propagates store errors to the caller (runner catches + logs)");
}

// ── E. trait-less lessons are wildcards ──────────────────────────────────────
console.log("E. candidates wildcard");
{
  const store = new InMemoryLessonStore();
  await store.insert({ scope: "hero", designTraits: [], trigger: "t", lesson: "general hero advice" });
  await store.insert({ scope: "hero", designTraits: ["light"], trigger: "t", lesson: "light-only advice" });
  const c = await store.candidates({ scope: "hero", designTraits: ["dark"] });
  ok(c.some((l) => l.lesson === "general hero advice"), "trait-less lesson survives a trait-filtered query");
  ok(!c.some((l) => l.lesson === "light-only advice"), "non-overlapping traits still filtered");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
