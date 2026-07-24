"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TemplateShowcaseProps } from "./types";

/**
 * Browser-window style showcase: three equal columns, each card framed as a
 * mini browser (chrome header bar with the site name, screenshot body,
 * industry-label footer).
 *
 * The `pills` act as a clickable category filter. The first pill (e.g.
 * "Popular") is selected by default and shows the full curated set; every
 * other pill filters `templates` to those whose `category` matches it. A
 * category with no dedicated templates gracefully falls back to the curated
 * set, so every pill always presents a full showcase.
 */
export function TemplateShowcaseBrowser({ templates, pills, className }: TemplateShowcaseProps) {
  const [active, setActive] = React.useState(0);

  const visibleTemplates = React.useMemo(() => {
    // First pill (index 0) is the curated "Popular" set — show everything.
    if (!pills || pills.length === 0 || active === 0) return templates;
    const activePill = pills[active];
    const matches = templates.filter(
      (tpl) => tpl.category === activePill || tpl.tags?.includes(activePill)
    );
    // Fall back to the curated set for categories without dedicated templates.
    return matches.length > 0 ? matches : templates;
  }, [templates, pills, active]);

  return (
    <div className={className}>
      {pills && pills.length > 0 && (
        <div
          className="mb-spacing-2xl flex flex-wrap justify-center gap-spacing-sm max-w-4xl mx-auto"
          role="tablist"
          aria-label="Template categories"
        >
          {pills.map((pill, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                "px-spacing-md py-spacing-xs rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer",
                active === i
                  ? "bg-primary text-on-accent shadow-md"
                  : "bg-card text-foreground shadow-sm hover:bg-secondary"
              )}
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      <StaggerContainer key={active} className="grid md:grid-cols-3 gap-spacing-lg" staggerDelay={0.1}>
        {visibleTemplates.map((tpl, index) => (
          <StaggerItem key={index} direction="up" distance={30}>
            <a
              href={tpl.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("group flex flex-col rounded-radius overflow-hidden bg-card shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300", tpl.headline && "border border-border")}
            >
              <div
                className="flex items-center justify-between px-spacing-md py-spacing-sm bg-foreground"
                style={tpl.accent ? { backgroundColor: tpl.accent } : undefined}
              >
                <span className="text-sm font-bold text-background truncate">{tpl.name}</span>
                <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                </span>
              </div>

              {tpl.headline ? (
                <div className="flex flex-col justify-center gap-spacing-md aspect-[4/3] p-spacing-lg bg-secondary">
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground">{tpl.headline}</h3>
                  {tpl.ctaLabel && (
                    <span className="self-start rounded-radius bg-primary px-spacing-md py-spacing-xs text-sm font-semibold text-on-accent">{tpl.ctaLabel}</span>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] overflow-hidden bg-foreground/5">
                  <img
                    src={tpl.screenshot}
                    alt={tpl.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="px-spacing-md py-spacing-sm border-t border-foreground/10">
                <span className="font-bold text-foreground">{tpl.tags?.[0] ?? tpl.name}</span>
              </div>
            </a>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
