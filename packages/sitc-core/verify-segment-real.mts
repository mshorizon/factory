import { captureTarget, segmentTarget, createClaudeWorker, normalizeBands } from "./src/index.js";
import { PNG } from "pngjs";
import { promises as fs } from "node:fs";

// 1. capture a REAL full-page screenshot of a rendered multi-section site
const cap = await captureTarget({
  url: "http://localhost:4321/?business=template-specialist",
  outDir: "/Users/msadlo/my-projects/factory/screenshots/sitc-step4",
  breakpoints: [{ label: "desktop", width: 1440, height: 900, role: "score" }],
});
const shot = cap.screenshots.desktop;
const png = PNG.sync.read(await fs.readFile(shot));
console.log(`captured full page: ${png.width}x${png.height}px → ${shot}`);

// ground-truth: how many real sections does the home page have?
const profile = JSON.parse(await fs.readFile("/Users/msadlo/my-projects/factory/templates/template-specialist/template-specialist.json","utf8"));
const homeSecs = (profile.pages.home.sections||[]).map(s=>s.type);
console.log(`ground-truth home sections (${homeSecs.length}): ${homeSecs.join(", ")}`);

// 2. REAL claude -p segmentation (Read-only — spike-approved pattern)
const worker = createClaudeWorker({ model: "sonnet" });
console.log("running real claude -p segmentation (this calls the model)...");
const t0 = Date.now();
const bands = await segmentTarget(worker, shot, { imageHeight: png.height, model: "sonnet" });
console.log(`segmentTarget returned ${bands.length} bands in ${((Date.now()-t0)/1000).toFixed(1)}s`);

// 3. validate the partition + report fidelity vs ground truth
let pass=0,fail=0; const ok=(c,m)=>{c?pass++:(fail++,console.log("  ✗",m));};
ok(bands.length>=3, `found >=3 bands (got ${bands.length})`);
ok(bands[0].yStart===0, "covers from top (y=0)");
ok(bands[bands.length-1].yEnd===png.height, "covers to bottom");
let contig=true; for(let i=1;i<bands.length;i++) if(bands[i].yStart!==bands[i-1].yEnd) contig=false;
ok(contig, "gapless + non-overlapping partition");
ok(bands.every(b=>b.yEnd-b.yStart>=8), "no collapsed bands");
ok(bands[0].type==="hero", `first band is hero (got "${bands[0].type}")`);

console.log("\ndetected bands (normalized):");
for (const b of bands) console.log(`  [${b.index}] ${b.type.padEnd(13)} y ${String(b.yStart).padStart(5)}–${String(b.yEnd).padStart(5)}  (${b.yEnd-b.yStart}px)  ${b.notes??""}`);

console.log(`\n${fail===0?"✅":"❌"} real segmentation: ${pass} passed, ${fail} failed`);
process.exit(fail===0?0:1);
