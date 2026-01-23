import type { ReactNode } from "react";

export interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export interface HeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  cta?: CTAButton;
  secondaryCta?: CTAButton;
  backgroundImage?: string;
  image?: string;
  overlay?: boolean;
  align?: "left" | "center" | "right";
  fullHeight?: boolean;
  children?: ReactNode;
  className?: string;
}
