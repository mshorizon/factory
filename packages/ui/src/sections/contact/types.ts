export interface ContactForm {
  namePlaceholder?: string;
  emailPlaceholder?: string;
  messagePlaceholder?: string;
  submitButton?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
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
  className?: string;
}

export interface ContactSplitProps {
  title?: string;
  subtitle?: string;
  form?: ContactForm;
  info?: ContactInfo;
  labels?: ContactLabels;
  className?: string;
}
