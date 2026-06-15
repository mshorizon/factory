/**
 * assembleAuthoringKit — the "warm start" for a worker (DESIGN §4.2).
 *
 * Gathers, for one section type: the existing variant component sources, the
 * `{Type}Section.astro` dispatch wiring to follow, the section's JSON-schema
 * slice (additive edits target this), the list of available variants, and the
 * locked theme/atom tokens. So a worker authors instead of exploring the repo.
 *
 * Robust by design: missing optional pieces yield empty strings, never throws.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { businessSchema } from "@mshorizon/schema";
import type { AuthoringKit, Theme } from "../types.js";

/** sectionType → dispatch component basename, for the irregular cases. */
const DISPATCH_OVERRIDES: Record<string, string> = {
  ctaBanner: "CTABanner",
  galleryBA: "GalleryBA",
  faq: "FAQ",
  "about-summary": "AboutSummary",
  serviceArea: "ServiceArea",
  "blog-standalone": "BlogStandalone",
};

function pascalCase(type: string): string {
  if (DISPATCH_OVERRIDES[type]) return DISPATCH_OVERRIDES[type];
  return type
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

async function readIfExists(p: string): Promise<string> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}

/** Best-effort extraction of the `section` definition from the JSON schema. */
function sectionSchemaSlice(): unknown {
  const s = businessSchema as Record<string, any>;
  return s?.$defs?.section ?? s?.definitions?.section ?? null;
}

export interface AssembleKitOptions {
  /** Absolute path to the monorepo root. */
  repoRoot: string;
  sectionType: string;
  /** Locked theme + atom tokens the variant must consume as-is (DESIGN §5.1). */
  lockedTokens?: Partial<Theme> & Record<string, unknown>;
}

export async function assembleAuthoringKit(opts: AssembleKitOptions): Promise<AuthoringKit> {
  const { repoRoot, sectionType } = opts;
  const sectionDir = path.join(repoRoot, "packages/ui/src/sections", sectionType);
  const dispatchPath = path.join(
    repoRoot,
    "apps/engine/src/components/sections",
    `${pascalCase(sectionType)}Section.astro`,
  );

  const existingVariants: Record<string, string> = {};
  let entries: string[] = [];
  try {
    entries = await fs.readdir(sectionDir);
  } catch {
    /* no such section dir — leave kit's variant maps empty */
  }
  for (const f of entries) {
    if (f.endsWith(".tsx") && f !== "types.tsx") {
      const variantName = path.basename(f, ".tsx");
      existingVariants[variantName] = await readIfExists(path.join(sectionDir, f));
    }
  }

  return {
    sectionType,
    existingVariants,
    availableVariants: Object.keys(existingVariants),
    dispatchSource: await readIfExists(dispatchPath),
    schemaSlice: sectionSchemaSlice(),
    lockedTokens: opts.lockedTokens ?? {},
  };
}
