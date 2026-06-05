export interface SelectField {
  name: string;
  label?: string;
  placeholder?: string;
  options: string[];
}

export interface ContactForm {
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  submitButton?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  selectFields?: SelectField[];
}

export interface ContactNotice {
  title?: string;
  highlight?: string;
  description?: string;
}

export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  /** Place query for the embedded map; resolves to Google's native listing with reviews/opinions. */
  googlePlaceQuery?: string;
  hoursDetailed?: string[];
  receptionHours?: string;
  receptionLabel?: string;
  additionalInfo?: string[];
  notice?: ContactNotice;
  warning?: string;
  industry?: string;
  city?: string;
}

export interface ContactLabels {
  getInTouchTitle?: string;
  getInTouchSubtitle?: string;
  addressLabel?: string;
  phoneLabel?: string;
  emailLabel?: string;
  hoursLabel?: string;
}

export interface ContactCenteredProps {
  title?: string;
  subtitle?: string;
  form?: ContactForm;
  businessId?: string;
  turnstileSiteKey?: string;
  className?: string;
}

export interface ContactSplitProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  form?: ContactForm;
  info?: ContactInfo;
  labels?: ContactLabels;
  businessId?: string;
  business?: any;
  turnstileSiteKey?: string;
  className?: string;
}

export interface ContactSocialLink {
  platform: string;
  url: string;
  /** Optional display text; when omitted it is derived from the platform/URL. */
  label?: string;
}

export interface ContactRestaurantLabels {
  contactHeading?: string;
  socialHeading?: string;
  showOnMap?: string;
}

export interface ContactRestaurantProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  info?: ContactInfo;
  socials?: ContactSocialLink[];
  ctaLabel?: string;
  ctaHref?: string;
  labels?: ContactRestaurantLabels;
  className?: string;
}

export interface ContactCTAProps {
  badge?: string;
  badgeVariant?: "accent" | "accent-no-line" | "text" | "outlined";
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaVariant?: "accent" | "primaryLight";
  className?: string;
}

export interface ContactCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  form?: ContactForm;
  info?: ContactInfo;
  labels?: ContactLabels;
  businessId?: string;
  business?: any;
  turnstileSiteKey?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export interface ContactLightPanelProps {
  title?: string;
  subtitle?: string;
  form?: ContactForm;
  info?: ContactInfo;
  businessId?: string;
  business?: any;
  turnstileSiteKey?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export interface ContactProfessionalProps {
  title?: string;
  subtitle?: string;
  form?: ContactForm;
  info?: ContactInfo;
  businessId?: string;
  business?: any;
  turnstileSiteKey?: string;
  ctaLabel?: string;
  ctaHref?: string;
  iconColor?: "primary" | "primary-light";
  submitButtonColor?: "primary" | "primary-light";
  headerLineColor?: "primary" | "foreground";
  formBackground?: "dark" | "light";
  className?: string;
}
