/* Auto-generated from business.schema.json — DO NOT EDIT */

export type BusinessID = string;
export type BusinessName = string;
export type Industry = string;
export type FaviconURL = string;
export type LogoURL = string;
export type IconURL = string;
/**
 * Icon used in the footer. Falls back to icon when absent.
 */
export type FooterIconURL = string;
/**
 * Lucide icon name rendered inline with text-primary color (e.g. 'scale', 'gavel'). Takes precedence over icon.
 */
export type IconLucideName = string;
export type Address = string;
export type Phone = string;
export type Email = {
  [k: string]: unknown;
} & string;
export type BusinessHours = string;
/**
 * Extra info strings shown next to phone/email/address in the navbar upper bar, each rendered with an 'i' info icon (e.g., registration numbers, license IDs).
 */
export type AdditionalInfo = string[];
export type Latitude = number;
export type Longitude = number;
/**
 * Business name/address query for Google Maps native panel (e.g. 'Kancelaria Notarialna Garwolin'). When set, the map shows Google's native info card with reviews and directions instead of the custom overlay.
 */
export type GooglePlaceQuery = string;
export type ServiceArea = string[];
export type TrustSignals = {
  icon?: string;
  text?: string;
}[];
export type ThemePreset = "industrial" | "wellness" | "minimal" | "elegant" | "modern" | "classic" | "bold";
export type GlobalVariant = string;
export type MajorTheme =
  | "template-specialist"
  | "template-tech"
  | "template-art"
  | "template-law"
  | "template-tech-agency";
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
export type SmallBorderRadius = string;
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
/**
 * Max width of the centered content container (e.g. "1200px" or "1488px"). Defaults to 1200px when unset.
 */
export type ContentWidth = string;
/**
 * For the services "list" variant: drop the card border/shadow/radius and show only a bottom divider (surface.card at 50% opacity).
 */
export type ServicesListDividerStyle = boolean;
/**
 * Make service list/grid items non-interactive (no link navigation, no hover affordance).
 */
export type ServicesNotClickable = boolean;
/**
 * Cap the services section content width (e.g. "848px"). Centered within the page container. Unset = full container width.
 */
export type ServicesSectionMaxWidth = string;
/**
 * For the services "list" variant: render as a restaurant-style menu — drop the price pill, right-align the price, and apply the servicesTitle/Desc/Price/Footnote font + size overrides.
 */
export type ServicesMenuStyle = boolean;
/**
 * CSS font-family for service item titles when servicesMenuStyle is on, e.g. "'Cormorant Garamond', serif". The font is automatically loaded.
 */
export type ServicesItemTitleFontFamily = string;
/**
 * Font size for service item titles when servicesMenuStyle is on, e.g. "18px".
 */
export type ServicesItemTitleFontSize = string;
/**
 * CSS font-family for service item descriptions when servicesMenuStyle is on, e.g. "'DM Sans', sans-serif". The font is automatically loaded.
 */
export type ServicesItemDescriptionFontFamily = string;
/**
 * Font size for service item descriptions when servicesMenuStyle is on, e.g. "14px".
 */
export type ServicesItemDescriptionFontSize = string;
/**
 * CSS font-family for service item prices when servicesMenuStyle is on, e.g. "'Cormorant Garamond', serif". The font is automatically loaded.
 */
export type ServicesItemPriceFontFamily = string;
/**
 * Font size for service item prices when servicesMenuStyle is on, e.g. "16px".
 */
export type ServicesItemPriceFontSize = string;
/**
 * CSS font-family for the services section footnote when servicesMenuStyle is on, e.g. "'DM Sans', sans-serif". The font is automatically loaded.
 */
export type ServicesFootnoteFontFamily = string;
/**
 * Font size for the services section footnote when servicesMenuStyle is on, e.g. "14px".
 */
export type ServicesFootnoteFontSize = string;
/**
 * Hide the arrow icon inside the services section CTA button.
 */
export type ServicesCTAHideIcon = boolean;
export type HeadingFontWeight = string;
/**
 * Caps the maximum font-weight used anywhere on the site (e.g. "400" forces all text to weight 400 or lower).
 */
