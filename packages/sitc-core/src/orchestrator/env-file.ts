/**
 * .env fallback for the SITC daemons (todo I40).
 *
 * PM2 captures `env:` values when the ecosystem config FIRST loads — a later
 * `export DATABASE_URL=… && pm2 restart` silently keeps the stale/empty value.
 * The scripts therefore fall back to reading the repo's `apps/engine/.env`
 * (the same file the render engines already symlink) when the env var is unset,
 * so an un-exported shell can't brick the GC cron or the runner.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export async function envFileFallback(repoRoot: string, key: string): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(path.join(repoRoot, "apps", "engine", ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === key) {
        const v = m[2].replace(/^["']|["']$/g, "");
        if (v) return v;
      }
    }
  } catch {
    /* no env file — caller decides how to fail */
  }
  return undefined;
}
