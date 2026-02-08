// ==========================================
// V1.0 TYPES (Legacy - for backwards compatibility)
// ==========================================

// Layout Variants
export type NavbarVariant = "standard" | "centered";
export type FooterVariant = "simple" | "multiColumn" | "minimal" | "centered" | "branded" | "stacked";

// Section Variants
export type HeroVariant = "default" | "split" | "gradient" | "cards" | "video" | "minimal";
export type ServicesVariant = "grid" | "list";
export type CategoriesVariant = "carousel" | "featured";
export type AboutVariant = "story" | "timeline";
export type ContactVariant = "centered" | "split";

// Section Types
export type SectionType = "hero" | "services" | "categories" | "about" | "contact" | "shop" | "gallery" | "testimonials";

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

// V1.0 Theme structure (legacy)
export interface ThemeV10 {
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

// ==========================================
// V1.5 TYPES (New flat schema with embedded theme)
// ==========================================

// Target for polymorphic links
export type TargetType = "page" | "section" | "external" | "phone" | "email";

export interface Target {
  type: TargetType;
  value?: string;
}

// Section Header (normalized)
export interface SectionHeader {
  badge?: string;
  title?: string;
  subtitle?: string;
}

// v1.5 Theme color mode
export interface ThemeColorMode {
  primary: string;
  surface: {
    base: string;
    alt: string;
  };
  text: {
    main: string;
    muted: string;
    onPrimary: string;
  };
}

// v1.5 Theme with light/dark modes
export interface ThemeV15 {
  preset?: "industrial" | "wellness" | "minimal" | "elegant" | "modern" | "classic" | "bold";
  globalVariant?: string;
  mode: "light" | "dark";
  colors: {
    light: ThemeColorMode;
    dark?: ThemeColorMode;
  };
  typography: {
    primary: string;
    secondary?: string;
    baseSize?: string;
  };
  ui: {
    radius: string;
    spacingScale?: number;
    buttonStyle?: string;
  };
}

// v1.5 CTA with Target
export interface CTAV15 {
  label: string;
  target: Target;
}

// v1.5 Nav Link with Target
export interface NavLinkV15 {
  label: string;
  target: Target;
}

// v1.5 Footer Column
export interface FooterColumnV15 {
  title: string;
  links: NavLinkV15[];
}

// v1.5 Footer Configuration
export interface FooterConfigV15 {
  variant?: FooterVariant;
  copyright?: string;
  tagline?: string;
  links?: NavLinkV15[];
  columns?: FooterColumnV15[];
}

// v1.5 Layout Configuration
export interface LayoutV15 {
  navbar?: {
    variant?: NavbarVariant;
  };
  footer?: FooterConfigV15;
}

// v1.5 Section - with header object
export interface SectionV15 {
  type: SectionType;
  variant?: string;
  header?: SectionHeader;
  // Hero fields
  backgroundImage?: string;
  image?: string;
  cta?: CTAV15;
  secondaryCta?: CTAV15;
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
  labels?: Record<string, string>;
  // Categories fields
  exploreLabel?: string;
  // Shop fields
  products?: Product[];
  currency?: string;
  ctaLabel?: string;
  outOfStockCtaLabel?: string;
  outOfStockCtaHref?: string;
}

// v1.5 Page Definition
export interface PageV15 {
  title: string;
  sections: SectionV15[];
}

// v1.5 Business Assets
export interface BusinessAssets {
  logo?: string;
  icon?: string;
  favicon?: string;
}

// v1.5 Business Contact
export interface BusinessContact {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}

// v1.5 Navigation Configuration
export interface NavigationV15 {
  links?: NavLinkV15[];
  cta?: CTAV15;
}

// v1.5 Business Profile (merged theme, object pages)
export interface BusinessProfileV15 {
  schemaVersion: "1.5";
  business: {
    id: string;
    name: string;
    industry?: string;
    assets?: BusinessAssets;
    contact?: BusinessContact;
    socials?: Record<string, string>;
  };
  theme: ThemeV15;
  layout: LayoutV15;
  navigation?: NavigationV15;
  pages: Record<string, PageV15>;
}

// ==========================================
// SHOP & CART TYPES (E-commerce module)
// ==========================================

// Product attribute (key-value for specs like Material, Warranty)
export interface ProductAttribute {
  key: string;
  value: string;
}

// Product customization option (e.g. "small", "medium", "large")
export interface ProductCustomizationOption {
  value: string;
  label: string;
  priceModifier?: number;
}

// Product customization group (e.g. "size", "cream", "color")
export interface ProductCustomization {
  id: string;
  label: string;
  type: "select";
  required?: boolean;
  options: ProductCustomizationOption[];
}

// Product item
export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  attributes?: ProductAttribute[];
  inStock?: boolean;
  customizations?: ProductCustomization[];
}

// Cart item (product snapshot with quantity)
export interface CartItem {
  productId: string;
  cartKey: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  customizations?: Record<string, string>;
  customizationLabels?: Record<string, string>;
  productCustomizations?: ProductCustomization[];
}

// Cart store state
export interface CartStore {
  items: CartItem[];
  addItem: (product: Product, customizations?: Record<string, string>) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  updateItemCustomizations: (oldCartKey: string, product: Product, newCustomizations: Record<string, string>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Shop section (for rendering product grids)
export interface ShopSection {
  type: "shop";
  variant?: "grid" | "list";
  header?: SectionHeader;
  products: Product[];
  ctaLabel?: string;
}
