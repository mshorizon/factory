export interface NavLink {
  label: string;
  href: string;
}

export type NavbarLayoutVariant = "standard" | "centered";
export type NavbarStyleVariant = "solid" | "transparent";

export interface NavbarProps {
  logo: string;
  logoIcon?: React.ReactNode;
  links: NavLink[];
  cta?: {
    label: string;
    href: string;
  };
  currentLanguage?: string;
  variant?: NavbarLayoutVariant | NavbarStyleVariant;
  sticky?: boolean;
  className?: string;
}
