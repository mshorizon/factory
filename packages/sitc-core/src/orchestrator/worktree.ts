/**
 * Git worktree manager (DESIGN §5.4).
 *
 * Fixes the concurrency bug the Phase −1 spike flagged: git cannot check out the
 * same branch in multiple worktrees, so parallel workers run on a DETACHED HEAD
 * at the current champion commit. Each worker commits in its own worktree; the
 * orchestrator is the SINGLE WRITER that integrates a winning commit onto the
 * run branch `sitc/run-<id>` (cherry-pick), serialized for overlapping files.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, maxBuffer: 1024 * 1024 * 32 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`git ${args.join(" ")} failed: ${stderr || err.message}`));
      resolve(stdout.trim());
    });
  });
}

export interface WorktreeManagerOptions {
  repoRoot: string;
  /** Where per-worker worktrees are created. Default `<repoRoot>/.sitc/worktrees`. */
  worktreeRoot?: string;
}

export class WorktreeManager {
  readonly repoRoot: string;
  readonly worktreeRoot: string;
  /** Dedupes concurrent `ensureBaseWorktree` calls for the same path (tasks I2). */
  private readonly baseWorktrees = new Map<string, Promise<string>>();

  constructor(opts: WorktreeManagerOptions) {
    this.repoRoot = opts.repoRoot;
    this.worktreeRoot = opts.worktreeRoot ?? path.join(opts.repoRoot, ".sitc", "worktrees");
  }

  branchName(runId: string | number): string {
    return `sitc/run-${runId}`;
  }

  /** Create the run branch at `baseRef` (does not check it out in the main tree). */
  async createRunBranch(runId: string | number, baseRef = "HEAD"): Promise<string> {
    const branch = this.branchName(runId);
    await git(["branch", "-f", branch, baseRef], this.repoRoot);
    return branch;
  }

  /** Current champion commit = tip of the run branch. */
  async champion(runId: string | number): Promise<string> {
    return git(["rev-parse", this.branchName(runId)], this.repoRoot);
  }

  /**
   * Add a detached worktree at the current champion for one worker. The worker
   * mutates + commits here; nothing it does can disturb other worktrees.
   */
  async addWorkerWorktree(runId: string | number, workerId: string): Promise<{ path: string; base: string }> {
    const base = await this.champion(runId);
    // Sanitize the dir name — "#" (from section ids like "hero#0") trips Vite,
    // which treats it as a URL-fragment delimiter in module paths.
    const safeId = String(workerId).replace(/[^A-Za-z0-9._-]/g, "-");
    const wt = path.join(this.worktreeRoot, `run-${runId}`, safeId);
    await fs.mkdir(path.dirname(wt), { recursive: true });
    await git(["worktree", "add", "--detach", wt, base], this.repoRoot);
    await this.linkNodeModules(wt);
    return { path: wt, base };
  }

  /**
   * Acquire a PERSISTENT pooled worktree for a worker slot (tasks I3). Unlike
   * `addWorkerWorktree` (fresh + removed per iteration → cold Vite compile every
   * time), a slot worktree is created once and REUSED across iterations: its render
   * engine stays warm and HMR recompiles only what changed. On each acquire it's
   * reset to the current champion + cleaned of the previous iteration's untracked
   * files, so the worker always starts from a pristine champion checkout. Returns
   * the same `{path, base}` contract as `addWorkerWorktree`. node_modules symlinks
   * are git-excluded, so `clean` preserves them.
   */
  async acquireSlot(runId: string | number, slotId: number | string): Promise<{ path: string; base: string }> {
    const base = await this.champion(runId);
    const safe = String(slotId).replace(/[^A-Za-z0-9._-]/g, "-");
    const wt = path.join(this.worktreeRoot, `run-${runId}`, `slot-${safe}`);
    const present = await fs
      .access(path.join(wt, ".git"))
      .then(() => true)
      .catch(() => false);
    if (present) {
      await git(["reset", "--hard", base], wt);
      await git(["clean", "-fdq"], wt);
    } else {
      await fs.mkdir(path.dirname(wt), { recursive: true });
      await git(["worktree", "add", "--detach", wt, base], this.repoRoot);
      await this.linkNodeModules(wt);
    }
    return { path: wt, base };
  }

