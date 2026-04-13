"use client";

import * as React from "react";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FAQSplitProps } from "./types";

export function FAQSplit({
  items,
  className,
  title,
  subtitle,
  ctaText,
  ctaHref,
}: FAQSplitProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-spacing-3xl lg:gap-spacing-3xl", className)}>
      {/* Left column — header + CTA */}
      <div className="flex flex-col items-start">
        <div className="w-12 h-[1px] bg-border mb-spacing-lg" data-reveal data-reveal-delay="0" />
        {title && (
          <h2
            data-reveal
            data-reveal-delay="100"
            className="text-3xl md:text-4xl lg:text-5xl text-foreground font-heading mb-spacing-lg"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            data-reveal
            data-reveal-delay="200"
            className="text-sm text-muted mb-spacing-md"
            data-field="header.subtitle"
          >
            {subtitle}
          </p>
        )}
        {ctaText && ctaHref && (
          <a
            data-reveal
            data-reveal-delay="300"
            href={ctaHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors group"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
      </div>

      {/* Right column — accordion items */}
      <StaggerContainer className="flex flex-col" staggerDelay={0.06}>
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <StaggerItem key={index} direction="right" distance={15}>
              <div
                className="border-t border-border"
                data-field={`faqItems.${index}`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between py-spacing-lg text-left transition-colors group"
                >
                  <span
                    className="text-base font-medium font-heading text-foreground pr-spacing-md"
                    data-field={`faqItems.${index}.question`}
                  >
                    {item.question}
                  </span>
                  <span className="flex-shrink-0 text-foreground">
                    {isOpen ? (
                      <Minus className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
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
                      className="pb-spacing-lg text-sm text-muted leading-relaxed"
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
        {/* Bottom border for the last item */}
        <div className="border-t border-border" />
      </StaggerContainer>
    </div>
  );
}
