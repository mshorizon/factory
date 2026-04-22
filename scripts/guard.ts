#!/usr/bin/env node
/**
 * Protected-client impact guard.
 *
 * Auto-discovers all templates with a .protected marker file, then warns
 * when the current branch touches components used by any of them.
 *
 * Usage:
 *   pnpm guard                    — check and block if impact found
 *   GUARD_ACCEPT=1 pnpm guard     — warn but exit 0 (you accept the impact)
 *   GUARD_ACCEPT=portfolio-law pnpm guard  — accept impact for one specific client
 *
 * As a pre-push hook (.husky/pre-push):
 *   pnpm tsx scripts/guard.ts
 */
import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES_DIR = join(ROOT, "templates");

// Section type → component file path
const SECTION_MAP: Record<string, string> = {
  "hero":            "apps/engine/src/components/sections/HeroSection.astro",
  "services":        "apps/engine/src/components/sections/ServicesSection.astro",
  "about-summary":   "apps/engine/src/components/sections/AboutSummarySection.astro",
  "features":        "apps/engine/src/components/sections/FeaturesSection.astro",
  "testimonials":    "apps/engine/src/components/sections/TestimonialsSection.astro",
  "faq":             "apps/engine/src/components/sections/FAQSection.astro",
  "blog":            "apps/engine/src/components/sections/BlogSection.astro",
  "contact":         "apps/engine/src/components/sections/ContactSection.astro",
  "about":           "apps/engine/src/components/sections/AboutSection.astro",
  "files":           "apps/engine/src/components/sections/FilesSection.astro",
  "map":             "apps/engine/src/components/sections/MapSection.astro",
  "blog-standalone": "apps/engine/src/components/sections/BlogStandaloneSection.astro",
  "pricing":         "apps/engine/src/components/sections/PricingSection.astro",
  "gallery":         "apps/engine/src/components/sections/GallerySection.astro",
  "gallery-ba":      "apps/engine/src/components/sections/GalleryBASection.astro",
  "cta-banner":      "apps/engine/src/components/sections/CTABannerSection.astro",
  "team":            "apps/engine/src/components/sections/TeamSection.astro",
  "process":         "apps/engine/src/components/sections/ProcessSection.astro",
  "trust-bar":       "apps/engine/src/components/sections/TrustBarSection.astro",
  "comparison":      "apps/engine/src/components/sections/ComparisonSection.astro",
  "booking":         "apps/engine/src/components/sections/BookingSection.astro",
  "project":         "apps/engine/src/components/sections/ProjectSection.astro",
  "mission":         "apps/engine/src/components/sections/MissionSection.astro",
  "events":          "apps/engine/src/components/sections/EventsSection.astro",
  "service-area":    "apps/engine/src/components/sections/ServiceAreaSection.astro",
  "categories":      "apps/engine/src/components/sections/CategoriesSection.astro",
  "shop":            "apps/engine/src/components/sections/ShopSection.astro",
};

// File path prefixes that affect every page of every site
const GLOBAL_CRITICAL = [
  "apps/engine/src/layouts/",
  "apps/engine/src/pages/index.astro",
  "apps/engine/src/pages/[...slug].astro",
  "apps/engine/src/middleware",
  "packages/config/",
  "packages/ui/src/atoms/",
];

// GUARD_ACCEPT=1         → accept all impacts
// GUARD_ACCEPT=foo,bar   → accept impacts for specific clients
const ACCEPT_RAW = process.env.GUARD_ACCEPT ?? "";
const acceptAll = ACCEPT_RAW === "1" || ACCEPT_RAW === "all";
const acceptedClients = new Set(ACCEPT_RAW.split(",").map((s) => s.trim()).filter(Boolean));

function run(cmd: string): string[] {
  try {
    const out = execSync(cmd, { cwd: ROOT }).toString().trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

function getChangedFiles(): string[] {
  // Committed since diverging from main
  const base = run("git merge-base HEAD main")[0] ?? "HEAD";
  const committed = run(`git diff --name-only ${base}..HEAD`);
  // Staged (not yet committed)
  const staged = run("git diff --name-only --cached");
  // Unstaged working tree changes
  const unstaged = run("git diff --name-only");

  return [...new Set([...committed, ...staged, ...unstaged])];
}

function getProtectedClients(): { name: string; sections: Set<string> }[] {
  const dirs = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const clients = [];
  for (const name of dirs) {
    const marker = join(TEMPLATES_DIR, name, ".protected");
    if (!existsSync(marker)) continue;

    const jsonPath = join(TEMPLATES_DIR, name, `${name}.json`);
    if (!existsSync(jsonPath)) continue;

    const json = JSON.parse(readFileSync(jsonPath, "utf-8"));
    const sections = new Set<string>();
    for (const page of Object.values(json.pages ?? {}) as { sections?: { type: string }[] }[]) {
      for (const section of page.sections ?? []) {
        sections.add(section.type);
      }
    }
    clients.push({ name, sections });
  }
  return clients;
}

const changed = getChangedFiles();
const clients = getProtectedClients();

if (clients.length === 0) {
  console.log("✅  No protected clients found.");
  process.exit(0);
}

type Hit = { client: string; sections: string[]; global: string[] };
const hits: Hit[] = [];

for (const { name, sections } of clients) {
  const hitSections: string[] = [];
  const hitGlobal: string[] = [];

  for (const section of sections) {
    const file = SECTION_MAP[section];
    if (file && changed.some((c) => c === file)) {
      hitSections.push(`    ${section.padEnd(16)} → ${file}`);
    }
  }

  for (const prefix of GLOBAL_CRITICAL) {
    const matched = changed.filter((c) => c.startsWith(prefix));
    for (const m of matched) {
      hitGlobal.push(`    ${m}`);
    }
  }

  if (hitSections.length > 0 || hitGlobal.length > 0) {
    hits.push({ client: name, sections: hitSections, global: hitGlobal });
  }
}

if (hits.length === 0) {
  console.log("✅  No protected clients affected.");
  process.exit(0);
}

const accepted = acceptAll || hits.every((h) => acceptedClients.has(h.client));

console.error("\n⚠️  PROTECTED CLIENT IMPACT DETECTED");
console.error("══════════════════════════════════════════════════");

for (const { client, sections, global } of hits) {
  const tag = acceptAll || acceptedClients.has(client) ? " [accepted]" : "";
  console.error(`\n  ${client}${tag}`);
  if (sections.length > 0) {
    console.error("  Section components:");
    sections.forEach((l) => console.error(l));
  }
  if (global.length > 0) {
    console.error("  Global (all pages affected):");
    global.forEach((l) => console.error(l));
  }
}

if (accepted) {
  console.error("\n  Impact accepted via GUARD_ACCEPT. Continuing.\n");
  process.exit(0);
}

console.error("\nTo push anyway (you accept the impact):");
console.error(`  GUARD_ACCEPT=1 git push`);
console.error(`  GUARD_ACCEPT=${hits.map((h) => h.client).join(",")} git push`);
console.error("\nOr update visual baselines if the change is intentional:");
console.error(`  pnpm test:visual:update -- --grep "client-regression"\n`);

process.exit(1);
