"use client";

import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";

interface CtaBannerPanelProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function CtaBannerPanel({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: CtaBannerPanelProps) {
  return (
    <ScrollReveal className={className}>
      <div className="rounded-3xl bg-primary text-on-primary p-spacing-xl lg:p-spacing-2xl lg:px-spacing-3xl flex flex-col md:flex-row md:items-center gap-spacing-lg md:gap-spacing-2xl shadow-xl shadow-primary/25">
        <div className="flex-1">
          {title && (
            <h2
              className="text-2xl md:text-3xl font-extrabold leading-tight font-heading"
              data-field="header.title"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm md:text-base leading-relaxed opacity-85 mt-spacing-xs" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
        </div>
        {ctaLabel && (
          <div className="shrink-0" style={pageSurfaceVars}>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="!rounded-full h-12 px-7 text-[15px] font-bold bg-card text-primary-dark hover:bg-card/90 hover:text-primary-dark shadow-lg transition-all"
              data-field="cta"
            >
              <a
                href={ctaHref}
                onClick={() => (window as any).umami?.track("cta-click", { section: "ctaBanner", label: ctaLabel })}
              >
                {ctaLabel}
              </a>
            </Button>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