export type MaxFontWeight = string;
export type NavbarFontSize = string;
export type NavbarLogoFontSize = string;
export type NavbarLogoFontWeight = string;
/**
 * Render the navbar logo text in uppercase.
 */
export type NavbarLogoUppercase = boolean;
/**
 * Which theme font the navbar logo text uses: "body" (typography.primary) or "heading" (typography.secondary).
 */
export type NavbarLogoFont = "body" | "heading";
/**
 * Explicit CSS font-family for the navbar logo text, e.g. "'Cormorant Garamond', serif". Overrides navLogoFont. The font is automatically loaded.
 */
export type NavbarLogoFontFamily = string;
/**
 * Fixed color for the navbar logo text (hex). Hover lightens it slightly. Overrides the default foreground/transparent behavior.
 */
export type NavbarLogoColor = string;
/**
 * Fixed color for the navbar links (hex). Hover lightens it slightly. Overrides the default foreground/transparent behavior.
 */
export type NavbarLinkColor = string;
/**
 * Render the navbar links (desktop + mobile) in uppercase.
 */
export type NavbarLinksUppercase = boolean;
/**
 * Letter spacing for the navbar logo text, e.g. "0.05em". Overrides the default normal spacing.
 */
export type NavbarLogoLetterSpacing = string;
/**
 * Hide the icon (arrow/clock) inside the navbar CTA button.
 */
export type NavbarCTAHideIcon = boolean;
/**
 * Render the navbar CTA button text (desktop + mobile) in uppercase.
 */
export type NavbarCTAUppercase = boolean;
/**
 * Hide the arrow icon inside the hero section CTA button.
 */
export type HeroCTAHideIcon = boolean;
/**
 * Use theme text colors for the hero title (text.main) and subtitle (text.muted) instead of the on-image white default.
 */
export type HeroTextUsesThemeColors = boolean;
/**
 * Fade the hero background image into the page background color, from the vertical middle down to the bottom edge.
 */
export type HeroBottomFade = boolean;
/**
 * Font size for the hero title. Any CSS length, e.g. "96px" or a responsive "clamp(3.5rem, 7vw, 6rem)". Overrides the default responsive sizing.
 */
export type HeroTitleFontSize = string;
/**
 * Explicit CSS font-family for the hero title text, e.g. "'Cormorant Garamond', serif". Overrides the default heading font. The font is automatically loaded.
 */
export type HeroTitleFontFamily = string;
/**
 * Font size for the hero subtitle/description, e.g. "24px". Overrides the default responsive sizing.
 */
export type HeroSubtitleFontSize = string;
/**
 * Letter spacing for the hero badge/eyebrow text, e.g. "0.4em". Overrides the default 0.05em.
 */
export type HeroBadgeLetterSpacing = string;
/**
 * Letter spacing for the hero subtitle/description text, e.g. "0.15em". Overrides the default 0.05em.
 */
export type HeroSubtitleLetterSpacing = string;
/**
 * Letter spacing for the hero title text, e.g. "0.01em" or "-0.02em". Overrides the default 0.04em.
 */
export type HeroTitleLetterSpacing = string;
/**
 * Letter spacing for the navbar links (desktop + mobile), e.g. "0.1em". Overrides the default normal spacing.
 */
export type NavbarLinkLetterSpacing = string;
/**
 * Letter spacing applied to CTA buttons (primary/default variant), ghost buttons, and the navbar CTA, e.g. "0.1em". Overrides the default normal spacing.
 */
export type ButtonLetterSpacing = string;
/**
 * Optional flag bar rendered beneath the navbar logo text. Provide the stripe colors left-to-right (e.g. Italian flag: ["#008C45", "#F4F5F0", "#CD212A"]).
 */
export type NavbarLogoFlagStripes = string[];
/**
 * Navbar height when scrolled to the very top (e.g. "86px"). Animates to navHeightScrolled once the solid background appears. Requires navbar variant "transparent".
 */
