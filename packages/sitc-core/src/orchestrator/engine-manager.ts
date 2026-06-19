/**
 * Per-worktree render engine (DESIGN §4.4 fidelity fix).
 *
 * THE BUG THIS FIXES: the inner-loop renderer used to screenshot through ONE
 * shared engine running the main repo's code, swapping only the JSON profile.
 * So `extend-variant`/`new-variant`/`new-section` edits — which live in the
 * worktree's `packages/ui` — were invisible: the engine resolved `@mshorizon/ui`
 * back to the main repo via the symlinked node_modules, and Vite had already
 * built its module graph at startup. The scorer judged the UNCHANGED base, so
 * every component-level promotion was noise.
 *
 * THE FIX: launch a dedicated `astro dev` FROM the worker's worktree. Its
 * `__dirname` is the worktree's `apps/engine`, and (with SITC_RENDER_ENGINE=1)
 * astro.config aliases `@mshorizon/ui` to `<that tree>/packages/ui/src`, so the
 * engine renders the worker's actual edited components. One engine per worktree,
 * each on its own port; LRU-capped + torn down at run end.
 */
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";

export interface EngineManagerOptions {
  /** Main repo root — source of the apps/engine/.env the worktree engines reuse. */
  repoRoot: string;
  /** First port to allocate; each live engine takes the next free one. Default 4400. */
  basePort?: number;
  /** Max concurrently-running engines before the least-recently-used is stopped. Default 5. */
  maxEngines?: number;
  /** Readiness/health probe timeout per engine (ms). Default 90s (cold Vite compile). */
  readyTimeoutMs?: number;
  /** Optional sink for engine lifecycle logs. */
  log?: (msg: string) => void;
}

interface Engine {
  worktreePath: string;
  port: number;
  baseUrl: string;
  proc: ChildProcess;
  lastUsed: number;
}

export class EngineManager {
  private readonly repoRoot: string;
  private readonly basePort: number;
  private readonly maxEngines: number;
  private readonly readyTimeoutMs: number;
  private readonly log: (msg: string) => void;
  private readonly engines = new Map<string, Engine>();
  /** Serialize start() so concurrent callers don't grab the same port. */
  private startChain: Promise<unknown> = Promise.resolve();
  private clock = 0;

  constructor(opts: EngineManagerOptions) {
    this.repoRoot = opts.repoRoot;
    this.basePort = opts.basePort ?? 4400;
    this.maxEngines = opts.maxEngines ?? 5;
    this.readyTimeoutMs = opts.readyTimeoutMs ?? 90_000;
    this.log = opts.log ?? (() => {});
  }

