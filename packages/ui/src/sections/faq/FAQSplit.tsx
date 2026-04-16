"use client";

import * as React from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../../atoms/Badge";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FAQSplitProps } from "./types";

export function FAQSplit({
  items,
  className,
  title,
  subtitle,
  badge,
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
        {badge && (
          <div
            data-reveal
            data-reveal-delay="0"
            className="flex flex-col items-start gap-spacing-sm mb-spacing-lg"
          >
            <div className="w-8 h-[2px]" style={{ backgroundColor: "var(--primary-dark)" }} />
            <Badge variant="accent" data-field="header.badge" className="px-0 py-0 text-[14px] tracking-[.05rem] uppercase font-medium" style={{ color: "var(--primary-dark)" }}>
              {badge}
            </Badge>
          </div>
        )}
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

      {/* Right column — expandable cards */}
      <StaggerContainer className="flex flex-col gap-spacing-sm" staggerDelay={0.06}>
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <StaggerItem key={index} direction="right" distance={15}>
              <div
                className="bg-card rounded-radius overflow-hidden"
                data-field={`faqItems.${index}`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-spacing-lg text-left transition-colors group"
                >
                  <span
                    className="text-xl font-heading text-foreground pr-spacing-md leading-snug"
                    data-field={`faqItems.${index}.question`}
                  >
                    {item.question}
                  </span>
                  <span className="flex-shrink-0 text-muted transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
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
                      className="px-spacing-lg pb-spacing-lg text-sm font-sans text-muted leading-relaxed"
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
    </div>
  );
}