export type NavbarHeightAtTop = string;
/**
 * Navbar height once the solid background appears on scroll (e.g. "70px").
 */
export type NavbarHeightWhenScrolled = string;
export type NavbarLinksPosition = "center" | "right";
export type ScrollType = "native" | "smooth" | "momentum";
export type SectionBadgeVariant = "accent" | "accent-no-line" | "outlined" | "text";
export type BadgeFontSize = string;
export type NavbarVariant = "standard" | "centered" | "transparent";
/**
 * Override the business name displayed in the navbar
 */
export type LogoTextOverride = string;
/**
 * Optional second line shown below the logo text (stacked column layout)
 */
export type LogoSubtext = string;
/**
 * Hide the icon next to the logo text in the navbar
 */
export type HideLogoIcon = boolean;
/**
 * Hide the bottom border when scroll is at the very top of the page
 */
export type HideBorderWhenAtTop = boolean;
/**
 * Hide the call-to-action button in the navbar
 */
export type HideCTAButton = boolean;
/**
 * Hide the auto-injected Blog link in the navbar
 */
export type HideBlogLink = boolean;
/**
 * Show social media icons in the upper bar extension
 */
export type ShowSocialMediaIconsInExtension = boolean;
/**
 * Show availability badge in the upper bar extension
 */
export type ShowAvailabilityInExtension = boolean;
/**
 * Show address in the upper bar extension
 */
export type ShowAddressInExtension = boolean;
/**
 * Show additionalInfo items in the upper bar extension
 */
export type ShowAdditionalInfoInExtension = boolean;
export type ExtensionType = "upper-bar";
/**
 * Short warning/announcement shown centered in the upper bar (e.g. temporary office closure). Plain text.
 */
export type UpperBarNotice = string;
export type NavbarExtensions = {
  type: ExtensionType;
  notice?: UpperBarNotice;
}[];
export type FooterVariant =
  | "simple"
  | "multiColumn"
  | "minimal"
  | "centered"
  | "branded"
  | "stacked"
  | "gradient"
  | "darkColumns"
  | "restaurant";
export type CopyrightText = string;
/**
 * Footer tagline. Use \n to split across multiple lines.
 */
export type Tagline = string;
/**
 * Optional list of hex colors rendered as a segmented accent bar under the logo (e.g. an Italian flag).
 */
export type BrandFlagColors = string[];
/**
 * Heading for the address/phone column (restaurant variant).
 */
export type FindUsColumnTitle = string;
/**
 * Heading for the opening-hours column (restaurant variant).
 */
export type OpeningHoursColumnTitle = string;
export type DayLabel = string;
export type HoursValue = string;
/**
 * Render the value in the primary accent color
 */
export type HighlightRow = boolean;
/**
 * Structured opening-hours rows (restaurant variant).
 */
export type OpeningHoursRows = FooterHoursRow[];
/**
 * Italic signature line shown on the right of the bottom bar (restaurant variant).
 */
export type FooterSignature = string;
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
/**
 * Overrides the footer wrapper background with a custom CSS color value. Takes precedence over the variant's default background fill.
 */
export type FooterBackgroundColorOverrideCustomCSSColorEG26201C = string;
export type ExtensionType1 = "call";
export type Headline = string;
export type Phone1 = string;
export type FooterExtensions = {
  type: ExtensionType1;
  headline?: Headline;
  phone?: Phone1;
}[];
/**
 * Layout variant for individual blog post pages
 */
export type BlogPostLayout = "default" | "sidebar";
/**
 * Hide breadcrumb navigation on service detail pages
 */
export type HideBreadcrumbs = boolean;
export type NavigationLinks = Link[];
export type Label1 = string;
export type PageTitle = string;
export type NavLabel = string;
export type NavOrder = number;
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
  | "files"
  | "templateShowcase";
