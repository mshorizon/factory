export interface TemplateItem {
  name: string;
  description: string;
  screenshot: string;
  demoUrl: string;
  tags?: string[];
  accent?: string;
  headline?: string;
  ctaLabel?: string;
  /** Pill category this template belongs to (browser variant filter). */
  category?: string;
}

export interface TemplateShowcaseProps {
  templates: TemplateItem[];
  pills?: string[];
  className?: string;
}
