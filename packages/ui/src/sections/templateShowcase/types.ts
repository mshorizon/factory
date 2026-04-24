export interface TemplateItem {
  name: string;
  description: string;
  screenshot: string;
  demoUrl: string;
  tags?: string[];
}

export interface TemplateShowcaseProps {
  templates: TemplateItem[];
  className?: string;
}