export type SharedSectionIDUsedWhenTypeIsRef = string;
export type BlogSlugUsedWhenTypeIsBlogStandalone = string;
export type BlogSlugsFilterWhenTypeIsBlogRenderOnlyTheseBlogsInTheGivenOrderSupportsStandaloneBlogs = string[];
export type Name = string;
export type RoleTitle = string;
export type AvatarImageURL = string;
export type Phone2 = string;
export type Email1 = string;
export type Variant = string;
export type SectionBackground =
  | "light"
  | "dark"
  | "dark-padded"
  | "light-padded"
  | "primary"
  | "gradient"
  | "transparent";
/**
 * Overrides the section wrapper background color with a custom CSS color value. Takes precedence over the 'background' enum for the background fill.
 */
export type SectionBackgroundColorOverrideCustomCSSColorEG26201C = string;
/**
 * Overrides the background color of the section's inner card/panel (e.g. the quote panel in the about 'quote-split' variant). Full CSS color value.
 */
export type CardBackgroundColorOverrideCustomCSSColorEG26201C = string;
export type BadgeText = string;
export type Title = string;
export type Subtitle = string;
export type HeaderLayout = "stacked" | "split" | "most-minimalistic" | "none";
/**
 * Render a small country flag accent bar (144x3px, using the theme navLogoFlag stripe colors) below the title.
 */
export type ShowFlagBar = boolean;
export type SectionTopPaddingOverrideEG120Px8Rem = string;
export type SectionBottomPaddingOverrideEG120Px8Rem = string;
export type BackgroundImageURL = string;
export type ImageURL = string;
export type HideDecorativeDots = boolean;
export type ImagePosition = "left" | "right";
/**
 * When false, renders the section image with square (un-rounded) corners. Defaults to true (rounded).
 */
export type RoundImageCorners = boolean;
export type BadgeLayoutDirection = "row" | "column";
export type SectionLevelBadgeVariantOverride = "accent" | "accent-no-line" | "outlined" | "text";
export type BadgeTextColorOverride = string;
export type DescriptionTextColorOverride = string;
/**
 * Overrides the font-family of the section's main body/story text (the 'big text' content). Full CSS font-family value, e.g. "'DM Sans', sans-serif".
 */
export type BodyContentFontFamilyOverride = string;
/**
 * Overrides the font-size of the section's main body/story text content. Full CSS length value, e.g. '18px', '1.125rem'.
 */
export type BodyContentFontSizeOverride = string;
/**
 * Overrides the about-section image width. Full CSS length value, e.g. '560px'. Defaults to 448px.
 */
export type SectionImageWidthOverride = string;
/**
 * Overrides the about-section image height. Full CSS length value, e.g. '620px'. Defaults to 500px.
 */
export type SectionImageHeightOverride = string;
/**
 * Integrates the about-section image with the page instead of a floating shadowed card. 'feather' softly fades the image edges into the background; 'soft' replaces the hard drop shadow with a large low-opacity ambient shadow. Omit for the legacy shadowed-card look.
 */
export type ImageBlendEffect = "feather" | "soft";
export type CTATextColorOverride = string;
/**
 * Overrides the color of the hero scroll indicator label and chevron (default hero-fold variant). Custom CSS color value, e.g. '#f0ebdb'.
 */
export type HeroScrollIndicatorColorOverride = string;
/**
 * Overrides the color of the hero title and subtitle text (default hero-fold variant). Custom CSS color value, e.g. '#f0ebdb'.
 */
export type HeroTextColorOverride = string;
/**
 * Color for the action buttons (directions, open in maps) inside the custom map overlay panel. Defaults to 'primary-light'.
 */
export type MapPanelButtonColor = "primary" | "primary-light";
/**
 * Color of the decorative line in the section header (e.g. ContactProfessional title block). Defaults to 'foreground'.
 */
export type HeaderDecorativeLineColor = "primary" | "foreground";
export type InvertStatColorsLightBgDarkText = boolean;
export type Text = string;
/**
 * A substring of 'text' rendered in the highlight color (e.g. a social handle).
 */
export type HighlightSubstring = string;
export type HighlightColorCustomCSSColorEGD94A26 = string;
export type LinkURL = string;
export type DetailsButtonLabelEGSeeDetailsLearnMore = string;
/**
 * Number of columns for the services list/grid layout. Defaults to 1 (single column) for the list variant.
 */
