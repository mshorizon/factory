"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";

interface CtaBannerCardProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function CtaBannerCard({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: CtaBannerCardProps) {
  return (
    <ScrollReveal className={cn("max-w-4xl mx-auto", className)}>
      <div
        className="rounded-xl relative overflow-hidden text-center"
        style={{
          background:
            "linear-gradient(149deg, color-mix(in srgb, var(--primary) 40%, transparent) 0%, var(--background) 29%, var(--background) 74%, color-mix(in srgb, var(--primary) 40%, transparent) 100%)",
        }}
      >
        <div className="py-20 px-8">
          {title && (
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-normal text-foreground max-w-2xl mx-auto"
              data-field="header.title"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-muted mt-spacing-md" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
          {ctaLabel && (
            <div className="mt-spacing-xl">
              <Button asChild size="default" className="!rounded-lg">
                <a href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}
