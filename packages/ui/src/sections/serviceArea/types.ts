export interface ServiceAreaStat {
  value: string;
  label: string;
}

export interface ServiceAreaProps {
  areas: string[];
  stats?: ServiceAreaStat[];
  className?: string;
}
