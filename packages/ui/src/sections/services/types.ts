export interface ServiceItem {
  title: string;
  description: string;
  price?: string;
  icon?: string;
  image?: string;
}

export interface ServicesProps {
  items: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}
