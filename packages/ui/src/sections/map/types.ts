export interface GoogleMapProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
  badge?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  badgeVariant?: "accent" | "outlined" | "text";
}