export type ServicesColumnCount = 1 | 2 | 3;
/**
 * Supplementary text rendered in italic below the section content (e.g. below the services list).
 */
export type SectionFootnote = string;
/**
 * Constrains the section content container to a maximum width. Full CSS length value, e.g. '976px'. Overrides the default responsive container max-widths.
 */
export type SectionMaxWidthOverride = string;
export type AvatarImageURL1 = string;
export type AvatarImageURL2 = string;
export type Testimonials = {
  title?: string;
  quote?: string;
  image?: AvatarImageURL2;
}[];
/**
 * Decorative italic phrase rendered as a secondary line under the main title (used by hero/sacrum).
 */
export type TitleAccent = string;
export type CardTitle = string;
export type LucideIconName = string;
export type Label2 = string;
export type Value = string;
export type Rows = ScheduleRow[];
/**
 * Compact data cards (e.g. mass hours, confession hours) rendered inside the hero (used by hero/sacrum).
 */
export type ScheduleCards = ScheduleCard[];
export type FeatureTags = string[];
export type AuthorName = string;
export type AuthorRole = string;
export type Metric = string;
export type MetricLabel = string;
export type StartDate = string;
export type EndDate = string;
/**
 * Short note shown top-right of an event card (e.g. 'Limited seats').
 */
export type MetaNote = string;
export type LinkURL1 = string;
export type LinkLabel = string;
/**
 * ID of the serviceCategories tab this item belongs to. When the section defines serviceCategories, only items matching the active tab are shown.
 */
export type Category = string;
export type Items = ServiceItem[];
export type CategoryID = string;
export type TabLabel = string;
/**
 * Optional tabs shown between the section header and the services list. Selecting a tab shows only the items whose category matches the tab id.
 */
export type ServiceCategoryTabs = ServiceCategory[];
/**
 * Optional id of the serviceCategories tab selected by default when the page loads. When omitted, the first tab is selected.
 */
export type DefaultCategoryTab = string;
/**
 * Rendered in uppercase.
 */
export type SignatureText = string;
/**
 * Optional. When omitted, the theme navLogoFlag gradient is used.
 */
export type FlagImageURL = string;
/**
 * Rendered as an italic blockquote with curly quotes.
 */
export type QuoteText = string;
/**
 * Rendered in uppercase below the quote.
 */
export type Author = string;
/**
 * Optional. When omitted, the theme navLogoFlag gradient bar is used.
 */
export type FlagImageURL1 = string;
/**
 * Optional paragraph rendered below a divider.
 */
export type NoteParagraph = string;
export type Timeline = TimelineItem[];
/**
 * Business name/address query for the embedded contact map (e.g. 'Restauracja Nostrano, Garwolin'). When set, the map resolves to Google's native place listing showing reviews/opinions instead of a plain address pin.
 */
export type GooglePlaceQuery1 = string;
/**
 * Per-day opening hours, one line each (e.g., 'poniedziałek 9:00 – 15:00'). Rendered as a multi-line block under the single 'hours' line.
 */
export type DetailedHours = string[];
/**
 * Separate schedule for client reception (e.g., 'środa 9:00 – 17:00').
 */
export type ReceptionHours = string;
/**
 * Localized label for the reception hours block (e.g., 'Client reception'). Rendered above receptionHours.
 */
export type ReceptionLabel = string;
/**
 * Extra contact info lines (e.g., bank account, EPUAP address).
 */
export type AdditionalInfo1 = string[];
/**
 * Temporary warning/alert shown prominently above the contact info (e.g. office closure on a given day). Plain text.
 */
