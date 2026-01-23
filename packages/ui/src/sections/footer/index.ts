import { FooterSimple } from "./FooterSimple";
import { FooterMultiColumn } from "./FooterMultiColumn";

export { FooterSimple } from "./FooterSimple";
export { FooterMultiColumn } from "./FooterMultiColumn";
export type { FooterProps, FooterLink, SocialLink, FooterColumn } from "./types";

// Re-export simple as default Footer for backwards compatibility
export { FooterSimple as Footer } from "./FooterSimple";

// Variant selector factory
export function getFooterVariant(variant?: string) {
  switch (variant) {
    case "multiColumn":
      return FooterMultiColumn;
    case "simple":
    default:
      return FooterSimple;
  }
}
