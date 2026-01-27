import { FooterSimple } from "./FooterSimple";
import { FooterMultiColumn } from "./FooterMultiColumn";
import { FooterMinimal } from "./FooterMinimal";
import { FooterCentered } from "./FooterCentered";
import { FooterBranded } from "./FooterBranded";
import { FooterStacked } from "./FooterStacked";

export { FooterSimple } from "./FooterSimple";
export { FooterMultiColumn } from "./FooterMultiColumn";
export { FooterMinimal } from "./FooterMinimal";
export { FooterCentered } from "./FooterCentered";
export { FooterBranded } from "./FooterBranded";
export { FooterStacked } from "./FooterStacked";
export type { FooterProps, FooterLink, SocialLink, FooterColumn } from "./types";

// Re-export simple as default Footer for backwards compatibility
export { FooterSimple as Footer } from "./FooterSimple";

// Variant selector factory
export function getFooterVariant(variant?: string) {
  switch (variant) {
    case "multiColumn":
      return FooterMultiColumn;
    case "minimal":
      return FooterMinimal;
    case "centered":
      return FooterCentered;
    case "branded":
      return FooterBranded;
    case "stacked":
      return FooterStacked;
    case "simple":
    default:
      return FooterSimple;
  }
}
