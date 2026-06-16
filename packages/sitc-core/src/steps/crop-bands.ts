/**
 * cropBands — slice a full-page target screenshot into per-band PNG crops
 * (DESIGN §4.3). Each crop is the immutable per-section goal the scorer/judge
 * compares a rendered section against. Deterministic (pngjs, no model).
 */
import { PNG } from "pngjs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeBands } from "./segment.js";
import type { SectionBand } from "../types.js";

export interface CroppedBand {
  band: SectionBand;
  /** Absolute path to the written crop PNG. */
  path: string;
  width: number;
  height: number;
}

export interface CropBandsOptions {
  /** Full-page target screenshot path (from captureTarget). */
  screenshotPath: string;
  bands: SectionBand[];
  outDir: string;
  /** Re-normalize against the true decoded image height before cropping. Default true. */
  normalize?: boolean;
}

/** Copy the [yStart, yEnd) row range of `src` into a fresh PNG. */
function sliceRows(src: PNG, yStart: number, yEnd: number): PNG {
  const h = yEnd - yStart;
  const out = new PNG({ width: src.width, height: h });
  // bytes-per-row = width * 4 (RGBA); copy the contiguous row block in one go.
  const bpr = src.width * 4;
  src.data.copy(out.data, 0, yStart * bpr, yEnd * bpr);
  return out;
}

export async function cropBands(opts: CropBandsOptions): Promise<CroppedBand[]> {
  const buf = await fs.readFile(opts.screenshotPath);
  const png = PNG.sync.read(buf);
  await fs.mkdir(opts.outDir, { recursive: true });

  // Trust the real decoded height over whatever scale the model assumed.
  const bands =
    opts.normalize === false
      ? opts.bands
      : normalizeBands(opts.bands, png.height);

  const results: CroppedBand[] = [];
  for (const band of bands) {
    const yStart = Math.max(0, Math.min(png.height, Math.round(band.yStart)));
    const yEnd = Math.max(yStart, Math.min(png.height, Math.round(band.yEnd)));
    if (yEnd <= yStart) continue;
    const slice = sliceRows(png, yStart, yEnd);
    const file = path.join(opts.outDir, `band-${band.index}-${band.type}.png`);
    await fs.writeFile(file, PNG.sync.write(slice));
    results.push({ band, path: file, width: slice.width, height: slice.height });
  }
  return results;
}
