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

export interface ComparisonColumn {
  title?: string;
  /** Badge pill shown on the highlighted column header */
  badge?: string;
  highlighted?: boolean;
  /** One value per criterion — values[i] aligns with criteria[i] */
  values?: string[];
}

export interface ComparisonTripleProps {
  /** Row labels (first column) */
  criteria?: string[];
  columns?: ComparisonColumn[];
  className?: string;
}
