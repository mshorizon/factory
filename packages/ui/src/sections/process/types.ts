export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  icon?: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  className?: string;
}
