"use client";

import * as React from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FAQAccordionProps } from "./types";

export function FAQAccordion({ items, className, ctaText, ctaHref }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-spacing-3xl">
      <StaggerContainer className={cn("flex flex-col", className)} staggerDelay={0.08}>
        {items.map((item, index) => {
          const direction = index % 2 === 0 ? "left" : "right";
          const isOpen = openIndex === index;
          const isLast = index === items.length - 1;

          return (
          <StaggerItem key={index} direction={direction} distance={20}>
            <div
              className={cn(
                "border-b border-border",
                isLast && "border-b-0"
              )}
              data-field={`faqItems.${index}`}
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between py-spacing-lg text-left transition-colors group"
              >
                <span
                  className="text-2xl font-medium text-foreground pr-spacing-md"
                  data-field={`faqItems.${index}.question`}
                >
                  {item.question}
                </span>
                <span className={cn(
                  "flex-shrink-0 text-foreground transition-transform duration-300",
                  isOpen && "rotate-180"
                )}>
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
                    className="pb-spacing-lg text-base text-muted leading-relaxed"
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
        <a
          href={ctaHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-foreground font-medium rounded-full hover:opacity-90 transition-opacity w-fit"
        >
          {ctaText}
          <ArrowRight className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
