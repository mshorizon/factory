export interface ComparisonRow {
  left: string;
  right: string;
}

export interface ComparisonTableProps {
  leftTitle: string;
  rightTitle: string;
  rows: ComparisonRow[];
  className?: string;
}
