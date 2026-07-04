"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { Button } from "../../atoms/Button";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export interface HeroStudioTab {
  /** Tab label */
  title?: string;
  /** Screenshot shown inside the browser frame when this tab is active */
  image?: string;
  /** Text shown inside the fake browser URL bar */
  meta?: string;
}

export interface HeroStudioProps extends HeroProps {
  /** Pill tabs above the browser frame — each swaps the framed screenshot + URL text */
  items?: HeroStudioTab[];
  /** Small mono footnote rendered below the browser frame */
  footnote?: string;
}

/**
 * Splits the title on a "|" delimiter: text before it is rendered in the
 * foreground color, text after it in the primary color.
 */
function renderTitle(title: string) {
  const idx = title.indexOf("|");
  if (idx === -1) return title;
  return (
    <>
      <span>{title.slice(0, idx)}</span>
      <span className="text-primary">{title.slice(idx + 1)}</span>
    </>
  );
}

export function HeroStudio({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  items = [],
  footnote,
  className,
  isHomePage = false,
}: HeroStudioProps) {
  const [activeTab, setActiveTab] = useState(0);
  const active = items[activeTab] || items[0];

  return (
    <section
      className={cn(
        "relative z-0 bg-background",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-spacing-2xl lg:gap-14 items-center">
          {/* Content side */}
          <div className="flex flex-col items-start">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <span
                  className="inline-flex items-center gap-spacing-xs bg-primary-light text-primary-dark rounded-full px-4 py-1.5 text-[13px] font-bold mb-spacing-lg"
                  data-field="header.badge"
                >
                  {badge}
                </span>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.1} direction="up">
              <h1
                className="text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.12] font-extrabold tracking-tight text-foreground mb-spacing-lg font-heading"
                data-field="header.title"
              >
                {renderTitle(title)}
              </h1>
            </ScrollReveal>

            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p
                  className="text-lg text-muted leading-relaxed mb-spacing-2xl max-w-xl"
                  data-field="header.subtitle"
                >
                  {subtitle}
                </p>
              </ScrollReveal>
            )}

            {(cta || secondaryCta) && (
              <ScrollReveal delay={0.3} direction="up">
                <div className="flex flex-wrap gap-spacing-md">
                  {cta && (
                    <Button
                      asChild
                      size="lg"
                      variant={cta.variant || "default"}
                      className="!rounded-full h-12 px-7 text-[15px] font-bold shadow-lg shadow-primary/25 hover:brightness-95 transition-all group"
                      data-field="cta"
                    >
                      <a
                        href={cta.href}
                        className="flex items-center gap-spacing-sm"
                        onClick={() => (window as any).umami?.track("cta-click", { section: "hero", label: cta.label })}
                      >
                        <span>{cta.label}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="!rounded-full h-12 px-7 text-[15px] font-bold bg-primary-light text-primary-dark hover:bg-primary-light/80 hover:text-primary-dark transition-all"
                      data-field="secondaryCta"
                    >
                      <a
                        href={secondaryCta.href}
                        onClick={() => (window as any).umami?.track("cta-click", { section: "hero-secondary", label: secondaryCta.label })}
                      >
                        {secondaryCta.label}
                      </a>
                    </Button>
                  )}
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* Browser-frame side */}
          <ScrollReveal delay={0.2} direction="right" distance={50}>
            <div className="w-full" style={pageSurfaceVars}>
              {/* Pill tabs */}
              {items.length > 1 && (
                <div className="flex flex-wrap gap-spacing-xs mb-spacing-md" data-field="items">
                  {items.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      aria-pressed={i === activeTab}
                      className={cn(
                        "rounded-full px-4 py-2 text-[13px] font-bold transition-colors cursor-pointer",
                        i === activeTab
                          ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                          : "bg-card text-muted shadow-sm hover:text-foreground"
                      )}
                      data-field={`items.${i}.title`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Browser frame */}
              <div className="bg-card rounded-2xl shadow-2xl shadow-primary/15 overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  {active?.meta && (
                    <span
                      className="flex-1 ml-2.5 bg-card rounded-md px-3 py-1 font-mono text-[11px] text-muted truncate"
                      data-field={`items.${activeTab}.meta`}
                    >
                      {active.meta}
                    </span>
                  )}
                </div>
                {/* Screenshot */}
                {active?.image && (
                  <div className="aspect-[16/10] w-full overflow-hidden" data-field={`items.${activeTab}.image`}>
                    <SafeImage
                      key={active.image}
                      src={active.image}
                      alt={active.title || ""}
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                )}
              </div>

              {footnote && (
                <p className="font-mono text-[11px] text-muted mt-spacing-sm text-center" data-field="footnote">
                  {footnote}
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
