/**
 * Pixel scorer (DESIGN §7 — objective regression guard / tiebreaker).
 *
 * Offset-tolerant SSIM-style comparison via pixelmatch (from the Phase −1 spike,
 * which showed a few-px vertical offset can otherwise inflate the diff on
 * identical designs). This is a COARSE guard, not the primary signal — the VLM
 * is authoritative for design fidelity.
 */
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { promises as fs } from "node:fs";

export interface PixelScore {
  /** 1 - mismatchRatio on the best-aligned overlapping region, ×overlap penalty (I34). */
  similarity: number;
  mismatchRatio: number;
  bestDy: number;
  width: number;
  height: number;
  /**
   * Fraction of the LARGER image the compared overlap covers (todo I34):
   * `(minW/maxW)·(minH/maxH)`. Comparing only the overlap meant a challenger
   * rendering half the target's height paid zero penalty for the missing half —
   * 30% of the hybrid score and the regression-SSIM signal were blind to it.
   * Below the tolerance (0.95 — normal few-px render variance stays unpenalized)
   * the similarity is multiplied by this factor.
   */
  overlap: number;
}

const OVERLAP_TOLERANCE = 0.95;

async function readPng(src: string | Buffer): Promise<PNG> {
  const buf = typeof src === "string" ? await fs.readFile(src) : src;
  return PNG.sync.read(buf);
}

export async function pixelScore(
  a: string | Buffer,
  b: string | Buffer,
  opts: { shift?: number; threshold?: number } = {},
): Promise<PixelScore> {
  const shift = opts.shift ?? 40;
  const pa = await readPng(a);
  const pb = await readPng(b);
  // I34 — size-mismatch penalty factor over the ORIGINAL dimensions.
  const overlap =
    (Math.min(pa.width, pb.width) / Math.max(pa.width, pb.width)) *
    (Math.min(pa.height, pb.height) / Math.max(pa.height, pb.height));
  const penalize = (similarity: number) => (overlap < OVERLAP_TOLERANCE ? similarity * overlap : similarity);
  const W = Math.min(pa.width, pb.width);
  const H = Math.min(pa.height, pb.height) - 2 * shift;
  if (W <= 0 || H <= 0) {
    // too small to shift-search — fall back to a direct compare on the overlap
    const w = Math.min(pa.width, pb.width);
    const h = Math.min(pa.height, pb.height);
    const ca = new PNG({ width: w, height: h });
    const cb = new PNG({ width: w, height: h });
    PNG.bitblt(pa, ca, 0, 0, w, h, 0, 0);
    PNG.bitblt(pb, cb, 0, 0, w, h, 0, 0);
    const m = pixelmatch(ca.data, cb.data, undefined, w, h, { threshold: opts.threshold ?? 0.1 });
    const ratio = m / (w * h);
    return { similarity: penalize(1 - ratio), mismatchRatio: ratio, bestDy: 0, width: w, height: h, overlap };
  }
  const region = (src: PNG, dy: number) => {
    const out = new PNG({ width: W, height: H });
    PNG.bitblt(src, out, 0, shift + dy, W, H, 0, 0);
    return out;
  };
  const base = region(pa, 0);
  let best = { ratio: 1, dy: 0 };
  for (let dy = -shift; dy <= shift; dy += 2) {
    const shifted = region(pb, dy);
    const m = pixelmatch(base.data, shifted.data, undefined, W, H, { threshold: opts.threshold ?? 0.1 });
    const ratio = m / (W * H);
    if (ratio < best.ratio) best = { ratio, dy };
  }
  return { similarity: penalize(1 - best.ratio), mismatchRatio: best.ratio, bestDy: best.dy, width: W, height: H, overlap };
}
