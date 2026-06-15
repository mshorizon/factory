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
  /** 1 - mismatchRatio, on the best-aligned overlapping region. */
  similarity: number;
  mismatchRatio: number;
  bestDy: number;
  width: number;
  height: number;
}

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
    return { similarity: 1 - ratio, mismatchRatio: ratio, bestDy: 0, width: w, height: h };
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
  return { similarity: 1 - best.ratio, mismatchRatio: best.ratio, bestDy: best.dy, width: W, height: H };
}
