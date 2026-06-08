"use client";

import { Star, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsQuotesProps } from "./types";

/**
 * TestimonialsQuotes — review cards laid out in a 2-column grid on a dark
 * background. Each card shows a 5-star rating, an italic serif quote, a
 * divider, and a footer with the guest name + ordered dish on the left and a
 * date on the right. An optional underlined text CTA sits below the grid.
 */
export function TestimonialsQuotes({ items, ctaLabel, ctaHref, className }: TestimonialsQuotesProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <StaggerContainer
        className="grid md:grid-cols-2 gap-spacing-lg"
        staggerDelay={0.1}
      >
        {items.map((item, index) => {
          const name = item.author || item.title;
          return (
            <StaggerItem
              key={index}
              direction="up"
              distance={24}
              className={index >= 2 ? "hidden md:block" : undefined}
            >
              <div
                className="h-full flex flex-col border border-border/15 rounded-radius p-spacing-xl transition-colors duration-300 hover:border-primary"
                data-field={`items.${index}`}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-spacing-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-[18px] w-[18px] fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <p
                  className="flex-1 font-heading-secondary italic text-lg leading-relaxed text-foreground/90"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>

                {/* Divider */}
                <div className="my-spacing-lg h-px w-full bg-border/15" />

                {/* Footer */}
                <div className="flex items-end justify-between gap-spacing-md">
                  <div className="min-w-0">
                    {name && (
                      <p
                        className="font-medium text-foreground"
                        data-field={`items.${index}.author`}
                      >
                        {name}
                      </p>
                    )}
                    {item.role && (
                      <p
                        className="text-sm text-muted"
                        data-field={`items.${index}.role`}
                      >
                        {item.role}
                      </p>
                    )}
                  </div>
                  {item.meta && (
                    <p
                      className="flex-shrink-0 text-sm text-muted"
                      data-field={`items.${index}.meta`}
                    >
                      {item.meta}
                    </p>
                  )}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {ctaLabel && ctaHref && (
        <div className="mt-spacing-3xl flex justify-center">
          <a
            href={ctaHref}
            className="group inline-flex items-center gap-spacing-sm border-b border-accent/40 pb-1 text-sm font-medium uppercase [letter-spacing:var(--btn-letter-spacing,.05rem)] text-primary transition-colors hover:border-accent"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      )}
    </div>
  );
}
