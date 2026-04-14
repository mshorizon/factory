import type { BusinessProfile, Page, Section, SectionType, SectionHeader } from "@mshorizon/schema";
import { getMajorThemeVariant } from "@mshorizon/ui";

// Default variant for each section type
const DEFAULT_VARIANTS: Record<SectionType, string> = {
  hero: "default",
  services: "grid",
  categories: "carousel",
  about: "story",
  "about-summary": "default",
  mission: "default",
  contact: "centered",
  shop: "grid",
  gallery: "default",
  testimonials: "default",
  process: "default",
  serviceArea: "default",
  trustBar: "default",
  galleryBA: "default",
  faq: "default",
  features: "default",
  ctaBanner: "default",
  blog: "default",
  "blog-standalone": "default",
  map: "default",
  ref: "default",
  booking: "default",
  pricing: "default",
  project: "grid",
  comparison: "default",
  team: "default",
  events: "default",
  files: "default",
};

/**
 * Get pages object from business data
 */
export function getPages(businessData: BusinessProfile): Record<string, Page> {
  return businessData.pages || {};
}

/**
 * Find a page by its slug
 */
export function findPageBySlug(
  businessData: BusinessProfile,
  slug: string
): Page | undefined {
  const pages = getPages(businessData);
  const normalizedSlug = slug || "home";
  return pages[normalizedSlug];
}

/**
 * Get all valid slugs for static path generation
 */
export function getAllSlugs(businessData: BusinessProfile): string[] {
  const pages = getPages(businessData);
  return Object.keys(pages);
}

/**
 * Get variant for a section with default fallback.
 * Priority: section.variant > majorTheme default > DEFAULT_VARIANTS > "default"
 */
export function getSectionVariant(section: Section, majorTheme?: string): string {
  if (section.variant) return section.variant;
  const themeVariant = getMajorThemeVariant(majorTheme, section.type);
  if (themeVariant) return themeVariant;
  return DEFAULT_VARIANTS[section.type] || "default";
}

/**
 * Get layout configuration with defaults
 */
export function getLayoutConfig(businessData: BusinessProfile) {
  const layout = businessData.layout || {};
  return {
    navbar: {
      variant: layout.navbar?.variant || "standard",
      extensions: layout.navbar?.extensions || [],
      logoText: (layout.navbar as any)?.logoText || undefined,
      hideBorderOnTop: (layout.navbar as any)?.hideBorderOnTop || false,
      hideCta: (layout.navbar as any)?.hideCta || false,
      showSocials: (layout.navbar as any)?.showSocials !== false,
      showAvailability: (layout.navbar as any)?.showAvailability !== false,
    },
    footer: {
      variant: layout.footer?.variant || "simple",
      copyright: layout.footer?.copyright,
      tagline: layout.footer?.tagline,
      links: layout.footer?.links || [],
      columns: layout.footer?.columns || [],
      extensions: layout.footer?.extensions || [],
    },
  };
}

/**
 * Get navigation links from pages object
 */
export function getNavLinks(businessData: BusinessProfile): { label: string; href: string }[] {
  const pages = getPages(businessData);
  const slugs = Object.keys(pages);

  slugs.sort((a, b) => {
    if (a === "home") return -1;
    if (b === "home") return 1;
    if (a === "contact") return 1;
    if (b === "contact") return -1;
    return a.localeCompare(b);
  });

  const links = slugs
    .filter((slug) => !pages[slug].hideFromNav)
    .map((slug) => ({
      label: (pages[slug] as any).navLabel || pages[slug].title,
      href: slug === "home" ? "/" : `/${slug}`,
    }));

  // Always add blog link if not already present (insert before contact)
  if (!slugs.includes("blog")) {
    const contactIndex = links.findIndex((l) => l.href === "/contact");
    const blogLink = { label: "Blog", href: "/blog" };
    if (contactIndex !== -1) {
      links.splice(contactIndex, 0, blogLink);
    } else {
      links.push(blogLink);
    }
  }

  return links;
}

/**
 * Extract header information from a section
 */
export function getSectionHeader(section: Section): SectionHeader {
  return section.header || {};
}
