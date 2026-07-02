// SITC Spike 1 — isolation-render fidelity (DESIGN §4.4)
// Screenshots a section both IN-PAGE (full engine render) and ISOLATED (harness
// route), then pixel-diffs them. Verdict question: is the isolated render close
// enough that a score computed on it is trustworthy?
//
// Run:  cd packages/tests && node sitc-spike-fidelity.mjs [businessId] [page] [index]
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SITC_BASE || "http://localhost:4321";
const business = process.argv[2] || "template-specialist";
const pageSlug = process.argv[3] || "home";
const index = process.argv[4] || "0";
const VIEWPORT = { width: 1440, height: 900 };
const OUT = path.resolve("../../screenshots/sitc-spike");
fs.mkdirSync(OUT, { recursive: true });

const inpageURL = `${BASE}/?business=${business}`;
const isoURL = `${BASE}/sitc-harness/section?business=${business}&page=${pageSlug}&index=${index}`;
// In-page: select the section at the SAME index. Isolated harness renders the
// single section at data-section-index=0.
const INPAGE_SEL = `[data-section-index="${index}"]`;
const ISO_SEL = `[data-section-index="0"]`;

async function shoot(ctx, url, label, sel) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const el = page.locator(sel).first();
  await el.waitFor({ state: "visible", timeout: 30000 });
  // Trigger scroll-reveal (IntersectionObserver), then force every animation/
  // transition to JUMP to its final state (duration:0 + delay:0). This is the
  // key vs animation:none — it lands on the revealed end keyframe (opacity:1,
  // translateY:0) deterministically instead of freezing at the hidden start.
  await el.scrollIntoViewIfNeeded();
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}`,
  });
  await page.waitForTimeout(800);
  // Remove fixed/sticky chrome (navbar, cookie banner, floating widgets,
  // scroll-to-top) that would otherwise be painted over the section. These are
  // out of flow, so hiding them does not shift the section's layout.
  await page.evaluate(() => {
    for (const node of Array.from(document.querySelectorAll("body *"))) {
      const pos = getComputedStyle(node).position;
      if (pos === "fixed" || pos === "sticky") node.style.display = "none";
    }
  });
  await page.waitForTimeout(150);
  const box = await el.boundingBox();
  const buf = await el.screenshot({ animations: "disabled" });
  fs.writeFileSync(path.join(OUT, `${label}.png`), buf);
  await page.close();
  return { buf, box };
}

function toPNG(buf) {
  return PNG.sync.read(buf);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });

  console.log(`IN-PAGE : ${inpageURL}`);
  console.log(`ISOLATED: ${isoURL}\n`);

  const inpage = await shoot(ctx, inpageURL, "inpage", INPAGE_SEL);
  const iso = await shoot(ctx, isoURL, "isolated", ISO_SEL);
  await browser.close();

  const a = toPNG(inpage.buf);
  const b = toPNG(iso.buf);

  console.log(`in-page  element box: ${Math.round(inpage.box.width)} x ${Math.round(inpage.box.height)}`);
  console.log(`isolated element box: ${Math.round(iso.box.width)} x ${Math.round(iso.box.height)}`);
  console.log(`in-page  png        : ${a.width} x ${a.height}`);
  console.log(`isolated png        : ${b.width} x ${b.height}`);

  // Compare on the common (overlapping) region, tolerant to a small VERTICAL
  // shift (in-page sections sit in a scrolled/nav-offset context, so identical
  // content can be translated a few px). Search dy and take the best match —
  // this separates "same design, shifted" from "genuinely different".
  const W = Math.min(a.width, b.width);
  const SHIFT = 40; // search ±40px
  const H = Math.min(a.height, b.height) - 2 * SHIFT;
  const region = (src, dy) => {
    const out = new PNG({ width: W, height: H });
    PNG.bitblt(src, out, 0, SHIFT + dy, W, H, 0, 0);
    return out;
  };
  const totalPx = W * H;
  const base = region(a, 0);
  let best = { ratio: 1, dy: 0, diff: null, mismatched: totalPx };
  for (let dy = -SHIFT; dy <= SHIFT; dy += 2) {
    const shifted = region(b, dy);
    const d = new PNG({ width: W, height: H });
    const m = pixelmatch(base.data, shifted.data, d.data, W, H, { threshold: 0.1 });
    const r = m / totalPx;
    if (r < best.ratio) best = { ratio: r, dy, diff: d, mismatched: m };
  }
  fs.writeFileSync(path.join(OUT, "diff.png"), PNG.sync.write(best.diff));

  const mismatched = best.mismatched;
  const ratio = best.ratio;
  console.log(`best vertical align: dy=${best.dy}px`);
  const heightDelta = Math.abs(a.height - b.height);
  const heightDeltaPct = (heightDelta / Math.max(a.height, b.height)) * 100;

  console.log(`\n--- FIDELITY (compared region ${W}x${H}) ---`);
  console.log(`mismatched pixels : ${mismatched} / ${totalPx}`);
  console.log(`diff ratio        : ${(ratio * 100).toFixed(3)} %`);
  console.log(`pixel similarity  : ${((1 - ratio) * 100).toFixed(3)} %`);
  console.log(`height delta      : ${heightDelta}px (${heightDeltaPct.toFixed(1)}%)`);
  console.log(`\nartifacts: ${OUT}/{inpage,isolated,diff}.png`);

  // Rough verdict thresholds for the spike.
  const verdict =
    ratio < 0.02 && heightDeltaPct < 2
      ? "PASS — isolated ≈ in-page; per-section scoring on isolated render is trustworthy"
      : ratio < 0.08 && heightDeltaPct < 10
        ? "MARGINAL — close but investigate the diff before relying on it"
        : "FAIL — isolated diverges from in-page; fall back to full-page + crop";
  console.log(`\nVERDICT: ${verdict}`);
})().catch((e) => {
  console.error("spike error:", e);
  process.exit(1);
});
