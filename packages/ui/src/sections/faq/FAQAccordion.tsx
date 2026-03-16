"use client";

import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FAQAccordionProps } from "./types";

export function FAQAccordion({ items, image, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("grid gap-spacing-2xl", image ? "lg:grid-cols-2" : "", className)}>
      <StaggerContainer className="flex flex-col gap-spacing-md" staggerDelay={0.08}>
        {items.map((item, index) => {
          // Alternate left/right for list items
          const direction = index % 2 === 0 ? "left" : "right";
          return (
          <StaggerItem key={index} direction={direction} distance={20}>
            <div
              className="border border-border rounded-radius overflow-hidden"
              data-field={`faqItems.${index}`}
            >
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-primary/5"
              >
                <span
                  className="text-base font-semibold text-foreground pr-4"
                  data-field={`faqItems.${index}.question`}
                >
                  {item.question}
                </span>
                <span className="flex-shrink-0 text-primary">
                  {openIndex === index ? (
                    <Minus className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-in-out",
                  openIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p
                    className="px-5 pb-5 text-sm text-muted leading-relaxed"
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

      {image && (
        <div className="hidden lg:block">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover rounded-radius"
          />
        </div>
      )}
    </div>
  );
}
