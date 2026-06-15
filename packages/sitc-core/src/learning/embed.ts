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

/** Embedder backed by an external command (`SITC_EMBED_CMD`): text on stdin → JSON vector on stdout. */
export function commandEmbedder(cmd: string): EmbedFn {
  return (text: string): Promise<number[]> =>
    new Promise((resolve, reject) => {
      const child = execFile(
        cmd,
        { shell: true, maxBuffer: 1024 * 1024 * 16 },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(`embed cmd failed: ${stderr || err.message}`));
          try {
            resolve(JSON.parse(stdout) as number[]);
          } catch (e) {
            reject(new Error(`embed cmd bad output: ${String(e).slice(0, 120)}`));
          }
        },
      );
      child.stdin?.end(text);
    });
}

/** Resolve the configured embedder: SITC_EMBED_CMD if set, else the hashing fallback. */
export function defaultEmbedder(): EmbedFn {
  const cmd = process.env.SITC_EMBED_CMD;
  return cmd ? commandEmbedder(cmd) : hashingEmbedder();
}
