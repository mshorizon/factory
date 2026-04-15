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
export type MajorTheme = "specialist" | "portfolio-tech" | "portfolio-art" | "portfolio-law";
export type ColorMode = "light" | "dark";
export type PrimaryColor = string;
export type PrimaryLightColor = string;
export type PrimaryDarkColor = string;
export type BaseSurface = string;
export type AltSurface = string;
export type CardSurface = string;
/**
 * Optional surface tint used as the top stop of light-padded section gradients.
 */
export type GradientSurface = string;
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
export type HeadingFontWeight = string;
/**
 * Caps the maximum font-weight used anywhere on the site (e.g. "400" forces all text to weight 400 or lower).
 */
export type MaxFontWeight = string;
export type NavbarFontSize = string;
export type NavbarLogoFontSize = string;
export type NavbarLogoFontWeight = string;
export type NavbarLinksPosition = "center" | "right";
export type ScrollType = "native" | "smooth" | "momentum";
export type SectionBadgeVariant = "accent" | "outlined" | "text";
export type BadgeFontSize = string;
export type NavbarVariant = "standard" | "centered";
/**
 * Override the business name displayed in the navbar
 */
export type LogoTextOverride = string;
/**
 * Hide the bottom border when scroll is at the very top of the page
 */
export type HideBorderWhenAtTop = boolean;
/**
 * Hide the call-to-action button in the navbar
 */
export type HideCTAButton = boolean;
/**
 * Show social media icons in the upper bar extension
 */
export type ShowSocialMediaIconsInExtension = boolean;
/**
 * Show availability badge in the upper bar extension
 */
export type ShowAvailabilityInExtension = boolean;
export type ExtensionType = "upper-bar";
export type NavbarExtensions = {
  type: ExtensionType;
}[];
export type FooterVariant = "simple" | "multiColumn" | "minimal" | "centered" | "branded" | "stacked" | "gradient";
export type CopyrightText = string;
export type Tagline = string;
export type Label = string;
export type TargetType = "page" | "section" | "external" | "phone" | "email";
export type TargetValue = string;
export type FooterLinks = Link[];
export type ColumnTitle = string;
export type FooterColumns = FooterColumn[];
/**
 * Overrides business name in footer
 */
export type FooterDisplayName = string;
export type EnableBackgroundContainer = boolean;
export type ContainerPadding = string;
export type ContainerBorderRadius = string;
/**
 * Gradient preset e.g. primary-to-primary-dark
 */
export type BackgroundGradient = string;
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
export type NavLabel = string;
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
  | "blog-standalone"
  | "map"
  | "ref"
  | "booking"
  | "pricing"
  | "project"
  | "comparison"
  | "team"
  | "events"
  | "files";
export type SharedSectionIDUsedWhenTypeIsRef = string;
export type BlogSlugUsedWhenTypeIsBlogStandalone = string;
export type Variant = string;
export type SectionBackground = "light" | "dark" | "dark-padded" | "light-padded" | "primary" | "gradient";
export type BadgeText = string;
export type Title = string;
export type Subtitle = string;
export type HeaderLayout = "stacked" | "split" | "most-minimalistic" | "none";
export type BackgroundImageURL = string;
export type ImageURL = string;
export type HideDecorativeDots = boolean;
export type BadgeLayoutDirection = "row" | "column";
export type SectionLevelBadgeVariantOverride = "accent" | "outlined" | "text";
export type BadgeTextColorOverride = string;
export type DescriptionTextColorOverride = string;
export type CTATextColorOverride = string;
export type InvertStatColorsLightBgDarkText = boolean;
export type AvatarImageURL = string;
export type AvatarImageURL1 = string;
export type Testimonials = {
  title?: string;
  quote?: string;
  image?: AvatarImageURL1;
}[];
export type FeatureTags = string[];
export type AuthorName = string;
export type AuthorRole = string;
export type Metric = string;
export type MetricLabel = string;
export type StartDate = string;
export type EndDate = string;
export type LinkURL = string;
export type Items = ServiceItem[];
export type Timeline = TimelineItem[];
export type ExploreLabel = string;
export type Products = Product[];
export type Currency = string;
export type CTALabel = string;
export type OutOfStockCTALabel = string;
export type OutOfStockCTAHref = string;
export type VideoURL = string;
export type VisualBadges = string[];
export type ProcessSteps = ProcessStep[];
export type ServiceAreas = string[];
export type BeforeAfterPairs = BeforeAfterPair[];
export type TrustSignals1 = TrustSignal[];
/**
 * Logo images for scrolling trust bar
 */
