#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I11 (target reference imagery).
 * Pure summarizer — the live DOM extraction is exercised on a real capture run
 * (like the rest of scorer/capture.ts).
 *
 * Run: pnpm tsx packages/tests/sitc-asset-capture.check.mts
 *
 * Covers summarizeBandImages: aspect-ratio bucketing, full-bleed background flag,
 * foreground counts, pluralization, empty → "no prominent imagery".
 */
import { summarizeBandImages } from "../sitc-core/src/scorer/capture.js";
import type { BandImage } from "../sitc-core/src/scorer/capture.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const img = (kind: "img" | "background", ar: number): BandImage => ({ kind, src: "x", width: Math.round(ar * 100), height: 100, aspectRatio: ar, alt: "" });

console.log("summarizeBandImages");
ok(summarizeBandImages([]) === "no prominent imagery", "empty → no prominent imagery");

// aspect buckets
ok(summarizeBandImages([img("img", 1.78)]).includes("wide ~16:9"), "1.78 → wide ~16:9");
ok(summarizeBandImages([img("img", 1.33)]).includes("landscape ~4:3"), "1.33 → landscape ~4:3");
ok(summarizeBandImages([img("img", 1.0)]).includes("square ~1:1"), "1.0 → square ~1:1");
ok(summarizeBandImages([img("img", 0.75)]).includes("portrait ~3:4"), "0.75 → portrait ~3:4");

// full-bleed background flagged + placed first
{
  const s = summarizeBandImages([img("background", 1.9), img("img", 1.0), img("img", 1.0), img("img", 1.0)]);
  ok(s.startsWith("full-bleed background image (wide ~16:9)"), "background flagged first");
  ok(s.includes("3 square ~1:1 images"), "foreground count + plural");
}

// singular vs plural
ok(summarizeBandImages([img("img", 1.0)]).includes("1 square ~1:1 image") && !summarizeBandImages([img("img", 1.0)]).includes("images"), "singular for 1");

// mixed buckets
{
  const s = summarizeBandImages([img("img", 1.78), img("img", 1.0)]);
  ok(s.includes("1 wide ~16:9 image") && s.includes("1 square ~1:1 image"), "mixed buckets both reported");
}

// only-background (no foreground) still summarized
ok(summarizeBandImages([img("background", 1.0)]) === "full-bleed background image (square ~1:1)", "background-only summary");

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
