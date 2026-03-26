/* Auto-generated from business.schema.json — DO NOT EDIT */

export type BusinessID = string;
export type BusinessName = string;
export type Industry = string;
export type FaviconURL = string;
export type LogoURL = string;
export type IconURL = string;
export type Address = string;
export type Phone = string;
export type Email = string;
export type BusinessHours = string;
export type Latitude = number;
export type Longitude = number;
export type ServiceArea = string[];
export type TrustSignals = {
  icon?: string;
  text?: string;
}[];
export type ThemePreset = "industrial" | "wellness" | "minimal" | "elegant" | "modern" | "classic" | "bold";
export type GlobalVariant = string;
export type ColorMode = "light" | "dark";
export type PrimaryColor = string;
export type BaseSurface = string;
export type AltSurface = string;
export type CardSurface = string;
export type MainText = string;
export type MutedText = string;
export type TextOnPrimary = string;
export type PrimaryFontFamily = string;
export type SecondaryFontFamily = string;
export type BaseFontSize = string;
export type BorderRadius = string;
export type ExtraSmallSpacing = string;
export type SmallSpacing = string;
export type MediumSpacing = string;
export type LargeSpacing = string;
export type ExtraLargeSpacing = string;
export type XLSpacing = string;
export type XLSpacing1 = string;
export type SmallSectionSpacing = string;
export type SectionSpacing = string;
export type ContainerSpacing = string;
export type SpacingScale = number;
export type ButtonStyle = string;
export type NavbarVariant = "standard" | "centered";
export type ExtensionType = "upper-bar";
export type NavbarExtensions = {
  type: ExtensionType;
}[];
export type FooterVariant = "simple" | "multiColumn" | "minimal" | "centered" | "branded" | "stacked";
export type CopyrightText = string;
export type Tagline = string;
export type Label = string;
export type TargetType = "page" | "section" | "external" | "phone" | "email";
export type TargetValue = string;
export type FooterLinks = Link[];
export type ColumnTitle = string;
export type FooterColumns = FooterColumn[];
export type ExtensionType1 = "call";
export type Headline = string;
export type Phone1 = string;
export type FooterExtensions = {
  type: ExtensionType1;
  headline?: Headline;
  phone?: Phone1;
}[];
export type NavigationLinks = Link[];
export type Label1 = string;
export type PageTitle = string;
export type HideFromNav = boolean;
export type SectionType =
  | "hero"
  | "services"
  | "categories"
  | "about"
  | "about-summary"
  | "mission"
  | "contact"
  | "shop"
  | "gallery"
  | "testimonials"
  | "process"
  | "serviceArea"
  | "trustBar"
  | "galleryBA"
  | "faq"
  | "features"
  | "ctaBanner"
  | "blog"
  | "map"
  | "ref";
export type SharedSectionIDUsedWhenTypeIsRef = string;
export type Variant = string;
export type SectionBackground = "light" | "dark" | "primary";
export type BadgeText = string;
export type Title = string;
export type Subtitle = string;
export type BackgroundImageURL = string;
export type ImageURL = string;
export type AvatarImageURL = string;
export type AvatarImageURL1 = string;
export type Testimonials = {
  title?: string;
  quote?: string;
  image?: AvatarImageURL1;
}[];
export type Items = ServiceItem[];
export type Timeline = TimelineItem[];
export type ExploreLabel = string;
export type Products = Product[];
export type Currency = string;
export type CTALabel = string;
export type OutOfStockCTALabel = string;
export type OutOfStockCTAHref = string;
export type ProcessSteps = ProcessStep[];
export type ServiceAreas = string[];
export type BeforeAfterPairs = BeforeAfterPair[];
export type TrustSignals1 = TrustSignal[];
export type FAQItems = FAQItem[];
export type BlogPosts = BlogPost[];
export type MarqueeText = string;
export type Country = "polska";
export type Region =
  | "mazowsze"
  | "slaskie"
  | "malopolskie"
  | "wielkopolskie"
  | "dolnoslaskie"
  | "pomorskie"
  | "kujawsko-pomorskie"
  | "zachodnio-pomorskie"
  | "lubelskie"
  | "podkarpackie"
  | "warminsko-mazurskie"
  | "lodzkie"
  | "swietokrzyskie"
  | "podlaskie"
  | "opolskie"
  | "lubuskie";
export type Sections = Section[];
export type Services = Service[];
export type Products1 = Product[];