export type ClientLogos = ClientLogo[];
export type FAQItems = FAQItem[];
export type BlogPosts = BlogPost[];
export type MarqueeText = string;
export type TierName = string;
export type Price = string;
export type BillingPeriod = string;
export type Description = string;
export type Features = string[];
export type Highlighted = boolean;
export type BadgeText1 = string;
export type AnnualPrice = string;
export type TierIcon = string;
export type PricingTiers = PricingTier[];
export type Title1 = string;
export type Description1 = string;
export type ImageURL1 = string;
export type LogoImageURL = string;
export type Date = string;
export type KeyMetric = string;
export type MetricLabel1 = string;
export type MetricBadges = string[];
export type Projects = ProjectItem[];
export type LeftColumnTitleEGManualWork = string;
export type RightColumnTitleEGAIAutomation = string;
export type LeftProblem = string;
export type RightSolution = string;
export type ComparisonRows = ComparisonRow[];
export type Name = string;
export type Role = string;
export type PhotoURL = string;
export type LinkedInURL = string;
export type TeamMembers = TeamMember[];
export type GroupTitle = string;
export type FileName = string;
export type FileTypeEGPdfDocx = string;
export type DownloadURL = string;
export type Files = FileItem[];
export type FileGroups = FileGroup[];
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
export type EnableBooking = boolean;
export type ServiceID = string;
export type ServiceName = string;
export type DurationMinutes = number;
export type Price1 = number;
export type Description2 = string;
export type BookingServices = BookingService[];
export type Open = boolean;
export type OpeningTime = string;
export type ClosingTime = string;
export type SlotIntervalMinutes = number;
export type LeadTimeMinutes = number;
export type MaxAdvanceBookingDays = number;
export type BufferBetweenAppointmentsMinutes = number;
export type BlackoutDatesYYYYMMDD = string[];
export type EnableSMSNotifications = boolean;
export type SMSProvider = "smsapi" | "twilio";
export type RecipientPhoneNumberWithCountryCodeEG48500600700 = string;
export type ProviderAPITokenAuthKey = string;
export type SenderNameOptionalMax11Chars = string;
export type MessageTemplate = string;
export type EnableWebPushNotifications = boolean;

