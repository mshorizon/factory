import type { Target, CTAV15, NavLinkV15 } from "@mshorizon/schema";

// Legacy v1.0 NavLink (for backwards compatibility)
export interface NavLink {
  label: string;
  href: string;
}

// Type that supports both v1.0 and v1.5 link formats
export type NavLinkCompat = NavLink | NavLinkV15;

export type NavbarLayoutVariant = "standard" | "centered";
export type NavbarStyleVariant = "solid" | "transparent";

// Type guard to check if a link is v1.5 format
export function isNavLinkV15(link: NavLinkCompat): link is NavLinkV15 {
  return "target" in link;
}

// Helper to get href from either link format
export function getLinkHref(
  link: NavLinkCompat,
  resolveTarget?: (target: Target) => string
): string {
  if (isNavLinkV15(link)) {
    return resolveTarget ? resolveTarget(link.target) : "#";
  }
  return link.href;
}

// Type for CTA that supports both formats
export type CTACompat = { label: string; href: string } | CTAV15;

// Type guard for CTA
export function isCTAV15(cta: CTACompat): cta is CTAV15 {
  return "target" in cta;
}

// Helper to get CTA href
export function getCTAHref(
  cta: CTACompat,
  resolveTarget?: (target: Target) => string
): string {
  if (isCTAV15(cta)) {
    return resolveTarget ? resolveTarget(cta.target) : "#";
  }
  return cta.href;
}

export interface NavbarProps {
  logo: string;
  logoIcon?: React.ReactNode;
  links: NavLinkCompat[];
  cta?: CTACompat;
  currentLanguage?: string;
  variant?: NavbarLayoutVariant | NavbarStyleVariant;
  sticky?: boolean;
  className?: string;
  // v1.5: Optional target resolver function
  resolveTarget?: (target: Target) => string;
}