export type ContactWarning = string;
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
export type LiveWebsiteURL = string;
export type CTALabel1 = string;
export type CTAURL = string;
export type Projects = ProjectItem[];
export type LeftColumnTitleEGManualWork = string;
export type RightColumnTitleEGAIAutomation = string;
export type LeftProblem = string;
export type RightSolution = string;
export type ComparisonRows = ComparisonRow[];
export type Name1 = string;
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
export type TemplateName = string;
export type Description2 = string;
export type ScreenshotURL = string;
export type LiveDemoURL = string;
export type Tags = string[];
export type TemplateItems = TemplateItem[];
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
export type BlogSlugLinksToABlogStandalonePostShownAfterServiceDetails = string;
export type Services = Service[];
export type Products1 = Product[];
export type EnableBooking = boolean;
export type ServiceID = string;
export type ServiceName = string;
export type DurationMinutes = number;
export type Price1 = number;
export type Description3 = string;
export type BookingServices = BookingService[];
export type Open = boolean;
export type OpeningTime = string;
export type ClosingTime = string;
export type SlotIntervalMinutes = number;
export type LeadTimeMinutes = number;
export type MaxAdvanceBookingDays = number;
export type BufferBetweenAppointmentsMinutes = number;
export type BlackoutDatesYYYYMMDD = string[];
/**
 * Override email for receiving contact form submissions. Use when the public contact email (business.contact.email) has delivery issues (e.g. strict government/corporate mail servers). Leave empty to use business.contact.email.
 */
