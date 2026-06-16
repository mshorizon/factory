/**
 * alignSections — build the correspondence between the target's section bands
 * and our page's sections (DESIGN §4.3). This is what tells the loop, per
 * section: "evolve toward THIS target crop", and what surfaces target-only
 * bands (new-section candidates) and ours-only sections (drop/keep).
 *
 * Order-preserving greedy match by type: we walk the target bands top-to-bottom
 * and match each to the FIRST not-yet-consumed section of the same type at or
 * after a moving cursor. This respects page order (a second "gallery" band maps
 * to the second "gallery" section, not the first) without reordering sections.
 * Pure + deterministic — exhaustively tested.
 */
import type { AlignmentEntry, AlignmentMap, SectionBand } from "../types.js";

/** Minimal shape we need from one of our page sections. */
export interface OurSection {
  type: string;
}

export interface AlignOptions {
  /**
   * After type-matching, pair leftover bands ↔ leftover sections POSITIONALLY
   * (both are in document order). Default true. This is load-bearing: the VLM
   * labels bands by appearance, so our internal types (`ref`, `blog`, …) often
   * don't match its guess — without positional fill, a mere label mismatch
   * orphans an otherwise-corresponding section. Set false for strict type-only.
   */
  fillPositional?: boolean;
}

export function alignSections(
  bands: SectionBand[],
  ourSections: OurSection[],
  opts: AlignOptions = {},
): AlignmentMap {
  const fillPositional = opts.fillPositional !== false;
  const consumed = new Array<boolean>(ourSections.length).fill(false);
  const usedBand = new Set<number>();
  const entries: AlignmentEntry[] = [];

  let cursor = 0; // sections before this are settled (matched or passed over)
  for (const band of bands) {
    let matchIdx = -1;
    for (let i = cursor; i < ourSections.length; i++) {
      if (!consumed[i] && ourSections[i].type === band.type) {
        matchIdx = i;
        break;
      }
    }
    if (matchIdx >= 0) {
      entries.push({ targetBandIndex: band.index, ourSectionIndex: matchIdx, status: "matched" });
      consumed[matchIdx] = true;
      usedBand.add(band.index);
      cursor = matchIdx + 1;
    }
    // unmatched bands are left for the positional pass (or become target-only)
  }

  // ── positional second pass: pair leftovers in document order ───────────────
  // Recovers label-drift cases (e.g. a `ref` section the VLM called `about`):
  // both the band and the section are unmatched and in order, so pair them.
  if (fillPositional) {
    const leftoverBands = bands.filter((b) => !usedBand.has(b.index));
    const leftoverSecs: number[] = [];
    for (let i = 0; i < ourSections.length; i++) if (!consumed[i]) leftoverSecs.push(i);
    const n = Math.min(leftoverBands.length, leftoverSecs.length);
    for (let k = 0; k < n; k++) {
      entries.push({ targetBandIndex: leftoverBands[k].index, ourSectionIndex: leftoverSecs[k], status: "matched" });
      consumed[leftoverSecs[k]] = true;
      usedBand.add(leftoverBands[k].index);
    }
  }

  // remaining unmatched bands → target-only (candidate new sections)
  for (const band of bands) {
    if (!usedBand.has(band.index)) entries.push({ targetBandIndex: band.index, ourSectionIndex: null, status: "target-only" });
  }
  // remaining unmatched sections → ours-only
  for (let i = 0; i < ourSections.length; i++) {
    if (!consumed[i]) entries.push({ targetBandIndex: null, ourSectionIndex: i, status: "ours-only" });
  }

  // stable, readable order: by ourSectionIndex when present, else by band index
  entries.sort((a, b) => {
    const ak = a.ourSectionIndex ?? Number.MAX_SAFE_INTEGER;
    const bk = b.ourSectionIndex ?? Number.MAX_SAFE_INTEGER;
    if (ak !== bk) return ak - bk;
    return (a.targetBandIndex ?? -1) - (b.targetBandIndex ?? -1);
  });
  return entries;
}

/**
 * Build the loop's `targetImgFor` lookup: our section id → target crop path.
 * `ourSectionIds[i]` is the stable id of the section at page index i; cropPaths
 * is keyed by target band index (e.g. from cropBands → {band.index: path}).
 * Only "matched" entries get a crop; unmatched sections are absent.
 */
export function targetImageMap(
  alignment: AlignmentMap,
  ourSectionIds: string[],
  cropPaths: Record<number, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of alignment) {
    if (e.status === "matched" && e.ourSectionIndex != null && e.targetBandIndex != null) {
      const id = ourSectionIds[e.ourSectionIndex];
      const crop = cropPaths[e.targetBandIndex];
      if (id != null && crop) map[id] = crop;
    }
  }
  return map;
}

/** Target-only bands = candidate new sections (DESIGN §6 "new-section"). */
export function newSectionCandidates(alignment: AlignmentMap): number[] {
  return alignment.filter((e) => e.status === "target-only" && e.targetBandIndex != null).map((e) => e.targetBandIndex as number);
}
