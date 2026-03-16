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
