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
  templateShowcase: "default",
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
      logoAccent: (layout.navbar as any)?.logoAccent || undefined,
      logoSubtext: (layout.navbar as any)?.logoSubtext || undefined,
      hideLogoIcon: (layout.navbar as any)?.hideLogoIcon || false,
      hideBorderOnTop: (layout.navbar as any)?.hideBorderOnTop || false,
      hideCta: (layout.navbar as any)?.hideCta || false,
      hideBlog: (layout.navbar as any)?.hideBlog || false,
      showSocials: (layout.navbar as any)?.showSocials !== false,
      showAvailability: (layout.navbar as any)?.showAvailability !== false,
      showAddress: (layout.navbar as any)?.showAddress !== false,
      showAdditionalInfo: (layout.navbar as any)?.showAdditionalInfo !== false,
    },
    footer: {
      name: layout.footer?.name,
      variant: layout.footer?.variant || "simple",
      background: layout.footer?.background,
      hidePagesColumn: (layout.footer as any)?.hidePagesColumn || false,
      hideAutoContactColumn: (layout.footer as any)?.hideAutoContactColumn || false,
      copyright: layout.footer?.copyright,
      tagline: layout.footer?.tagline,
      links: layout.footer?.links || [],
      columns: layout.footer?.columns || [],
      extensions: layout.footer?.extensions || [],
      flag: layout.footer?.flag,
      findUsTitle: layout.footer?.findUsTitle,
      hoursTitle: layout.footer?.hoursTitle,
      hours: layout.footer?.hours,
      signature: layout.footer?.signature,
    },
    hideBreadcrumbs: (layout as any)?.hideBreadcrumbs || false,
    blog: {
      postVariant: (layout as any)?.blog?.postVariant ?? "default",
    },
  };
}

/**
 * Get navigation links from pages object, merged with navigation.links (external links).
 */
export function getNavLinks(businessData: BusinessProfile): { label: string; href: string; external?: boolean }[] {
  const pages = getPages(businessData);
  const slugs = Object.keys(pages);

  slugs.sort((a, b) => {
    if (a === "home") return -1;
    if (b === "home") return 1;
    if (a === "contact") return 1;
    if (b === "contact") return -1;
    const orderA = (pages[a] as any).navOrder ?? Infinity;
    const orderB = (pages[b] as any).navOrder ?? Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  const links: { label: string; href: string; external?: boolean }[] = slugs
    .filter((slug) => !pages[slug].hideFromNav)
    .map((slug) => ({
      label: (pages[slug] as any).navLabel || pages[slug].title,
      href: slug === "home" ? "/" : `/${slug}`,
    }));

  // Inject navigation.links (supports external targets) before blog/contact
  const extraLinks = ((businessData.navigation as any)?.links ?? []).map((link: any) => {
    const target = link.target;
    if (target?.type === "external") return { label: link.label, href: target.value, external: true };
    if (target?.type === "page") return { label: link.label, href: `/${target.value}` };
    if (target?.type === "section") return { label: link.label, href: `#${target.value}` };
    return { label: link.label, href: link.href ?? "#" };
  });

  if (extraLinks.length > 0) {
    const contactIndex = links.findIndex((l) => l.href === "/contact");
    const insertAt = contactIndex !== -1 ? contactIndex : links.length;
    links.splice(insertAt, 0, ...extraLinks);
  }

  // Always add blog link if not already present (insert before contact),
  // unless explicitly hidden via layout.navbar.hideBlog
  const hideBlog = (businessData.layout as any)?.navbar?.hideBlog === true;
  if (!hideBlog && !slugs.includes("blog")) {
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
