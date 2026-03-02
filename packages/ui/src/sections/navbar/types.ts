import type { Target, Cta, Link } from "@mshorizon/schema";

export type NavbarLayoutVariant = "standard" | "centered";
export type NavbarStyleVariant = "solid" | "transparent";

// Helper to get href from a link
export function getLinkHref(
  link: Link,
  resolveTarget?: (target: Target) => string
): string {
  if (link.target && resolveTarget) {
    return resolveTarget(link.target);
  }
  return "#";
}

// Helper to get CTA href
export function getCTAHref(
  cta: Cta,
  resolveTarget?: (target: Target) => string
): string {
  if (cta.target && resolveTarget) {
    return resolveTarget(cta.target);
  }
  return "#";
}

export interface NavbarProps {
  logo: string;
  logoIcon?: React.ReactNode;
  links: Link[];
  cta?: Cta;
  currentLanguage?: string;
  variant?: NavbarLayoutVariant | NavbarStyleVariant;
  sticky?: boolean;
  className?: string;
  resolveTarget?: (target: Target) => string;
}
