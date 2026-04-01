"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FAQAccordionProps } from "./types";

export function FAQBordered({ items, className, ctaText, ctaHref }: FAQAccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="relative">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 50%)",
        }}
      />

      <div className={cn("relative space-y-3", className)}>
        <StaggerContainer className="space-y-3" staggerDelay={0.08}>
          {items.map((item, index) => {
            const direction = index % 2 === 0 ? "left" : "right";
            const isOpen = openItems.has(index);

            return (
              <StaggerItem key={index} direction={direction} distance={20}>
                <div
                  className="rounded-md border border-border/30 bg-[rgba(255,255,255,0.05)] px-5 py-[1.125rem]"
                  data-field={`faqItems.${index}`}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between text-left group"
                  >
                    <span
                      className="text-base font-medium text-foreground pr-spacing-md"
                      data-field={`faqItems.${index}.question`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        "flex-shrink-0 text-foreground transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="text-sm text-muted leading-relaxed pb-2 pt-spacing-sm"
                        data-field={`faqItems.${index}.answer`}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {ctaText && ctaHref && (
          <div className="pt-spacing-lg">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-on-accent font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