  /**
   * Get (creating once) a shared, READ-ONLY detached worktree pinned at a champion
   * commit `baseSha`, named by the short sha so all callers at the same champion
   * reuse it (tasks I2). Unlike per-worker worktrees this is never mutated — it
   * exists purely so a warm render engine can serve that champion's component code
   * while the section's edited JSON is supplied via profilePath. Idempotent +
   * concurrency-safe (dedupes in-flight creates per path). Cleaned up by teardown
   * along with the rest of the run dir.
   */
  async ensureBaseWorktree(runId: string | number, baseSha: string): Promise<string> {
    const short = baseSha.slice(0, 12).replace(/[^A-Za-z0-9]/g, "");
    const wt = path.join(this.worktreeRoot, `run-${runId}`, `__base-${short}`);
    const inflight = this.baseWorktrees.get(wt);
    if (inflight) return inflight;
    const create = (async () => {
      const present = await fs
        .access(path.join(wt, ".git"))
        .then(() => true)
        .catch(() => false);
      if (!present) {
        await fs.mkdir(path.dirname(wt), { recursive: true });
        await git(["worktree", "add", "--detach", wt, baseSha], this.repoRoot);
        await this.linkNodeModules(wt);
      }
      return wt;
    })();
    this.baseWorktrees.set(wt, create);
    try {
      return await create;
    } catch (e) {
      this.baseWorktrees.delete(wt); // allow a retry on failure
      throw e;
    }
  }

  /**
   * Symlink `node_modules` from the main repo into the worktree (root + every
   * workspace package). Git worktrees don't carry node_modules (gitignored), so
   * without this the sanity build's `tsc`/turbo fails with "command not found"
   * and reverts otherwise-valid edits. Symlinks are cheap and point at absolute
   * paths in the main repo, so they resolve from any worktree location.
   */
  async linkNodeModules(worktreePath: string): Promise<void> {
    const relDirs = new Set<string>([""]);
    for (const group of ["apps", "packages"]) {
      try {
        for (const name of await fs.readdir(path.join(this.repoRoot, group))) {
          relDirs.add(path.join(group, name));
        }
      } catch {
        /* group missing — skip */
      }
    }
    for (const rel of relDirs) {
      const src = path.join(this.repoRoot, rel, "node_modules");
      const dst = path.join(worktreePath, rel, "node_modules");
      try {
        await fs.access(src); // only link where the main repo actually has deps
        await fs.rm(dst, { recursive: true, force: true }).catch(() => {});
        await fs.mkdir(path.dirname(dst), { recursive: true });
        await fs.symlink(src, dst, "dir");
      } catch {
        /* no node_modules to link here — skip */
      }
    }
    // The repo's .gitignore uses `node_modules/` (dir-only), which does NOT match
    // the symlinks we just made, so `git add -A` would stage them and trip the
    // write-allowlist. Add a name-only pattern to this worktree's git exclude so
    // git ignores the symlinks entirely (keeps status/diff clean).
    try {
      const excludeRel = (await git(["rev-parse", "--git-path", "info/exclude"], worktreePath)).trim();
      const excludePath = path.isAbsolute(excludeRel) ? excludeRel : path.join(worktreePath, excludeRel);
      await fs.appendFile(excludePath, "\nnode_modules\n**/node_modules\n");
    } catch {
      /* exclude not writable — fall back relies on commit-time filtering */
    }
  }

  /**
   * Soft-reset the worktree to `ref`, keeping working-tree changes. Normalizes
   * the case where the WORKER committed its own edits (it has Bash): without
   * this, `commitInWorktree` sees a clean tree and returns null → the loop drops
   * the work as a no-op. After this, all the worker's changes are uncommitted
   * again and get captured as one clean integrate commit.
   */
  async resetSoftTo(worktreePath: string, ref: string): Promise<void> {
    await git(["reset", "--soft", ref], worktreePath);
  }

  /** Stage everything and commit in a worktree. Returns the sha, or null if nothing changed. */
  async commitInWorktree(worktreePath: string, message: string): Promise<string | null> {
    await git(["add", "-A"], worktreePath);
    const status = await git(["status", "--porcelain"], worktreePath);
    if (!status) return null;
    await git(["commit", "-m", message, "--no-verify"], worktreePath);
    return git(["rev-parse", "HEAD"], worktreePath);
  }

  /** List files a commit changed vs its parent (for the overlap/serialization check, §5.4). */
  async changedFiles(worktreePath: string, sha: string): Promise<string[]> {
    const out = await git(["diff-tree", "--no-commit-id", "--name-only", "-r", sha], worktreePath);
    return out ? out.split("\n").filter(Boolean) : [];
  }

