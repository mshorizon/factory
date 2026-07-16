/**
 * claudeWorker — the headless `claude -p` substrate for all AI-driven steps.
 *
 * Extracted from the Phase −1 spike judge (which validated that `claude -p`
 * with `--allowedTools Read` reads screenshots and returns structured JSON
 * reliably). Deliberately does NOT use `--dangerously-skip-permissions`: tools
 * are scoped per call via `allowedTools`.
 */
import { execFile } from "node:child_process";
import type { WorkerRunner, WorkerRunOptions } from "./types.js";
import type { CallUsage } from "./cost-meter.js";

const DEFAULT_MAX_BUFFER = 1024 * 1024 * 32;

/**
 * Pull cost + token usage out of a `claude -p --output-format json` envelope (I9).
 * Defensive: any missing field → 0. `total_cost_usd`, `usage.*`, `duration_ms`
 * are the documented fields; cache reads expose prompt-cache reuse (I10).
 */
export function parseClaudeUsage(env: any): CallUsage {
  const u = env?.usage ?? {};
  const n = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0);
  return {
    costUsd: n(env?.total_cost_usd ?? env?.cost_usd),
    inputTokens: n(u.input_tokens),
    outputTokens: n(u.output_tokens),
    cacheReadTokens: n(u.cache_read_input_tokens ?? u.cache_read_tokens),
    durationMs: n(env?.duration_ms),
  };
}

function exec(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "claude",
      args,
      { maxBuffer: DEFAULT_MAX_BUFFER, cwd },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`claude -p failed: ${stderr || err.message}`));
        resolve(stdout);
      },
    );
  });
}

/** Pull the assistant's final text out of a parsed `--output-format json` envelope. */
function extractResultFromEnv(env: any): string {
  const r = env?.result ?? env;
  return typeof r === "string" ? r : JSON.stringify(r);
}

/**
 * Extract the FIRST complete top-level JSON object from `text` via a
 * string-aware balanced-brace scan. A greedy `/\{[\s\S]*\}/` regex spans to the
 * LAST brace, so any trailing content containing a `}` (a second object, an
 * example snippet after the answer) poisons the candidate — the exact
 * "Unexpected non-whitespace character after JSON" failure from run #44.
 */
function firstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { if (inString) escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Best-effort extraction of a single JSON object from model text.
 *
 * Robust to the failure modes seen live: a markdown ```json fence around the
 * object and trailing commas (run #42: "Expected property name or '}'"), and
 * trailing content after the object — a second JSON object or prose-with-braces
 * (run #44: "Unexpected non-whitespace character after JSON"). Repairs apply
 * only on the fallback path — after a clean `JSON.parse` has failed — so
 * well-formed output is never touched.
 */
function parseJsonObject<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Strip markdown code fences, then take the first BALANCED {…} object.
    const unfenced = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    const candidate = firstJsonObject(unfenced);
    if (!candidate) throw new Error(`no JSON object in worker output: ${text.slice(0, 160)}`);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Last resort: drop trailing commas before } or ] (the common opus defect).
      const repaired = candidate.replace(/,(\s*[}\]])/g, "$1");
      return JSON.parse(repaired) as T;
    }
  }
}

function buildArgs(prompt: string, opts: WorkerRunOptions): string[] {
  const args = ["-p", prompt, "--output-format", "json"];
  if (opts.model) args.push("--model", opts.model);
  const tools = opts.allowedTools ?? (opts.images?.length ? ["Read"] : undefined);
  if (tools?.length) args.push("--allowedTools", tools.join(","));
  return args;
}

function composePrompt(prompt: string, images?: string[]): string {
  if (!images?.length) return prompt;
  const list = images.map((p) => `- ${p}`).join("\n");
  return `First use the Read tool to open these image file(s):\n${list}\n\n${prompt}`;
}

export interface ClaudeWorkerConfig {
  /** Default model for calls that don't specify one. */
  model?: string;
  /** Default retry count on error / unparseable output. */
  retries?: number;
  /** Cost/usage sink — fired once per successful `claude -p` call (I9). */
  onUsage?: (usage: CallUsage) => void;
}

export function createClaudeWorker(config: ClaudeWorkerConfig = {}): WorkerRunner {
  const defaultRetries = config.retries ?? 2;

  async function attempt<T>(
    prompt: string,
    opts: WorkerRunOptions,
    map: (text: string) => T,
  ): Promise<T> {
    const retries = opts.retries ?? defaultRetries;
    const merged: WorkerRunOptions = { model: config.model, ...opts };
    const full = composePrompt(prompt, merged.images);
    const args = buildArgs(full, merged);
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        const stdout = await exec(args, merged.workdir ?? merged.cwd);
        const env = JSON.parse(stdout);
        // Cost is incurred whether or not `map` parses — record before mapping (I9).
        if (config.onUsage) config.onUsage(parseClaudeUsage(env));
        return map(extractResultFromEnv(env));
      } catch (e) {
        lastErr = e;
        // Back off before retrying — transient API/rate-limit blips under worker
        // concurrency otherwise burn all attempts instantly (the run-#23 failure).
        if (i < retries) await new Promise((r) => setTimeout(r, 3000 * (i + 1) + Math.floor(Math.random() * 1500)));
      }
    }
    throw new Error(`claudeWorker gave up after ${retries + 1} attempts: ${String(lastErr).slice(0, 200)}`);
  }

  return {
    run: (prompt, opts = {}) => attempt(prompt, opts, (t) => t),
    runJson: <T = unknown>(prompt: string, opts: WorkerRunOptions = {}) =>
      attempt<T>(prompt, opts, (t) => parseJsonObject<T>(t)),
  };
}