export type ContactFormNotificationEmail = {
  [k: string]: unknown;
} & string;
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
  footerIcon?: FooterIconURL;
  iconLucide?: IconLucideName;
}
export interface BusinessContact {
  address?: Address;
  phone?: Phone;
  email?: Email;
  hours?: BusinessHours;
  additionalInfo?: AdditionalInfo;
  location?: GeographicLocation;
}
export interface GeographicLocation {
  latitude: Latitude;
  longitude: Longitude;
  googlePlaceQuery?: GooglePlaceQuery;
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
  contentWidth?: ContentWidth;
  servicesListDivider?: ServicesListDividerStyle;
  servicesNotClickable?: ServicesNotClickable;
  servicesMaxWidth?: ServicesSectionMaxWidth;
  servicesMenuStyle?: ServicesMenuStyle;
  servicesTitleFontFamily?: ServicesItemTitleFontFamily;
  servicesTitleSize?: ServicesItemTitleFontSize;
  servicesDescFontFamily?: ServicesItemDescriptionFontFamily;
  servicesDescSize?: ServicesItemDescriptionFontSize;
  servicesPriceFontFamily?: ServicesItemPriceFontFamily;
  servicesPriceSize?: ServicesItemPriceFontSize;
  servicesFootnoteFontFamily?: ServicesFootnoteFontFamily;
  servicesFootnoteSize?: ServicesFootnoteFontSize;
  servicesCtaHideIcon?: ServicesCTAHideIcon;
  headingWeight?: HeadingFontWeight;
  maxFontWeight?: MaxFontWeight;
  navFontSize?: NavbarFontSize;
  navLogoSize?: NavbarLogoFontSize;
  navLogoWeight?: NavbarLogoFontWeight;
  navLogoUppercase?: NavbarLogoUppercase;
  navLogoFont?: NavbarLogoFont;
  navLogoFontFamily?: NavbarLogoFontFamily;
  navLogoColor?: NavbarLogoColor;
  navLinkColor?: NavbarLinkColor;
  navLinksUppercase?: NavbarLinksUppercase;
  navLogoLetterSpacing?: NavbarLogoLetterSpacing;
  navCtaHideIcon?: NavbarCTAHideIcon;
  navCtaUppercase?: NavbarCTAUppercase;
  heroCtaHideIcon?: HeroCTAHideIcon;
  heroTextThemeColors?: HeroTextUsesThemeColors;
  heroBottomFade?: HeroBottomFade;
  heroTitleSize?: HeroTitleFontSize;
  heroTitleFontFamily?: HeroTitleFontFamily;
  heroSubtitleSize?: HeroSubtitleFontSize;
  heroBadgeLetterSpacing?: HeroBadgeLetterSpacing;
  heroSubtitleLetterSpacing?: HeroSubtitleLetterSpacing;
  heroTitleLetterSpacing?: HeroTitleLetterSpacing;
  navLinkLetterSpacing?: NavbarLinkLetterSpacing;
  buttonLetterSpacing?: ButtonLetterSpacing;
  navLogoFlag?: NavbarLogoFlagStripes;
  navHeightTop?: NavbarHeightAtTop;
  navHeightScrolled?: NavbarHeightWhenScrolled;
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
  radiusSm?: SmallBorderRadius;
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
  blog?: BlogSettings;
  hideBreadcrumbs?: HideBreadcrumbs;
}
export interface Navbar {
  variant?: NavbarVariant;
  logoText?: LogoTextOverride;
  logoSubtext?: LogoSubtext;
  hideLogoIcon?: HideLogoIcon;
  hideBorderOnTop?: HideBorderWhenAtTop;
  hideCta?: HideCTAButton;
  hideBlog?: HideBlogLink;
  showSocials?: ShowSocialMediaIconsInExtension;
  showAvailability?: ShowAvailabilityInExtension;
  showAddress?: ShowAddressInExtension;
  showAdditionalInfo?: ShowAdditionalInfoInExtension;
  extensions?: NavbarExtensions;
}
export interface FooterConfig {
  variant?: FooterVariant;
  copyright?: CopyrightText;
  tagline?: Tagline;
  flag?: BrandFlagColors;
  findUsTitle?: FindUsColumnTitle;
  hoursTitle?: OpeningHoursColumnTitle;
  hours?: OpeningHoursRows;
  signature?: FooterSignature;
  links?: FooterLinks;
  columns?: FooterColumns;
  name?: FooterDisplayName;
  background?: FooterBackground;
  extensions?: FooterExtensions;
}
export interface FooterHoursRow {
  label: DayLabel;
  value: HoursValue;
  highlight?: HighlightRow;
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
  color?: FooterBackgroundColorOverrideCustomCSSColorEG26201C;
}
export interface BlogSettings {
  postVariant?: BlogPostLayout;
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
  navOrder?: NavOrder;
  hideFromNav?: HideFromNav;
  sections: Sections;
}
export interface Section {
  type: SectionType;
  sectionId?: SharedSectionIDUsedWhenTypeIsRef;
  blogSlug?: BlogSlugUsedWhenTypeIsBlogStandalone;
  blogSlugs?: BlogSlugsFilterWhenTypeIsBlogRenderOnlyTheseBlogsInTheGivenOrderSupportsStandaloneBlogs;
  sidebarContact?: SidebarContactCard;
  variant?: Variant;
  background?: SectionBackground;
  backgroundColor?: SectionBackgroundColorOverrideCustomCSSColorEG26201C;
  cardBackgroundColor?: CardBackgroundColorOverrideCustomCSSColorEG26201C;
  header?: SectionHeader;
  paddingTop?: SectionTopPaddingOverrideEG120Px8Rem;
  paddingBottom?: SectionBottomPaddingOverrideEG120Px8Rem;
  backgroundImage?: BackgroundImageURL;
  image?: ImageURL;
  hideDots?: HideDecorativeDots;
  imagePosition?: ImagePosition;
  imageRounded?: RoundImageCorners;
  badgeLayout?: BadgeLayoutDirection;
  badgeVariant?: SectionLevelBadgeVariantOverride;
  badgeColor?: BadgeTextColorOverride;
  descriptionColor?: DescriptionTextColorOverride;
  contentFontFamily?: BodyContentFontFamilyOverride;
  contentFontSize?: BodyContentFontSizeOverride;
  imageWidth?: SectionImageWidthOverride;
  imageHeight?: SectionImageHeightOverride;
  imageBlend?: ImageBlendEffect;
  ctaColor?: CTATextColorOverride;
  scrollColor?: HeroScrollIndicatorColorOverride;
  textColor?: HeroTextColorOverride;
  mapPanelButtonColor?: MapPanelButtonColor;
  headerLineColor?: HeaderDecorativeLineColor;
  statsInverted?: InvertStatColorsLightBgDarkText;
  cta?: Cta1;
  secondaryCta?: Cta1;
  socialCta?: SocialCTAGhostButton;
  detailsLabel?: DetailsButtonLabelEGSeeDetailsLearnMore;
  columns?: ServicesColumnCount;
  footnote?: SectionFootnote;
  maxWidth?: SectionMaxWidthOverride;
  testimonial?: Testimonial;
  testimonials?: Testimonials;
  titleAccent?: TitleAccent;
  scheduleCards?: ScheduleCards;
  items?: Items;
  serviceCategories?: ServiceCategoryTabs;
  defaultCategory?: DefaultCategoryTab;
  story?: {
    title?: string;
    content?: string;
  };
  signature?: SignatureRow;
  stats?: StatItem[];
  commitment?: {
    title?: string;
    content?: string;
  };
  quote?: QuotePanel;
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
  templateItems?: TemplateItems;
  area?: ServiceAreaConfiguration;
}
export interface SidebarContactCard {
  name?: Name;
  role?: RoleTitle;
  image?: AvatarImageURL;
  phone?: Phone2;
  email?: Email1;
  cta?: Cta1;
}
export interface Cta1 {
  label: Label1;
  target?: Target;
}
export interface SectionHeader {
  badge?: BadgeText;
  title?: Title;
  subtitle?: Subtitle;
  layout?: HeaderLayout;
  flag?: ShowFlagBar;
}
/**
 * A ghost-style link rendered below the gallery grid (e.g. 'FOLLOW US on instagram @handle'). The full text is shown uppercase; the 'highlight' substring within it is rendered in 'highlightColor'.
 */
