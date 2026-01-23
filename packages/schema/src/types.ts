// Layout Variants
export type NavbarVariant = "standard" | "centered";
export type FooterVariant = "simple" | "multiColumn";

// Section Variants
export type HeroVariant = "default" | "split";
export type ServicesVariant = "grid" | "list";
export type AboutVariant = "story" | "timeline";
export type ContactVariant = "centered" | "split";

// Section Types
export type SectionType = "hero" | "services" | "about" | "contact";

// Common Types
export interface CTAButton {
  label: string;
  href: string;
}

export interface NavLink {
  label: string;
  href: string;
}

// Service Item
export interface ServiceItem {
  title: string;
  description: string;
  price?: string;
  icon?: string;
}

// Stat Item
export interface StatItem {
  value: string;
  label: string;
}

// Timeline Item
export interface TimelineItem {
  year: string;
  title: string;
  description?: string;
}

// Contact Info
export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

// Contact Form
export interface ContactForm {
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  submitButton?: string;
}

// Footer Column
export interface FooterColumn {
  title: string;
  links: NavLink[];
}

// Section - all section data is inline
export interface Section {
  type: SectionType;
  variant?: string;
  // Hero fields
  badge?: string;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  image?: string;
  cta?: CTAButton;
  secondaryCta?: CTAButton;
  // Services fields
  items?: ServiceItem[];
  // About fields
  story?: {
    title?: string;
    content?: string;
  };
  stats?: StatItem[];
  commitment?: {
    title?: string;
    content?: string;
  };
  timeline?: TimelineItem[];
  // Contact fields
  info?: ContactInfo;
  form?: ContactForm;
}

// Page Definition
export interface Page {
  slug: string;
  title: string;
  sections: Section[];
}

// Footer Configuration
export interface FooterConfig {
  variant?: FooterVariant;
  copyright?: string;
  tagline?: string;
  links?: NavLink[];
  columns?: FooterColumn[];
}

// Layout Configuration
export interface LayoutConfig {
  navbar?: {
    variant?: NavbarVariant;
  };
  footer?: FooterConfig;
}

// Business Profile
export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  branding: {
    primaryColor: string;
    themeId: string;
  };
  layout: LayoutConfig;
  pages: Page[];
  navigation?: {
    cta?: CTAButton;
  };
}
