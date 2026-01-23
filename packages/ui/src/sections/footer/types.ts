export interface FooterLink {
  label: string;
  href: string;
}

export interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  businessName: string;
  links?: FooterLink[];
  socialLinks?: SocialLink[];
  copyright?: string;
  tagline?: string;
  columns?: FooterColumn[];
  variant?: "simple" | "multiColumn";
  className?: string;
}