  /**
   * Get (or start) the render engine for a worktree; returns its base URL.
   * `warmupUrl` (the exact section page that will be screenshotted) is compiled
   * before returning — SERIALIZED with startup, so only one cold Vite compile
   * runs at a time. Without this, N workers cold-compile concurrently and every
   * screenshot's visibility-wait times out (the run-#22 failure mode).
   */
  async ensure(worktreePath: string, opts: { warmupUrl?: string } = {}): Promise<string> {
    const existing = this.engines.get(worktreePath);
    if (existing) {
      existing.lastUsed = ++this.clock;
      return existing.baseUrl;
    }
    // Serialize startup + warm-up to avoid port races AND concurrent cold compiles.
    const result = this.startChain.then(() => this.start(worktreePath, opts.warmupUrl));
    this.startChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private firstFreePort(): number {
    const used = new Set([...this.engines.values()].map((e) => e.port));
    for (let p = this.basePort; p < this.basePort + 200; p++) if (!used.has(p)) return p;
    throw new Error("EngineManager: no free port in range");
  }

  private async start(worktreePath: string, warmupUrl?: string): Promise<string> {
    // Evict the least-recently-used engine if at capacity.
    if (this.engines.size >= this.maxEngines) {
      const lru = [...this.engines.values()].sort((a, b) => a.lastUsed - b.lastUsed)[0];
      if (lru) await this.stop(lru.worktreePath);
    }

    const engineDir = path.join(worktreePath, "apps", "engine");
    await this.ensureEnv(engineDir);
    const port = this.firstFreePort();
    const astroBin = path.join(engineDir, "node_modules", ".bin", "astro");
    const proc = spawn(astroBin, ["dev", "--host", "127.0.0.1", "--port", String(port)], {
      cwd: engineDir,
      env: {
        ...process.env,
        SITC_RENDER_ENGINE: "1", // unlocks the worktree @mshorizon/ui alias
        SITC_HARNESS_FS: "1", // allow profilePath reads even if DEV is somehow unset
        PORT: String(port),
        BROWSER: "none",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.stdout?.on("data", () => {});
    proc.stderr?.on("data", () => {});

    const baseUrl = `http://127.0.0.1:${port}`;
    const engine: Engine = { worktreePath, port, baseUrl, proc, lastUsed: ++this.clock };
    this.engines.set(worktreePath, engine);

    let exited: string | null = null;
    proc.once("exit", (code) => {
      exited = `engine exited (code ${code}) before ready`;
      this.engines.delete(worktreePath);
    });

    this.log(`engine ↑ port ${port} (${path.basename(path.dirname(worktreePath))}/${path.basename(worktreePath)})`);
    await this.waitReady(baseUrl, () => exited);
    // Compile the actual section page now (serialized) so the screenshot pass is warm.
    if (warmupUrl) {
      const wu = warmupUrl.replace(/^https?:\/\/[^/]+/, baseUrl); // retarget to this engine's port
      await this.warmup(wu, () => exited);
    }
    return baseUrl;
  }

  /** Poll the real section page until it compiles + emits the section node (or times out). */
  private async warmup(url: string, exited: () => string | null): Promise<void> {
    const deadline = Date.now() + this.readyTimeoutMs;
    while (Date.now() < deadline) {
      if (exited()) return; // engine died — let the render surface the error
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (res.status === 200) {
          const html = await res.text();
          if (html.includes('data-section-index="0"')) return; // compiled + section present
        } else {
          await res.text().catch(() => {});
        }
      } catch {
        /* still compiling */
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  /** Astro reads .env from its project dir; worktrees don't carry it (gitignored). */
  private async ensureEnv(engineDir: string): Promise<void> {
    const dst = path.join(engineDir, ".env");
    if (await fs.access(dst).then(() => true).catch(() => false)) return;
    const src = path.join(this.repoRoot, "apps", "engine", ".env");
    if (await fs.access(src).then(() => true).catch(() => false)) {
      await fs.symlink(src, dst).catch(() => {});
    }
  }

  private async waitReady(baseUrl: string, exited: () => string | null): Promise<void> {
    const deadline = Date.now() + this.readyTimeoutMs;
    const probe = `${baseUrl}/sitc-harness/section?business=__probe__&index=0`;
    while (Date.now() < deadline) {
      const dead = exited();
      if (dead) throw new Error(dead);
      try {
        // Any HTTP response (even 400/404/500) means the server is up and routing.
        const res = await fetch(probe, { signal: AbortSignal.timeout(4000) });
        if (res.status > 0) return;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`engine at ${baseUrl} not ready within ${this.readyTimeoutMs}ms`);
  }

  async stop(worktreePath: string): Promise<void> {
    const e = this.engines.get(worktreePath);
    if (!e) return;
    this.engines.delete(worktreePath);
    this.log(`engine ↓ port ${e.port}`);
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      e.proc.once("exit", done);
      e.proc.kill("SIGTERM");
      // Hard-kill if it doesn't die promptly.
      setTimeout(() => {
        e.proc.kill("SIGKILL");
        resolve();
      }, 4000);
    });
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.engines.keys()].map((w) => this.stop(w)));
  }
}
