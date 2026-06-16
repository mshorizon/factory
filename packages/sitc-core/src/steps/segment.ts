/**
 * segmentTarget — split the frozen full-page target into ordered, labeled
 * section bands (DESIGN §4.3). Output feeds cropBands + the alignment map.
 *
 * The VLM is good at *what* a band is and its *order*, but its pixel y-ranges
 * are noisy (overlaps, gaps, out-of-bounds). So the raw model output is run
 * through a deterministic `normalizeBands` pass that makes the bands a clean,
 * gapless, non-overlapping top-to-bottom partition of the image — which is what
 * cropping and alignment depend on. normalizeBands is pure + exhaustively tested.
 */
import type { SectionBand, WorkerRunner } from "../types.js";

const KNOWN_TYPES = [
  "hero", "services", "categories", "about", "mission", "contact", "shop",
  "gallery", "testimonials", "process", "serviceArea", "trustBar", "faq",
  "features", "ctaBanner", "blog", "map", "booking", "pricing", "project",
  "comparison", "team",
];

/**
 * Make raw model bands a clean partition of [0, imageHeight):
 *  - drop non-finite / zero-or-negative-height bands
 *  - sort by yStart, clamp to image bounds
 *  - snap each band's start to the previous band's end (no gaps, no overlaps)
 *  - drop bands that collapse to <minHeight after snapping
 *  - extend the last band to the image bottom; reindex 0..n-1
 */
export function normalizeBands(
  raw: SectionBand[],
  imageHeight: number,
  opts: { minHeight?: number } = {},
): SectionBand[] {
  const minHeight = opts.minHeight ?? 8;
  if (!Number.isFinite(imageHeight) || imageHeight <= 0) return [];

  const cleaned = raw
    .filter((b) => b && Number.isFinite(b.yStart) && Number.isFinite(b.yEnd) && b.yEnd > b.yStart)
    .map((b) => ({
      ...b,
      yStart: Math.max(0, Math.min(imageHeight, Math.round(b.yStart))),
      yEnd: Math.max(0, Math.min(imageHeight, Math.round(b.yEnd))),
    }))
    .filter((b) => b.yEnd > b.yStart)
    .sort((a, b) => a.yStart - b.yStart || a.yEnd - b.yEnd);

  const out: SectionBand[] = [];
  let cursor = 0;
  for (const b of cleaned) {
    const yStart = Math.max(b.yStart, cursor);
    const yEnd = Math.max(yStart, b.yEnd);
    if (yEnd - yStart < minHeight) continue; // collapsed by an earlier overlap
    out.push({ ...b, yStart, yEnd });
    cursor = yEnd;
  }
  if (out.length) out[out.length - 1].yEnd = imageHeight; // cover to bottom
  return out.map((b, index) => ({ ...b, index }));
}

export interface SegmentOptions {
  model?: string;
  /** Height of the full-page screenshot in px — lets the model scale + lets us clamp. */
  imageHeight?: number;
  minBandHeight?: number;
}

export async function segmentTarget(
  runner: WorkerRunner,
  fullPageScreenshot: string,
  opts: SegmentOptions = {},
): Promise<SectionBand[]> {
  const heightHint = opts.imageHeight
    ? `\nThe image is ${opts.imageHeight}px tall. Use that scale; the bands MUST cover the page top-to-bottom with no gaps and no overlaps.`
    : "\nThe bands MUST cover the page top-to-bottom with no gaps and no overlaps.";

  const prompt = `Segment this full-page website screenshot into ordered, top-to-bottom SECTION BANDS.
A band is one full-bleed horizontal slice of the page (a hero, a services grid, a testimonials row, a footer, etc.).
For each band, give a best-guess type from this set (or "unknown"): ${KNOWN_TYPES.join(", ")}.
Estimate the pixel y-range (yStart inclusive, yEnd exclusive) of each band.${heightHint}
Output NOTHING except one JSON object:
{"bands":[{"index":0,"type":"hero","yStart":0,"yEnd":900,"notes":"<short>"}]}`;

  const r = await runner.runJson<{ bands?: SectionBand[] }>(prompt, {
    images: [fullPageScreenshot],
    allowedTools: ["Read"],
    model: opts.model,
  });

  const bands = Array.isArray(r?.bands) ? r.bands : [];
  return opts.imageHeight
    ? normalizeBands(bands, opts.imageHeight, { minHeight: opts.minBandHeight })
    : bands;
}
