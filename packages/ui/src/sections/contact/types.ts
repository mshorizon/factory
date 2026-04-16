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

export interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
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

export interface ContactCTAProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
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
  className?: string;
}
