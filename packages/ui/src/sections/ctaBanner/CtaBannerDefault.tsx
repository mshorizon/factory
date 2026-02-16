"use client";

import { ArrowRight, Phone } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { CtaBannerProps } from "./types";

export function CtaBannerDefault({
  title,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: CtaBannerProps) {
  const isPhone = ctaHref.startsWith("tel:");

  return (
    <ScrollReveal className={cn("py-12 md:py-20", className)}>
      <div className="space-y-8">
        {title && (
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-foreground leading-tight max-w-3xl"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
        {ctaLabel && (
          <Button asChild size="xl" className="shadow-lg shadow-primary/25">
            <a href={ctaHref}>
              {ctaLabel}
              {isPhone ? <Phone className="ml-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
            </a>
          </Button>
        )}
      </div>
    </ScrollReveal>
  );
}
