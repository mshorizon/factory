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

const DEFAULT_MAX_BUFFER = 1024 * 1024 * 32;

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

/** Pull the assistant's final text out of `--output-format json`. */
function extractResult(stdout: string): string {
  const env = JSON.parse(stdout);
  const r = env?.result ?? env;
  return typeof r === "string" ? r : JSON.stringify(r);
}

/** Best-effort extraction of a single JSON object from model text. */
function parseJsonObject<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`no JSON object in worker output: ${text.slice(0, 160)}`);
    return JSON.parse(m[0]) as T;
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
        return map(extractResult(await exec(args, merged.workdir ?? merged.cwd)));
      } catch (e) {
        lastErr = e;
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
