/**
 * Prod-preview target for the acceptance gate (DESIGN §7.4; tasks I5).
 *
 * THE GAP THIS CLOSES: the acceptance gate ran against `astro dev`, whose output is
 * unbundled (~18 MB, hundreds of requests). Perf/transfer/CWV budgets there are
 * meaningless — they'd both falsely fail a fine template and falsely pass a slow one.
 *
 * The fix has two parts:
 *   1. `resolveAcceptanceTarget` — decide WHERE acceptance runs (an operator-provided
 *      prod URL, a freshly-built preview, or the dev server) and whether perf budgets
 *      are AUTHORITATIVE there. Pure → unit-tested.
 *   2. `buildAndServePreview` — produce a real prod build of the champion worktree and
 *      serve it via the @astrojs/node standalone server, so perf numbers are real.
 */
import { execFile, spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

export interface AcceptanceTargetEnv {
  /** Operator-provided prod preview origin/URL (authoritative perf). */
  acceptanceUrl?: string;
  /** Build + serve a prod preview from the champion worktree (authoritative perf). */
  build?: boolean;
}

export interface AcceptanceTarget {
  mode: "url" | "build" | "dev";
  /** Echoed for the "url" mode; "build"/"dev" URLs are composed by the caller. */
  url?: string;
  /** Whether perf/transfer budgets are meaningful here (prod) and should fail the gate. */
  enforcePerf: boolean;
  note: string;
}

/**
 * Pick the acceptance target by precedence: explicit prod URL → build-a-preview →
 * dev fallback (perf NOT enforced, with a loud note). Perf is authoritative only
 * against a real prod build.
 */
export function resolveAcceptanceTarget(env: AcceptanceTargetEnv): AcceptanceTarget {
  if (env.acceptanceUrl) {
    return { mode: "url", url: env.acceptanceUrl, enforcePerf: true, note: `prod preview (SITC_ACCEPTANCE_URL=${env.acceptanceUrl})` };
  }
  if (env.build) {
    return { mode: "build", enforcePerf: true, note: "building a prod preview from the champion worktree (SITC_ACCEPTANCE_BUILD=1)" };
  }
  return {
    mode: "dev",
    enforcePerf: false,
    note: "DEV server — perf/transfer budgets NOT enforced (unbundled/inflated). Set SITC_ACCEPTANCE_URL or SITC_ACCEPTANCE_BUILD=1 for authoritative perf.",
  };
}

// ─── live prod build + serve (operator path) ─────────────────────────────────

export interface PreviewServerOptions {
  /** Worktree to build (the run-branch champion). */
  worktreePath: string;
  /** Port for the standalone node server. Default 4500. */
  port?: number;
  host?: string;
  /** Run DB the prod engine resolves businesses from (the seeded run-scoped DB). */
  databaseUrl?: string;
  /** Build timeout (ms). Default 600s — a cold prod build is slow. */
  buildTimeoutMs?: number;
  /** Readiness timeout (ms). Default 120s. */
  readyTimeoutMs?: number;
  log?: (m: string) => void;
}

export interface PreviewServer {
  url: string;
  stop: () => Promise<void>;
}

function run(cmd: string, args: string[], cwd: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, timeout, maxBuffer: 1024 * 1024 * 64 }, (err, _o, stderr) => {
      if (err) reject(new Error(`${cmd} ${args.join(" ")} failed: ${String(stderr).split("\n").slice(-15).join("\n") || err.message}`));
      else resolve();
    });
  });
}

/**
 * Build the engine in the worktree and start the @astrojs/node standalone server.
 * Returns the base URL + a stop(). Used once at run end for the acceptance gate.
 */
export async function buildAndServePreview(opts: PreviewServerOptions): Promise<PreviewServer> {
  const log = opts.log ?? (() => {});
  const port = opts.port ?? 4500;
  const host = opts.host ?? "127.0.0.1";
  const engineDir = path.join(opts.worktreePath, "apps", "engine");

  log(`building prod preview (pnpm --filter @mshorizon/engine build) …`);
  await run("pnpm", ["--filter", "@mshorizon/engine", "build"], opts.worktreePath, opts.buildTimeoutMs ?? 600_000);

  const entry = path.join(engineDir, "dist", "server", "entry.mjs");
  const proc: ChildProcess = spawn("node", [entry], {
    cwd: engineDir,
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
      SITC_HARNESS_FS: "1",
      ...(opts.databaseUrl ? { DATABASE_URL: opts.databaseUrl } : {}),
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  const url = `http://${host}:${port}`;
  let exited: string | null = null;
  proc.once("exit", (code) => { exited = `preview server exited (code ${code})`; });

  const deadline = Date.now() + (opts.readyTimeoutMs ?? 120_000);
  while (Date.now() < deadline) {
    if (exited) throw new Error(exited);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.status > 0) { log(`prod preview ↑ ${url}`); break; }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const stop = async () => {
    try {
      if (proc.pid) process.kill(-proc.pid, "SIGTERM");
    } catch {
      try { proc.kill("SIGTERM"); } catch { /* gone */ }
    }
  };
  return { url, stop };
}
