/**
 * Embedding provider (DESIGN §9.3) — NO Claude API.
 *
 * Pluggable `EmbedFn`. Production plugs a real embedding model via
 * `SITC_EMBED_CMD` (a command that reads text on stdin and prints a JSON number
 * array). The dependency-free `hashingEmbedder` is the deterministic fallback
 * used in dev/tests — crude bag-of-words hashing into a fixed-dim unit vector;
 * good enough for tag-pre-filtered retrieval, replaceable transparently.
 */
import { execFile } from "node:child_process";
import { SITC_EMBED_DIM } from "./dims.js";

export type EmbedFn = (text: string) => Promise<number[]>;

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Deterministic, dependency-free fallback embedder (hashed bag-of-words). */
export function hashingEmbedder(dim: number = SITC_EMBED_DIM): EmbedFn {
  return async (text: string): Promise<number[]> => {
    const v = new Array<number>(dim).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9#]+/g) ?? [];
    for (const tok of tokens) {
      let h = 2166136261;
      for (let i = 0; i < tok.length; i++) {
        h ^= tok.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const idx = Math.abs(h) % dim;
      const sign = (h & 1) === 0 ? 1 : -1;
      v[idx] += sign;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    return norm === 0 ? v : v.map((x) => x / norm);
  };
}

export interface CommandEmbedderOptions {
  /**
   * Required output dimension. Default {@link SITC_EMBED_DIM} (= the pgvector
   * column width). A model returning a different dim is a config error and is
   * rejected loudly — a silent mismatch corrupts cosine ranking or breaks the
   * DB insert. Set to 0 to accept any positive length.
   */
  expectedDim?: number;
  /** L2-normalize the vector (cosine is dim-stable either way; on by default for parity with the fallback). */
  normalize?: boolean;
  /** Kill a hung embed command after this many ms (default 20s). */
  timeoutMs?: number;
}

function l2normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

/**
 * Embedder backed by an external command (`SITC_EMBED_CMD`): text on stdin → a
 * JSON number array on stdout. Output is validated (numeric, finite, correct
 * dimension) so a misconfigured model fails fast instead of silently poisoning
 * the lessons store.
 *
 * Example SITC_EMBED_CMD (OpenAI text-embedding-3-small, 1536-dim):
 *   `python3 -c "import sys,json,openai; print(json.dumps(openai.embeddings.create(model='text-embedding-3-small', input=sys.stdin.read()).data[0].embedding))"`
 */
export function commandEmbedder(cmd: string, opts: CommandEmbedderOptions = {}): EmbedFn {
  const expectedDim = opts.expectedDim ?? SITC_EMBED_DIM;
  const normalize = opts.normalize ?? true;
  const timeoutMs = opts.timeoutMs ?? 20_000;

  return (text: string): Promise<number[]> =>
    new Promise((resolve, reject) => {
      const child = execFile(
        cmd,
        { shell: true, maxBuffer: 1024 * 1024 * 16, timeout: timeoutMs },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(`embed cmd failed: ${stderr || err.message}`));
          let parsed: unknown;
          try {
            parsed = JSON.parse(stdout);
          } catch (e) {
            return reject(new Error(`embed cmd bad output (not JSON): ${String(e).slice(0, 120)}`));
          }
          if (!Array.isArray(parsed) || parsed.length === 0) {
            return reject(new Error(`embed cmd output is not a non-empty array (got ${typeof parsed})`));
          }
          if (!parsed.every((x) => typeof x === "number" && Number.isFinite(x))) {
            return reject(new Error("embed cmd output contains non-finite / non-numeric values"));
          }
          const vec = parsed as number[];
          if (expectedDim > 0 && vec.length !== expectedDim) {
            return reject(new Error(`embed cmd returned dim ${vec.length}, expected ${expectedDim} (must match the pgvector column)`));
          }
          resolve(normalize ? l2normalize(vec) : vec);
        },
      );
      child.stdin?.end(text);
    });
}

/** Resolve the configured embedder: SITC_EMBED_CMD if set, else the hashing fallback. */
export function defaultEmbedder(opts: CommandEmbedderOptions = {}): EmbedFn {
  const cmd = process.env.SITC_EMBED_CMD;
  return cmd ? commandEmbedder(cmd, opts) : hashingEmbedder();
}

export interface EmbedProbe {
  ok: boolean;
  source: "command" | "hashing-fallback";
  dim: number | null;
  latencyMs: number | null;
  error?: string;
}

/**
 * Verify the configured embedder before a run: runs it on a sample and reports
 * dim + latency, or the failure. Lets the operator confirm SITC_EMBED_CMD wiring
 * (and that the model dim matches the DB) without starting a real run.
 * `now` is injectable so the probe is deterministically testable.
 */
export async function probeEmbedder(
  embed: EmbedFn = defaultEmbedder(),
  opts: { sample?: string; now?: () => number } = {},
): Promise<EmbedProbe> {
  const source: EmbedProbe["source"] = process.env.SITC_EMBED_CMD ? "command" : "hashing-fallback";
  const now = opts.now ?? (() => Date.now());
  const t0 = now();
  try {
    const v = await embed(opts.sample ?? "hero section, dark mode, split layout, bold typography");
    const okDim = Array.isArray(v) && v.length === SITC_EMBED_DIM && v.every((x) => Number.isFinite(x));
    return {
      ok: okDim,
      source,
      dim: Array.isArray(v) ? v.length : null,
      latencyMs: now() - t0,
      error: okDim ? undefined : `expected ${SITC_EMBED_DIM}-dim finite vector, got dim=${Array.isArray(v) ? v.length : "n/a"}`,
    };
  } catch (e) {
    return { ok: false, source, dim: null, latencyMs: now() - t0, error: String(e).slice(0, 200) };
  }
}
