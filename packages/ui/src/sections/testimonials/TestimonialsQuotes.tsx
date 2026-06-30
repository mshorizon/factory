"use client";

import { Star, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsQuotesProps } from "./types";

/**
 * TestimonialsQuotes — review cards laid out in a single column on a dark
 * background. Each card shows a large translucent quotation mark on the left,
 * an italic serif quote, a divider, and a footer row that begins with the
 * 5-star rating followed by the guest name + ordered dish, with the date on
 * the right. An optional underlined text CTA sits below the cards.
 */
export function TestimonialsQuotes({ items, ctaLabel, ctaHref, className }: TestimonialsQuotesProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <StaggerContainer
        className="grid grid-cols-1 gap-spacing-lg"
        staggerDelay={0.1}
      >
        {items.map((item, index) => {
          const name = item.author || item.title;
          return (
            <StaggerItem
              key={index}
              direction="up"
              distance={24}
              className={index > 0 ? "border-t border-border/10" : undefined}
            >
              <div
                className="h-full flex gap-spacing-lg rounded-radius p-spacing-xl"
                data-field={`items.${index}`}
              >
                {/* Decorative quotation mark (CTA dark color) */}
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 font-heading-secondary leading-none text-[32px] text-primary-dark select-none"
                >
                  &ldquo;
                </span>

                <div className="flex flex-1 flex-col min-w-0">
                  {/* Quote (Cormorant serif) */}
                  <p
                    className="flex-1 italic text-lg leading-relaxed text-foreground/90"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>

                  {/* Footer (16px gap above) */}
                  <div className="mt-spacing-md flex items-center justify-between gap-spacing-md">
                    <div className="flex items-center gap-spacing-md min-w-0">
                      {/* Rating */}
                      <div className="flex flex-shrink-0 gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-[18px] w-[18px] fill-primary text-primary" />
                        ))}
                      </div>
                      {(name || item.role) && (
                        <div className="flex items-center gap-spacing-sm min-w-0">
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
                              className="text-sm italic text-muted"
                              data-field={`items.${index}.role`}
                            >
                              {item.role}
                            </p>
                          )}
                        </div>
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
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {ctaLabel && ctaHref && (
        <div className="mt-spacing-3xl flex justify-center">
          <a
            href={ctaHref}
            className="group inline-flex items-center gap-spacing-sm rounded-radius border border-primary-dark px-spacing-lg py-spacing-sm text-sm font-medium uppercase [letter-spacing:var(--btn-letter-spacing,.05rem)] text-primary transition-colors hover:border-white hover:text-white"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      )}
    </div>
  );
}