export interface BusinessProfile {
  business: Business;
  theme: Theme;
  layout?: Layout;
  navigation?: Navigation;
  pages?: Pages;
  sharedSections?: SharedSections;
  data?: Data;
  booking?: Booking;
  notifications?: Notifications;
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
  majorTheme?: MajorTheme;
  mode?: ColorMode;
  colors?: ColorSchemes;
  typography?: Typography;
  ui?: UISettings;
  headingWeight?: HeadingFontWeight;
  maxFontWeight?: MaxFontWeight;
  navFontSize?: NavbarFontSize;
  navLogoSize?: NavbarLogoFontSize;
  navLogoWeight?: NavbarLogoFontWeight;
  navLinksPosition?: NavbarLinksPosition;
  scrollType?: ScrollType;
  badgeVariant?: SectionBadgeVariant;
  badgeFontSize?: BadgeFontSize;
}
export interface ColorSchemes {
  light?: ThemeColorMode;
  dark?: ThemeColorMode;
}
export interface ThemeColorMode {
  primary?: PrimaryColor;
  primaryLight?: PrimaryLightColor;
  primaryDark?: PrimaryDarkColor;
  surface?: SurfaceColors;
  text?: TextColors;
}
export interface SurfaceColors {
  base?: BaseSurface;
  alt?: AltSurface;
  card?: CardSurface;
  gradient?: GradientSurface;
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
  logoText?: LogoTextOverride;
  hideBorderOnTop?: HideBorderWhenAtTop;
  hideCta?: HideCTAButton;
  showSocials?: ShowSocialMediaIconsInExtension;
  showAvailability?: ShowAvailabilityInExtension;
  extensions?: NavbarExtensions;
}
export interface FooterConfig {
  variant?: FooterVariant;
  copyright?: CopyrightText;
  tagline?: Tagline;
  links?: FooterLinks;
  columns?: FooterColumns;
  name?: FooterDisplayName;
  background?: FooterBackground;
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
export interface FooterBackground {
  enabled?: EnableBackgroundContainer;
  padding?: ContainerPadding;
  borderRadius?: ContainerBorderRadius;
  gradient?: BackgroundGradient;
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
  navLabel?: NavLabel;
  hideFromNav?: HideFromNav;
  sections: Sections;
}
export interface Section {
  type: SectionType;
  sectionId?: SharedSectionIDUsedWhenTypeIsRef;
  blogSlug?: BlogSlugUsedWhenTypeIsBlogStandalone;
  variant?: Variant;
  background?: SectionBackground;
  header?: SectionHeader;
  backgroundImage?: BackgroundImageURL;
  image?: ImageURL;
  hideDots?: HideDecorativeDots;
  badgeLayout?: BadgeLayoutDirection;
  badgeVariant?: SectionLevelBadgeVariantOverride;
  badgeColor?: BadgeTextColorOverride;
  descriptionColor?: DescriptionTextColorOverride;
  ctaColor?: CTATextColorOverride;
  statsInverted?: InvertStatColorsLightBgDarkText;
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
  clientLogos?: ClientLogos;
  googleRating?: GoogleRating;
  faqItems?: FAQItems;
  blogPosts?: BlogPosts;
  marqueeText?: MarqueeText;
  pricingTiers?: PricingTiers;
  projects?: Projects;
  leftTitle?: LeftColumnTitleEGManualWork;
  rightTitle?: RightColumnTitleEGAIAutomation;
  rows?: ComparisonRows;
  members?: TeamMembers;
  fileGroups?: FileGroups;
  area?: ServiceAreaConfiguration;
}
export interface SectionHeader {
  badge?: BadgeText;
  title?: Title;
  subtitle?: Subtitle;
  layout?: HeaderLayout;
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
  tags?: FeatureTags;
  author?: AuthorName;
  role?: AuthorRole;
  metric?: Metric;
  metricLabel?: MetricLabel;
  dateStart?: StartDate;
  dateEnd?: EndDate;
  href?: LinkURL;
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
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  selectFields?: {
    name?: string;
    label?: string;
    placeholder?: string;
    options?: string[];
  }[];
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
  image?: string;
  video?: VideoURL;
  badges?: VisualBadges;
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
export interface ClientLogo {
  name: string;
  image: string;
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
export interface PricingTier {
  name: TierName;
  price: Price;
  period?: BillingPeriod;
  description?: Description;
  features?: Features;
  cta?: Cta1;
  highlighted?: Highlighted;
  badge?: BadgeText1;
  annualPrice?: AnnualPrice;
  icon?: TierIcon;
}
export interface ProjectItem {
  title?: Title1;
  description?: Description1;
  image?: ImageURL1;
  logo?: LogoImageURL;
  date?: Date;
  metric?: KeyMetric;
  metricLabel?: MetricLabel1;
  metrics?: MetricBadges;
}
export interface ComparisonRow {
  left?: LeftProblem;
  right?: RightSolution;
}
export interface TeamMember {
  name?: Name;
  role?: Role;
  image?: PhotoURL;
  linkedin?: LinkedInURL;
}
export interface FileGroup {
  title: GroupTitle;
  files: Files;
}
export interface FileItem {
  name: FileName;
  type?: FileTypeEGPdfDocx;
  url: DownloadURL;
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
export interface Booking {
  enabled?: EnableBooking;
  services?: BookingServices;
  hours?: BusinessHours1;
  slotInterval?: SlotIntervalMinutes;
  leadTime?: LeadTimeMinutes;
  maxAdvance?: MaxAdvanceBookingDays;
  bufferMinutes?: BufferBetweenAppointmentsMinutes;
  blackoutDates?: BlackoutDatesYYYYMMDD;
}
export interface BookingService {
  id: ServiceID;
  name: ServiceName;
  duration: DurationMinutes;
  price?: Price1;
  description?: Description2;
}
export interface BusinessHours1 {
  mon?: BookingDayHours;
  tue?: BookingDayHours;
  wed?: BookingDayHours;
  thu?: BookingDayHours;
  fri?: BookingDayHours;
  sat?: BookingDayHours;
  sun?: BookingDayHours;
}
export interface BookingDayHours {
  enabled?: Open;
  open?: OpeningTime;
  close?: ClosingTime;
}
export interface Notifications {
  sms?: SMSNotifications;
  push?: WebPushNotifications;
}
export interface SMSNotifications {
  enabled?: EnableSMSNotifications;
  provider?: SMSProvider;
  phoneNumber?: RecipientPhoneNumberWithCountryCodeEG48500600700;
  apiToken?: ProviderAPITokenAuthKey;
  senderName?: SenderNameOptionalMax11Chars;
  template?: MessageTemplate;
}
export interface WebPushNotifications {
  enabled?: EnableWebPushNotifications;
}
