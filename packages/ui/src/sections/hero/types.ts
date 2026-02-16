import type { ReactNode } from "react";

export interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export interface HeroTestimonial {
  title: string;
  quote: string;
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
  testimonial?: HeroTestimonial;
  testimonials?: HeroTestimonial[];
  children?: ReactNode;
  className?: string;
}
