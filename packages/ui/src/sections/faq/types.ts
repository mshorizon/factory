export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface FAQSplitProps {
  items: FAQItem[];
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  ctaHref?: string;
}