  /**
   * SINGLE-WRITER integrate: cherry-pick a worker's commit onto the run branch.
   * Caller (orchestrator) must serialize this and must serialize commits whose
   * changed files overlap. Returns the new champion sha.
   *
   * todo I19 — conflict recovery. Concurrent sections routinely edit the SAME
   * template JSON; once the champion advances, a later challenger's cherry-pick
   * (based on the older champion) can conflict. Without recovery that left the
   * ops worktree wedged mid-cherry-pick (CHERRY_PICK_HEAD + unmerged paths), so
   * EVERY subsequent promotion failed as a silent "iteration error" no-op and the
   * run burned its remaining budget achieving nothing. Now: self-heal on entry,
   * and on a failed pick abort + hard-reset back to the branch tip and throw a
   * tagged `integrate-conflict:` error — the champion is unchanged, the section's
   * next attempt starts from the NEW champion (so its re-edit applies cleanly),
   * and the critique tells the worker why the promotion was lost.
   */
  async integrate(runId: string | number, commitSha: string): Promise<string> {
    const branch = this.branchName(runId);
    // Work on a temp checkout of the run branch to cherry-pick without touching the main tree.
    const opsWt = path.join(this.worktreeRoot, `run-${runId}`, "__integrate");
    await fs.mkdir(path.dirname(opsWt), { recursive: true });
    const exists = await fs
      .access(path.join(opsWt, ".git"))
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      await git(["worktree", "add", opsWt, branch], this.repoRoot);
    } else {
      // Self-heal: a crash may have left a cherry-pick in progress — abort it and
      // force the tree back onto the branch tip before touching anything else.
      await git(["cherry-pick", "--abort"], opsWt).catch(() => {});
      await git(["checkout", "-f", branch], opsWt);
      await git(["reset", "--hard", branch], opsWt);
    }
    try {
      await git(["cherry-pick", "--allow-empty", commitSha], opsWt);
    } catch (e) {
      await git(["cherry-pick", "--abort"], opsWt).catch(() => {});
      await git(["reset", "--hard", branch], opsWt).catch(() => {});
      throw new Error(
        `integrate-conflict: cherry-pick of ${commitSha.slice(0, 9)} onto ${branch} conflicted ` +
          `(champion unchanged; ops tree recovered — re-edit from the new champion): ${(e as Error).message.slice(0, 200)}`,
      );
    }
    return git(["rev-parse", "HEAD"], opsWt);
  }

  /**
   * Retire superseded `__base-<sha>` worktrees (todo I37) — one accumulates per
   * champion generation (I2) and nothing removed them until run teardown, piling
   * up disk + engine-LRU pressure on promotion-heavy runs. Keeps `keepShas`
   * (callers pass the last few generations, since a same-round iteration may
   * still be rendering from the previous one). `beforeRemove` runs per path
   * BEFORE removal — the runner stops the worktree's engine there.
   */
  async retireBaseWorktrees(
    runId: string | number,
    keepShas: string[],
    opts: { beforeRemove?: (worktreePath: string) => Promise<void> } = {},
  ): Promise<string[]> {
    const keep = new Set(keepShas.map((s) => `__base-${s.slice(0, 12).replace(/[^A-Za-z0-9]/g, "")}`));
    const runDir = path.join(this.worktreeRoot, `run-${runId}`);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(runDir);
    } catch {
      return [];
    }
    const removed: string[] = [];
    for (const name of entries) {
      if (!name.startsWith("__base-") || keep.has(name)) continue;
      const wt = path.join(runDir, name);
      if (opts.beforeRemove) await opts.beforeRemove(wt).catch(() => {});
      await this.removeWorktree(wt);
      this.baseWorktrees.delete(wt);
      removed.push(wt);
    }
    return removed;
  }

  /** Revert specific files in a worktree back to the champion (per-section revert, §5.2). */
  async revertFiles(worktreePath: string, runId: string | number, files: string[]): Promise<void> {
    const base = await this.champion(runId);
    if (files.length) await git(["checkout", base, "--", ...files], worktreePath);
  }

  async removeWorktree(worktreePath: string): Promise<void> {
    await git(["worktree", "remove", "--force", worktreePath], this.repoRoot).catch(() => {});
  }

  /** Tear down all worktrees + (optionally) the branch for a run. */
  async teardown(runId: string | number, opts: { deleteBranch?: boolean } = {}): Promise<void> {
    const runDir = path.join(this.worktreeRoot, `run-${runId}`);
    let workers: string[] = [];
    try {
      workers = await fs.readdir(runDir);
    } catch {
      /* none */
    }
    for (const w of workers) await this.removeWorktree(path.join(runDir, w));
    await git(["worktree", "prune"], this.repoRoot).catch(() => {});
    await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
    if (opts.deleteBranch) {
      await git(["branch", "-D", this.branchName(runId)], this.repoRoot).catch(() => {});
    }
  }
}
