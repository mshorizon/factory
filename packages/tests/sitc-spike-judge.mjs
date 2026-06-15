// SITC Spike 2 — pairwise VLM judge reliability (DESIGN §7.2a).
// For each (target, candidateA, candidateB) triple, asks the judge which
// candidate's DESIGN is closer to the target — in BOTH orders — to measure:
//   (1) agreement with human ground truth (target ≥ ~90% on confident triples)
//   (2) order-stability  = does the verdict follow content, not slot position?
// Run: node sitc-spike-judge.mjs
import { execFile } from "node:child_process";
import path from "node:path";

const LIB = path.resolve("../../screenshots/sitc-spike/lib");
const img = (name) => path.join(LIB, `hero-template-${name}.png`);

// Ground truth ("closer") set by inspecting the 6 distinct hero designs.
// confident=true → counts toward the agreement metric. The two `confident:false`
// triples pit layout-similarity against palette-similarity (genuinely ambiguous)
// and are used only for order-stability, not agreement.
const TRIPLES = [
  { id: "id-law",        target: "law",        A: "law",        B: "tech",       truth: "A", confident: true },
  { id: "id-tech",       target: "tech",       A: "restaurant", B: "tech",       truth: "B", confident: true },
  { id: "id-specialist", target: "specialist", A: "specialist", B: "art",        truth: "A", confident: true },
  { id: "id-art",        target: "art",        A: "tech",       B: "art",        truth: "B", confident: true },
  { id: "id-restaurant", target: "restaurant", A: "restaurant", B: "law",        truth: "A", confident: true },
  { id: "sim-law/sac>tech",      target: "law",        A: "sacrum",     B: "tech",   truth: "A", confident: true },
  { id: "sim-tech/rest>law",     target: "tech",       A: "restaurant", B: "law",    truth: "A", confident: true },
  { id: "sim-rest/tech>sac",     target: "restaurant", A: "tech",       B: "sacrum", truth: "A", confident: true },
  { id: "sim-sac/law>art",       target: "sacrum",     A: "law",        B: "art",    truth: "A", confident: true },
  { id: "sim-law/sac>art",       target: "law",        A: "sacrum",     B: "art",    truth: "A", confident: true },
  // deliberately ambiguous (layout vs palette) — order-stability only
  { id: "hard-spec/law-vs-tech", target: "specialist", A: "law",        B: "tech",   truth: "A", confident: false },
  { id: "hard-art/tech-vs-law",  target: "art",        A: "tech",       B: "law",    truth: "A", confident: false },
];

const MODEL = process.env.SITC_JUDGE_MODEL || "sonnet";

function callClaude(prompt) {
  return new Promise((resolve) => {
    execFile(
      "claude",
      ["-p", prompt, "--model", MODEL, "--output-format", "json",
       "--allowedTools", "Read"],
      { maxBuffer: 1024 * 1024 * 16, cwd: process.cwd() },
      (err, stdout) => {
        if (err) return resolve({ error: String(err).slice(0, 120) });
        try {
          const env = JSON.parse(stdout);
          let r = env.result ?? env;
          if (typeof r === "string") {
            const m = r.match(/\{[\s\S]*\}/);
            r = JSON.parse(m ? m[0] : r);
          }
          if (r && (r.closer === "first" || r.closer === "second")) return resolve(r);
          resolve({ error: "no-verdict: " + JSON.stringify(r).slice(0, 80) });
        } catch (e) {
          resolve({ error: "parse: " + String(e).slice(0, 80) });
        }
      },
    );
  });
}

async function judge(targetPath, firstPath, secondPath) {
  const prompt = `You are judging website-section DESIGN similarity. Use the Read tool to open these three screenshot files, then answer:
TARGET:  ${targetPath}
FIRST:   ${firstPath}
SECOND:  ${secondPath}
Which candidate (FIRST or SECOND) is closer to TARGET in DESIGN LANGUAGE — layout/composition, color system, typography, structure, overall style? Ignore exact photo content, copy text, and vertical position/cropping.
Output NOTHING except one JSON object on the final line: {"closer":"first"|"second","confidence":0.0-1.0,"reason":"<short>"}`;
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await callClaude(prompt);
    if (!last.error) return last;
  }
  return last;
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

// Build all judge calls (2 orders per triple).
const calls = [];
for (const t of TRIPLES) {
  // order 1: FIRST=A, SECOND=B  → "first" means A
  calls.push({ t, order: "AB", target: t.target, first: t.A, second: t.B });
  // order 2: FIRST=B, SECOND=A  → "first" means B
  calls.push({ t, order: "BA", target: t.target, first: t.B, second: t.A });
}

console.log(`judge model: ${MODEL} | ${TRIPLES.length} triples x 2 orders = ${calls.length} calls\n`);

const results = await pool(calls, 4, async (c) => {
  const v = await judge(img(c.target), img(c.first), img(c.second));
  // map "first"/"second" → which actual candidate (A or B)
  let pick = null;
  if (v.closer === "first") pick = c.order === "AB" ? "A" : "B";
  else if (v.closer === "second") pick = c.order === "AB" ? "B" : "A";
  return { ...c, pick, raw: v };
});

// Aggregate per triple.
let agree = 0, agreeDenom = 0, orderStable = 0;
console.log("triple                     order AB  order BA  stable  truth  agree");
console.log("-------------------------------------------------------------------");
for (const t of TRIPLES) {
  const ab = results.find((r) => r.t.id === t.id && r.order === "AB");
  const ba = results.find((r) => r.t.id === t.id && r.order === "BA");
  const pAB = ab?.pick ?? "?";
  const pBA = ba?.pick ?? "?";
  const stable = pAB !== "?" && pAB === pBA;
  if (stable) orderStable++;
  // order-symmetric verdict: agree both ways → that pick; else tie (no decision)
  const verdict = stable ? pAB : "TIE";
  const correct = verdict === t.truth;
  if (t.confident) { agreeDenom++; if (correct) agree++; }
  console.log(
    `${t.id.padEnd(26)} ${pAB.padEnd(9)} ${pBA.padEnd(9)} ${(stable ? "yes" : "NO").padEnd(7)} ${t.truth.padEnd(6)} ${t.confident ? (correct ? "✓" : "✗") : "(amb)"}`,
  );
}

console.log("\n--- JUDGE RELIABILITY ---");
console.log(`order-stability     : ${orderStable}/${TRIPLES.length} (${((orderStable / TRIPLES.length) * 100).toFixed(0)}%) — verdict follows content, not slot`);
console.log(`agreement (confident): ${agree}/${agreeDenom} (${((agree / agreeDenom) * 100).toFixed(0)}%) via order-symmetric voting`);
const errs = results.filter((r) => r.raw?.error);
if (errs.length) console.log(`errors: ${errs.length} (${errs[0].raw.error})`);
console.log(`\nVERDICT: ${orderStable / TRIPLES.length >= 0.8 && agree / agreeDenom >= 0.9
  ? "PASS — pairwise judge is order-stable and accurate; trustworthy as the promotion mechanism"
  : "INVESTIGATE — judge shows positional bias or low accuracy; see §7.2a mitigations"}`);
