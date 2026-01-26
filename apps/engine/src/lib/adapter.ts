import type {
  BusinessProfile,
  BusinessProfileV15,
  ThemeV15,
  PageV15,
  SectionV15,
  NavLinkV15,
  FooterColumnV15,
  Target,
  CTAV15,
  Section,
} from "@mshorizon/schema";
import { hrefToTarget } from "./target";

// v1.0 Theme structure
interface ThemeV10 {
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    foreground: string;
    muted?: string;
    border?: string;
  };
  typography?: {
    fontFamily?: {
      sans?: string;
      heading?: string;
    };
    fontSize?: {
      base?: string;
      heading?: string;
    };
  };
  borderRadius?: {
    small?: string;
    default?: string;
    large?: string;
    full?: string;
  };
  shadows?: {
    small?: string;
    default?: string;
    large?: string;
  };
}

/**
 * Detects the schema version of the business data
 */
export function detectSchemaVersion(data: unknown): "1.0" | "1.5" {
  if (data && typeof data === "object" && "schemaVersion" in data) {
    const version = (data as { schemaVersion: string }).schemaVersion;
    if (version === "1.5") return "1.5";
  }
  return "1.0";
}

/**
 * Converts a v1.0 CTAButton { label, href } to v1.5 CTAV15 { label, target }
 */
function adaptCTA(cta?: { label: string; href: string }): CTAV15 | undefined {
  if (!cta) return undefined;
  return {
    label: cta.label,
    target: hrefToTarget(cta.href),
  };
}

/**
 * Converts a v1.0 NavLink { label, href } to v1.5 NavLinkV15 { label, target }
 */
function adaptNavLink(link: { label: string; href: string }): NavLinkV15 {
  return {
    label: link.label,
    target: hrefToTarget(link.href),
  };
}

/**
 * Converts a v1.0 Section to v1.5 SectionV15
 */
function adaptSection(section: Section): SectionV15 {
  const { badge, title, subtitle, cta, secondaryCta, ...rest } = section;

  const adapted: SectionV15 = {
    ...rest,
    header:
      badge || title || subtitle
        ? {
            badge,
            title,
            subtitle,
          }
        : undefined,
    cta: adaptCTA(cta),
    secondaryCta: adaptCTA(secondaryCta),
  };

  return adapted;
}

/**
 * Converts v1.0 theme to v1.5 theme structure
 */
function adaptTheme(theme: ThemeV10): ThemeV15 {
  const isLightMode =
    theme.colors.background.toLowerCase() > theme.colors.foreground.toLowerCase();

  return {
    mode: isLightMode ? "light" : "dark",
    colors: {
      light: {
        primary: theme.colors.primary,
        surface: {
          base: theme.colors.background,
          alt: theme.colors.secondary,
        },
        text: {
          main: theme.colors.foreground,
          muted: theme.colors.muted || "#64748b",
          onPrimary: "#ffffff",
        },
      },
    },
    typography: {
      primary: theme.typography?.fontFamily?.sans || "system-ui, -apple-system, sans-serif",
      secondary: theme.typography?.fontFamily?.heading,
      baseSize: theme.typography?.fontSize?.base || "16px",
    },
    ui: {
      radius: theme.borderRadius?.default || "0.5rem",
      buttonStyle: "default",
    },
  };
}

/**
 * Converts a v1.0 BusinessProfile + separate theme to v1.5 BusinessProfileV15
 */
export function adaptV10ToV15(business: BusinessProfile, theme: ThemeV10): BusinessProfileV15 {
  // Convert pages array to object keyed by slug
  const pagesObject: Record<string, PageV15> = {};
  for (const page of business.pages) {
    const key = page.slug === "index" ? "home" : page.slug;
    pagesObject[key] = {
      title: page.title,
      sections: page.sections.map(adaptSection),
    };
  }

  // Convert footer links
  const footerLinks = business.layout.footer?.links?.map(adaptNavLink);
  const footerColumns: FooterColumnV15[] | undefined = business.layout.footer?.columns?.map(
    (col) => ({
      title: col.title,
      links: col.links.map(adaptNavLink),
    })
  );

  return {
    schemaVersion: "1.5",
    business: {
      id: business.id,
      name: business.name,
      industry: business.industry,
    },
    theme: adaptTheme(theme),
    layout: {
      navbar: business.layout.navbar,
      footer: business.layout.footer
        ? {
            variant: business.layout.footer.variant,
            copyright: business.layout.footer.copyright,
            tagline: business.layout.footer.tagline,
            links: footerLinks,
            columns: footerColumns,
          }
        : undefined,
    },
    navigation: {
      cta: adaptCTA(business.navigation?.cta),
    },
    pages: pagesObject,
  };
}
