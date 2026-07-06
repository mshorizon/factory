/**
 * Target-context assembly (todo I33 — extracted from scripts/sitc-runner.mts).
 *
 * Pure mapping from the ingestion outputs (capture → crop → align) to the maps
 * the run consumes: target crop per unit, measured ground-truth style string per
 * unit, the global chrome units (navbar/footer), and the evolve list. This lived
 * as ~60 untested lines in the runner; here it's deterministic and unit-checked.
 * IO (capturing, cropping, rendering the navbar crop) stays in the runner.
 */
import type { BandImage, StyleProfile } from "../scorer/capture.js";
import { summarizeBandImages } from "../scorer/capture.js";
import type { AlignmentMap } from "../types.js";
import { targetImageMap } from "./align-sections.js";

/** Render a measured per-band style (capture.ts StyleProfile) as the worker's ground-truth prompt line. */
export function fmtMeasuredStyle(s: StyleProfile | null | undefined): string {
  if (!s) return "";
  return [
    `page/section background ${s.bg}`,
    `body text ${s.text}`,
    `brand/accent color ${s.accent}`,
    `heading font "${s.headingFont}"`,
    `body font "${s.bodyFont}"`,
    `corner radius ${s.radius}`,
    s.card ? `cards: background ${s.card.bg}, border ${s.card.border}` : "",
    s.button ? `buttons: background ${s.button.bg}, text ${s.button.text}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Style + imagery-shape (I11) prompt line for one band. */
export function bandStyleLine(style: StyleProfile | null | undefined, images?: BandImage[] | null): string {
  let s = fmtMeasuredStyle(style);
  if (images?.length) s += (s ? "; " : "") + `imagery: ${summarizeBandImages(images)}`;
  return s;
}

export interface IngestCrop {
  band: { index: number; style?: StyleProfile | null; images?: BandImage[] | null };
  path: string;
}

export interface TargetContextInput {
  crops: IngestCrop[];
  alignment: AlignmentMap;
  homeSections: Array<{ type: string }>;
  /** Rendered navbar crop + its measured band (null/absent → no navbar unit). */
  navbar?: { cropPath: string; style?: StyleProfile | null; images?: BandImage[] | null } | null;
}

export interface TargetContext {
  /** Unit ids in evolution order: matched page sections, then chrome units. */
  sectionIds: string[];
  /** Target crop path per unit id (page sections + chrome). */
  targetFor: Record<string, string>;
  /** Measured ground-truth style line per unit id. */
  styleFor: Record<string, string>;
  /** Chrome units in play ("navbar" / "footer"). */
  chromeIds: string[];
  /** Matched page sections with their home-page index. */
  evolve: Array<{ idx: number; id: string }>;
  /** The target-only band used as the footer crop (last one), if any. */
  footerBandIdx: number | null;
}

export function buildTargetContext(input: TargetContextInput): TargetContext {
  const sectionIds = input.homeSections.map((s, i) => `${s.type}#${i}`);
  const cropPaths: Record<number, string> = Object.fromEntries(input.crops.map((c) => [c.band.index, c.path]));
  const targetFor = targetImageMap(input.alignment, sectionIds, cropPaths);

  // Ground-truth styling per matched section (band style → our section id).
  const styleByBand: Record<number, string> = {};
  for (const c of input.crops) {
    const s = bandStyleLine(c.band.style, c.band.images);
    if (s) styleByBand[c.band.index] = s;
  }
  const styleFor: Record<string, string> = {};
  for (const e of input.alignment) {
    if (e.status === "matched" && e.ourSectionIndex != null && e.targetBandIndex != null) {
      const id = sectionIds[e.ourSectionIndex];
      const s = styleByBand[e.targetBandIndex];
      if (id && s) styleFor[id] = s;
    }
  }

  // Chrome units: navbar = the captured header crop; footer = the LAST target-only
  // band (a full-page capture's footer has no page-section equivalent by design).
  const chromeIds: string[] = [];
  if (input.navbar?.cropPath) {
    targetFor["navbar"] = input.navbar.cropPath;
    const s = bandStyleLine(input.navbar.style, input.navbar.images);
    if (s) styleFor["navbar"] = s;
    chromeIds.push("navbar");
  }
  const targetOnly = input.alignment
    .filter((e) => e.status === "target-only" && e.targetBandIndex != null)
    .map((e) => e.targetBandIndex as number);
  const footerBandIdx = targetOnly.length ? targetOnly[targetOnly.length - 1] : null;
  if (footerBandIdx != null && cropPaths[footerBandIdx]) {
    targetFor["footer"] = cropPaths[footerBandIdx];
    if (styleByBand[footerBandIdx]) styleFor["footer"] = styleByBand[footerBandIdx];
    chromeIds.push("footer");
  }

  // Sections we evolve = matched ones that have a target crop.
  const evolve = input.alignment
    .filter((e) => e.status === "matched" && e.ourSectionIndex != null)
    .map((e) => ({ idx: e.ourSectionIndex as number, id: sectionIds[e.ourSectionIndex as number] }))
    .filter((s) => !!targetFor[s.id]);

  return { sectionIds, targetFor, styleFor, chromeIds, evolve, footerBandIdx };
}
