"use client";

import { ArrowRight } from "lucide-react";
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
  return (
    <ScrollReveal className={cn("py-12 md:py-20", className)}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {title && (
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-foreground leading-tight max-w-3xl"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
        {ctaLabel && (
          <div className="flex-shrink-0">
            <Button asChild size="xl" className="rounded-full h-16 w-16 md:h-20 md:w-20 p-0 shadow-lg shadow-primary/25">
              <a href={ctaHref} aria-label={ctaLabel}>
                <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
