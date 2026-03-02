import { NavbarStandard } from "./NavbarStandard";
import { NavbarCentered } from "./NavbarCentered";

export { NavbarStandard } from "./NavbarStandard";
export { NavbarCentered } from "./NavbarCentered";
export type { NavbarProps, NavbarLayoutVariant, NavbarStyleVariant } from "./types";

// Re-export standard as default Navbar for backwards compatibility
export { NavbarStandard as Navbar } from "./NavbarStandard";

// Variant selector factory - can be used to dynamically select the variant
export function getNavbarVariant(variant?: string) {
  switch (variant) {
    case "centered":
      return NavbarCentered;
    case "standard":
    default:
      return NavbarStandard;
  }
}