export interface BusinessProfile {
  business: Business;
  theme: Theme;
  layout?: Layout;
  navigation?: Navigation;
  pages?: Pages;
  sharedSections?: SharedSections;
  data?: Data;
}
export interface Business {
  id: BusinessID;
  name: BusinessName;
  industry: Industry;
  assets?: BusinessAssets;
  contact?: BusinessContact;
  socials?: Socials;
  serviceArea?: ServiceArea;
  googleRating?: GoogleRating;
  trustSignals?: TrustSignals;
}
export interface BusinessAssets {
  favicon?: FaviconURL;
  logo?: LogoURL;
  icon?: IconURL;
}
export interface BusinessContact {
  address?: Address;
  phone?: Phone;
  email?: Email;
  hours?: BusinessHours;
  location?: GeographicLocation;
}
export interface GeographicLocation {
  latitude: Latitude;
  longitude: Longitude;
}
export interface Socials {
  [k: string]: string;
}
export interface GoogleRating {
  score?: number;
  count?: number;
}
export interface Theme {
  preset?: ThemePreset;
  globalVariant?: GlobalVariant;
  mode?: ColorMode;
  colors?: ColorSchemes;
  typography?: Typography;
  ui?: UISettings;
}
export interface ColorSchemes {
  light?: ThemeColorMode;
  dark?: ThemeColorMode;
}
export interface ThemeColorMode {
  primary?: PrimaryColor;
  surface?: SurfaceColors;
  text?: TextColors;
}
export interface SurfaceColors {
  base?: BaseSurface;
  alt?: AltSurface;
  card?: CardSurface;
}
export interface TextColors {
  main?: MainText;
  muted?: MutedText;
  onPrimary?: TextOnPrimary;
}
export interface Typography {
  primary?: PrimaryFontFamily;
  secondary?: SecondaryFontFamily;
  baseSize?: BaseFontSize;
}
export interface UISettings {
  radius?: BorderRadius;
  spacing?: ThemeSpacing;
  spacingScale?: SpacingScale;
  buttonStyle?: ButtonStyle;
}
export interface ThemeSpacing {
  xs?: ExtraSmallSpacing;
  sm?: SmallSpacing;
  md?: MediumSpacing;
  lg?: LargeSpacing;
  xl?: ExtraLargeSpacing;
  "2xl"?: XLSpacing;
  "3xl"?: XLSpacing1;
  "section-sm"?: SmallSectionSpacing;
  section?: SectionSpacing;
  container?: ContainerSpacing;
}
export interface Layout {
  navbar?: Navbar;
  footer?: FooterConfig;
}
export interface Navbar {
  variant?: NavbarVariant;
  extensions?: NavbarExtensions;
}
export interface FooterConfig {
  variant?: FooterVariant;
  copyright?: CopyrightText;
  tagline?: Tagline;
  links?: FooterLinks;
  columns?: FooterColumns;
  extensions?: FooterExtensions;
}
export interface Link {
  label: Label;
  target?: Target;
}
export interface Target {
  type?: TargetType;
  value?: TargetValue;
}
export interface FooterColumn {
  title?: ColumnTitle;
  links?: Link[];
}
export interface Navigation {
  links?: NavigationLinks;
  cta?: Cta;
}
export interface Cta {
  label: Label1;
  target?: Target;
}
export interface Pages {
  [k: string]: Page;
}
export interface Page {
  title: PageTitle;
  hideFromNav?: HideFromNav;
  sections: Sections;
}
export interface Section {
  type: SectionType;
  sectionId?: SharedSectionIDUsedWhenTypeIsRef;
  variant?: Variant;
  background?: SectionBackground;
  header?: SectionHeader;
  backgroundImage?: BackgroundImageURL;
  image?: ImageURL;
  cta?: Cta1;
  secondaryCta?: Cta1;
  testimonial?: Testimonial;
  testimonials?: Testimonials;
  items?: Items;
  story?: {
    title?: string;
    content?: string;
  };
  stats?: StatItem[];
  commitment?: {
    title?: string;
    content?: string;
  };
  timeline?: Timeline;
  info?: ContactInfo;
  form?: ContactForm;
  labels?: Labels;
  exploreLabel?: ExploreLabel;
  products?: Products;
  currency?: Currency;
  ctaLabel?: CTALabel;
  outOfStockCtaLabel?: OutOfStockCTALabel;
  outOfStockCtaHref?: OutOfStockCTAHref;
  steps?: ProcessSteps;
  areas?: ServiceAreas;
  pairs?: BeforeAfterPairs;
  trustSignals?: TrustSignals1;
  googleRating?: GoogleRating;
  faqItems?: FAQItems;
  blogPosts?: BlogPosts;
  marqueeText?: MarqueeText;
  area?: ServiceAreaConfiguration;
}
export interface SectionHeader {
  badge?: BadgeText;
  title?: Title;
  subtitle?: Subtitle;
}
export interface Cta1 {
  label: Label1;
  target?: Target;
}
export interface Testimonial {
  title?: string;
  quote?: string;
  image?: AvatarImageURL;
}
export interface ServiceItem {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  price?: string;
  icon?: string;
  image?: string;
}
export interface StatItem {
  value?: string;
  label?: string;
}
export interface TimelineItem {
  year?: string;
  title?: string;
  description?: string;
}
export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}
export interface ContactForm {
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  submitButton?: string;
}
export interface Labels {
  [k: string]: string;
}
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
export interface ProductAttribute {
  key: string;
  value: string;
}
export interface ProductCustomization {
  id: string;
  label: string;
  type: "select";
  required?: boolean;
  options: ProductCustomizationOption[];
}
export interface ProductCustomizationOption {
  value: string;
  label: string;
  priceModifier?: number;
}
export interface ProcessStep {
  number?: number;
  title?: string;
  description?: string;
  icon?: string;
}
export interface BeforeAfterPair {
  title?: string;
  before?: string;
  after?: string;
  description?: string;
}
export interface TrustSignal {
  icon?: string;
  text?: string;
}
export interface FAQItem {
  question?: string;
  answer?: string;
}
export interface BlogPost {
  title?: string;
  description?: string;
  image?: string;
  date?: string;
  href?: string;
}
export interface ServiceAreaConfiguration {
  country?: Country;
  region?: Region;
}
/**
 * Named sections that can be referenced from any page via { type: 'ref', sectionId: '<key>' }
 */
export interface SharedSections {
  [k: string]: Section;
}
export interface Data {
  services?: Services;
  products?: Products1;
}
export interface Service {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content?: string;
  price?: number;
  priceLabel?: string;
  image?: string;
  icon?: string;
  category?: string;
  duration?: string;
  features?: string[];
  available?: boolean;
}
