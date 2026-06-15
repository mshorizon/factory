/**
 * Worker write-allowlist (DESIGN §15, ADR-0020 #11).
 *
 * SECURITY-CRITICAL: a worker's edits can auto-merge to `develop`, so what it
 * may touch is a hard boundary, enforced on the challenger's diff at the sanity
 * gate (§5.2a). Pure + deterministic so it's exhaustively unit-tested.
 *
 * Path-level only. The "no `apps/engine` import in `packages/ui`" and "no new
 * dependencies" rules are content-level and enforced by build/type-check + a
 * grep in the sanity gate (see sanity.ts).
 */
import type { MutationStrategy } from "../types.js";

/** Never writable by any strategy. */
function isForbidden(f: string): boolean {
  return (
    /(^|\/)package\.json$/.test(f) || // no dependency changes
    /(^|\/)\.env/.test(f) ||
    /(^|\/)(\.github|\.husky|node_modules|dist|\.git)\//.test(f) ||
    /(pnpm-lock\.yaml|turbo\.json|drizzle\.config|tsconfig.*\.json)$/.test(f) ||
    /(^|\/)\.claude\//.test(f)
  );
}

const isTemplateJson = (f: string) => /^templates\/[^/]+\/[^/]+\.json$/.test(f);
const isUiSectionOrAtom = (f: string) => /^packages\/ui\/src\/(sections|atoms)\//.test(f);
const isDispatchBranch = (f: string) =>
  /^apps\/engine\/src\/components\/sections\/[A-Za-z]+Section\.astro$/.test(f);
const isSchema = (f: string) => f === "packages/schema/src/business.schema.json";
const isDispatcherRegistry = (f: string) => f === "apps/engine/src/components/SectionDispatcher.astro";
const isPagesDefaults = (f: string) => f === "apps/engine/src/lib/pages.ts";

function allowFor(strategy: MutationStrategy): (f: string) => boolean {
  switch (strategy) {
    case "tune-json":
      return isTemplateJson;
    case "extend-variant":
    case "new-variant":
      return (f) => isTemplateJson(f) || isUiSectionOrAtom(f) || isDispatchBranch(f);
    case "new-section":
      return (f) =>
        isTemplateJson(f) ||
        isUiSectionOrAtom(f) ||
        isDispatchBranch(f) ||
        isSchema(f) ||
        isDispatcherRegistry(f) ||
        isPagesDefaults(f);
  }
}

export interface AllowlistResult {
  allowed: boolean;
  violations: string[];
}

/** Check a challenger's changed files against the allowlist for its strategy. */
export function checkAllowlist(changedFiles: string[], strategy: MutationStrategy): AllowlistResult {
  const allow = allowFor(strategy);
  const violations = changedFiles.filter((f) => isForbidden(f) || !allow(f));
  return { allowed: violations.length === 0, violations };
}
