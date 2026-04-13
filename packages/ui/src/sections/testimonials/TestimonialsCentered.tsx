"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsCentered({ items, className }: TestimonialsGridProps) {
  const item = items[0];
  if (!item) return null;

  return (
    <div className={cn("flex flex-col items-center text-center max-w-3xl mx-auto", className)}>
      {/* Title - 40px primary (heading) font */}
      {item.title && (
        <ScrollReveal delay={0} direction="up" distance={20}>
          <h3
            className="text-[2.5rem] leading-tight font-heading text-foreground mb-spacing-lg"
            data-field="items.0.title"
          >
            {item.title}
          </h3>
        </ScrollReveal>
      )}

      {/* Description - 16px secondary (sans) font */}
      {item.description && (
        <ScrollReveal delay={0.1} direction="up" distance={20}>
          <p
            className="text-base font-sans text-muted leading-relaxed"
            data-field="items.0.description"
          >
            {item.description}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
