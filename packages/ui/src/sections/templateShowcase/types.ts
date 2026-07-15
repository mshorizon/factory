export interface TemplateItem {
  name: string;
  description: string;
  screenshot: string;
  demoUrl: string;
  tags?: string[];
  accent?: string;
}

export interface TemplateShowcaseProps {
  templates: TemplateItem[];
  pills?: string[];
  className?: string;
}
