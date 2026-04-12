"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ContactCTAProps } from "./types";

export function ContactCTA({
  badge,
  title,
  subtitle,
  ctaLabel = "Contact me",
  ctaHref = "/contact",
  className,
}: ContactCTAProps) {
  return (
    <ScrollReveal className={cn("text-center", className)}>
      <div className="flex flex-col items-center gap-spacing-lg">
        {badge && (
          <Badge
            variant="accent"
            data-field="header.badge"
            style={{ color: "var(--primary-dark)" }}
          >
            {badge}
          </Badge>
        )}
        {title && (
          <h2
            className="text-3xl md:text-4xl lg:text-5xl text-foreground font-heading max-w-[700px]"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="text-muted max-w-lg leading-relaxed"
            data-field="header.subtitle"
          >
            {subtitle}
          </p>
        )}
        {ctaLabel && (
          <div className="flex items-center gap-1 mt-spacing-sm">
            <a
              href={ctaHref}
              className="inline-flex items-center bg-primary text-on-primary rounded-full px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
              onClick={() =>
                (window as any).umami?.track("cta-click", {
                  section: "contact-cta",
                  label: ctaLabel,
                })
              }
            >
              {ctaLabel}
            </a>
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center bg-primary text-on-primary rounded-full w-12 h-12 hover:bg-primary/90 transition-colors"
              aria-label={ctaLabel}
            >
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
