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

/**
 * Template-JSON matcher, SCOPED to the run's own template when `templateName` is
 * given — a worker must NEVER edit another business's template (it would corrupt
 * an unrelated live site). With no name, falls back to "any template" (used by
 * the one-shot clone skill / tests).
 */
function templateJsonMatcher(templateName?: string): (f: string) => boolean {
  if (templateName) {
    const prefix = `templates/${templateName}/`;
    return (f) => f.startsWith(prefix) && f.endsWith(".json");
  }
  return (f) => /^templates\/[^/]+\/[^/]+\.json$/.test(f);
}
const isUiSectionOrAtom = (f: string) => /^packages\/ui\/src\/(sections|atoms)\//.test(f);
const isDispatchBranch = (f: string) =>
  /^apps\/engine\/src\/components\/sections\/[A-Za-z]+Section\.astro$/.test(f);
/** Global-chrome dispatch (navbar/footer evolve units edit these, not a *Section.astro). */
const isChromeDispatch = (f: string) =>
  f === "apps/engine/src/components/Navbar.astro" || f === "apps/engine/src/components/Footer.astro";
const isSchema = (f: string) => f === "packages/schema/src/business.schema.json";
const isDispatcherRegistry = (f: string) => f === "apps/engine/src/components/SectionDispatcher.astro";
const isPagesDefaults = (f: string) => f === "apps/engine/src/lib/pages.ts";

function allowFor(strategy: MutationStrategy, templateName?: string): (f: string) => boolean {
  const isTemplateJson = templateJsonMatcher(templateName);
  switch (strategy) {
    case "tune-json":
      return isTemplateJson;
    case "extend-variant":
    case "new-variant":
      return (f) => isTemplateJson(f) || isUiSectionOrAtom(f) || isDispatchBranch(f) || isChromeDispatch(f);
    case "new-section":
      return (f) =>
        isTemplateJson(f) ||
        isUiSectionOrAtom(f) ||
        isDispatchBranch(f) ||
        isChromeDispatch(f) ||
        isSchema(f) ||
        isDispatcherRegistry(f) ||
        isPagesDefaults(f);
  }
}

export interface AllowlistResult {
  allowed: boolean;
  violations: string[];
}

export interface AllowlistOptions {
  /** Scope template-JSON writes to ONLY this template's dir (the run's template). */
  templateName?: string;
}

/** Check a challenger's changed files against the allowlist for its strategy. */
export function checkAllowlist(
  changedFiles: string[],
  strategy: MutationStrategy,
  opts: AllowlistOptions = {},
): AllowlistResult {
  const allow = allowFor(strategy, opts.templateName);
  const violations = changedFiles.filter((f) => isForbidden(f) || !allow(f));
  return { allowed: violations.length === 0, violations };
}
