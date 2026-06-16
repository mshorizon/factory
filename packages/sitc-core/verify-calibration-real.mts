import { generateSubtleTriples, colorPerturbation, pxPerturbation, runCalibration, createClaudeWorker } from "./src/index.js";
import { renderSection } from "./src/steps/render.js";
import { promises as fs } from "node:fs";

const ROOT = "/Users/msadlo/my-projects/factory";
const CAL_DIR = `${ROOT}/templates/_sitc-cal`;
const base = JSON.parse(await fs.readFile(`${ROOT}/templates/template-specialist/template-specialist.json`,"utf8"));

// render a perturbed profile's hero (index 0) via the working-file harness
const render = async (profile, label) => {
  const file = `${CAL_DIR}/${label}.json`;
  await fs.writeFile(file, JSON.stringify(profile,null,2));
  const r = await renderSection({ baseUrl:"http://localhost:4321", business:"_sitc-cal", index:0, profilePath:file });
  const png = `${CAL_DIR}/${label}.png`;
  await fs.writeFile(png, r.png);
  return png;
};

console.log("generating subtle triples (rendering perturbed heroes)...");
const triples = await generateSubtleTriples({
  baseProfile: base,
  render,
  perturbations: [
    // primary color: near = mild shift, far = stronger shift (still subtle vs gross spike deltas)
    colorPerturbation("primaryColor", "theme.colors.light.primary", [-35, -90]),
    // image corner radius: 64px → near 34px → far 8px
    pxPerturbation("radius", "theme.ui.radius", [-30, -56]),
  ],
});
console.log(`generated ${triples.length} triples from ${triples.length/2} perturbations`);

console.log("running REAL pairwise judge (claude -p sonnet, order-symmetric → 2 calls each)...");
const t0 = Date.now();
const report = await runCalibration(createClaudeWorker({ model:"sonnet" }), triples, { model:"sonnet", concurrency: 4 });
console.log(`done in ${((Date.now()-t0)/1000).toFixed(0)}s\n`);

for (const it of report.items) {
  console.log(`  ${it.id.padEnd(24)} winner=${String(it.winner).padEnd(10)} orderStable=${it.orderStable}  correct=${it.correct}`);
}
console.log(`\nagreement (vs ground truth): ${(report.agreement*100).toFixed(0)}%  (${report.confidentN} confident triples)`);
console.log(`order-stability:             ${(report.orderStability*100).toFixed(0)}%`);

const PASS = report.agreement >= 0.9 && report.orderStability >= 0.9;
console.log(`\n${PASS ? "✅ judge MEETS the ≥90% bar on subtle deltas — auto-merge trust justified" : "⚠️  judge BELOW the ≥90% bar on subtle deltas — keep needs_review / widen deltas"}`);
// emit machine-readable summary for persistence
await fs.writeFile(`${CAL_DIR}/report.json`, JSON.stringify(report,null,2));
process.exit(0);
