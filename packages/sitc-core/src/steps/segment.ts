/**
 * segmentTarget — split the frozen full-page target into ordered, labeled
 * section bands (DESIGN §4.3). Output feeds the alignment map.
 * v0 prompt — refine + calibrate in Phase 2.
 */
import type { SectionBand, WorkerRunner } from "../types.js";

const KNOWN_TYPES = [
  "hero", "services", "categories", "about", "mission", "contact", "shop",
  "gallery", "testimonials", "process", "serviceArea", "trustBar", "faq",
  "features", "ctaBanner", "blog", "map", "booking", "pricing", "project",
  "comparison", "team",
];

export async function segmentTarget(
  runner: WorkerRunner,
  fullPageScreenshot: string,
  opts: { model?: string } = {},
): Promise<SectionBand[]> {
  const prompt = `Segment this full-page website screenshot into ordered, top-to-bottom SECTION BANDS.
For each band, give a best-guess type from this set (or "unknown"): ${KNOWN_TYPES.join(", ")}.
Estimate the pixel y-range of each band in the image.
Output NOTHING except one JSON object:
{"bands":[{"index":0,"type":"hero","yStart":0,"yEnd":900,"notes":"<short>"}]}`;
  const r = await runner.runJson<{ bands: SectionBand[] }>(prompt, {
    images: [fullPageScreenshot],
    allowedTools: ["Read"],
    model: opts.model,
  });
  return r.bands ?? [];
}