export interface SocialCTAGhostButton {
  text: Text;
  highlight?: HighlightSubstring;
  highlightColor?: HighlightColorCustomCSSColorEGD94A26;
  href?: LinkURL;
}
export interface Testimonial {
  title?: string;
  quote?: string;
  image?: AvatarImageURL1;
}
export interface ScheduleCard {
  title?: CardTitle;
  icon?: LucideIconName;
  rows?: Rows;
}
export interface ScheduleRow {
  label?: Label2;
  value?: Value;
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
  meta?: MetaNote;
  href?: LinkURL1;
  linkLabel?: LinkLabel;
  category?: Category;
}
export interface ServiceCategory {
  id: CategoryID;
  label: TabLabel;
}
/**
 * Optional row rendered below the about story content: a small country flag (26x24px) plus an uppercase tagline. The flag defaults to the theme navLogoFlag gradient when no flag image is provided.
 */
export interface SignatureRow {
  text?: SignatureText;
  flag?: FlagImageURL;
}
export interface StatItem {
  value?: string;
  label?: string;
}
/**
 * Right-side quote panel for the about "quote-split" variant: a small flag accent, an italic quote, an author line, a divider, a note paragraph and (via the section cta) a call to action.
 */
export interface QuotePanel {
  text?: QuoteText;
  author?: Author;
  flag?: FlagImageURL1;
  note?: NoteParagraph;
}
export interface TimelineItem {
  year?: string;
  title?: string;
  company?: string;
  description?: string;
}
export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  googlePlaceQuery?: GooglePlaceQuery1;
  hoursDetailed?: DetailedHours;
  receptionHours?: ReceptionHours;
  receptionLabel?: ReceptionLabel;
  additionalInfo?: AdditionalInfo1;
  notice?: ContactNotice;
  warning?: ContactWarning;
}
/**
 * Highlighted notice block displayed below the contact info (e.g., bank transfer instructions).
 */
export interface ContactNotice {
  title?: string;
  highlight?: string;
  description?: string;
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
  url?: LiveWebsiteURL;
  cta?: CTALink;
}
export interface CTALink {
  label?: CTALabel1;
  href?: CTAURL;
}
export interface ComparisonRow {
  left?: LeftProblem;
  right?: RightSolution;
}
export interface TeamMember {
  name?: Name1;
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
export interface TemplateItem {
  name: TemplateName;
  description: Description2;
  screenshot: ScreenshotURL;
  demoUrl: LiveDemoURL;
  tags?: Tags;
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
  blogSlug?: BlogSlugLinksToABlogStandalonePostShownAfterServiceDetails;
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
  description?: Description3;
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
  email?: ContactFormNotificationEmail;
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
