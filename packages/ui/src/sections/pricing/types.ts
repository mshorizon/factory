export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features?: string[];
  cta?: { label: string; href?: string };
  highlighted?: boolean;
  badge?: string;
}

export interface PricingDefaultProps {
  tiers: PricingTier[];
  className?: string;
}
