"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ContactCTAProps } from "./types";

/**
 * ContactMinimal — lightweight "Let's get in touch" variant.
 *
 * Visual spec (tasks/contact.png):
 *   - Small uppercase primary-colored eyebrow (badge)
 *   - Large serif heading
 *   - 1–2 lines of muted centered body
 *   - Pill "Contact me" button + adjacent circular arrow button
 */
export function ContactMinimal({
  badge,
  title,
  subtitle,
  ctaLabel = "Contact me",
  ctaHref = "/contact",
  className,
}: ContactCTAProps) {
  const trackClick = () =>
    (window as any).umami?.track("cta-click", {
      section: "contact-minimal",
      label: ctaLabel,
    });

  return (
    <ScrollReveal className={cn("text-center", className)}>
      <div className="flex flex-col items-center gap-spacing-lg">
        {badge && (
          <span
            className="text-sm uppercase tracking-widest font-medium"
            style={{ color: "var(--primary)" }}
            data-field="header.badge"
          >
            {badge}
          </span>
        )}
        {title && (
          <h2
            className="text-4xl md:text-5xl lg:text-6xl text-foreground font-heading max-w-[720px] leading-tight"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="text-muted max-w-md leading-relaxed"
            data-field="header.subtitle"
          >
            {subtitle}
          </p>
        )}
        {ctaLabel && (
          <div className="flex items-center gap-spacing-xs mt-spacing-sm">
            <a
              href={ctaHref}
              className="inline-flex items-center bg-primary text-on-primary rounded-full px-7 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
              onClick={trackClick}
            >
              {ctaLabel}
            </a>
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center bg-primary text-on-primary rounded-full w-11 h-11 hover:bg-primary/90 transition-colors"
              aria-label={ctaLabel}
              onClick={trackClick}
            >
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
