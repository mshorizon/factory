"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { EventsCardsProps } from "./types";

export function EventsCards({ badge, title, items, linkLabel, className }: EventsCardsProps) {
  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      {/* Header — left aligned eyebrow + large heading */}
      <div className="text-left">
        {badge && (
          <span
            className="block text-sm font-medium uppercase tracking-[0.15em] text-primary mb-spacing-lg"
            data-field="header.badge"
          >
            {badge}
          </span>
        )}
        {title && (
          <h2
            className="text-4xl md:text-5xl lg:text-6xl text-foreground font-heading"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
        {items.map((item, index) => {
          const tag = item.tags?.[0];
          const href = item.href || "#";
          const isExternal = href.startsWith("http");
          // No dedicated event page → clicking the card guides the visitor to the
          // contact section (e.g. to book/reserve). Targets the section generically
          // via the [data-section-type] anchor emitted by the engine's dispatcher.
          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (href === "#") {
              e.preventDefault();
              document
                .querySelector('[data-section-type="contact"]')
                ?.scrollIntoView({ behavior: "smooth" });
            }
          };
          return (
            <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={30}>
              <a
                href={href}
                onClick={handleClick}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="group flex h-full flex-col overflow-hidden rounded-radius border border-border/10 bg-surface-alt transition-colors duration-300 hover:border-primary"
                data-field={`items.${index}`}
              >
                {/* Image with overlaid badge / date / meta */}
                {item.image && (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                    {/* Legibility gradient so overlaid copy stays readable over any photo */}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                    {tag && (
                      <span
                        className="absolute left-spacing-md top-spacing-md inline-flex items-center rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white"
                        data-field={`items.${index}.tags`}
                      >
                        {tag}
                      </span>
                    )}
                    {item.dateStart && (
                      <span
                        className="absolute bottom-spacing-md left-spacing-md font-heading text-sm text-muted"
                        data-field={`items.${index}.dateStart`}
                      >
                        {item.dateStart}
                      </span>
                    )}
                    {item.meta && (
                      <span
                        className="absolute bottom-spacing-md right-spacing-md text-sm text-muted"
                        data-field={`items.${index}.meta`}
                      >
                        {item.meta}
                      </span>
                    )}
                  </div>
                )}

                {/* Tricolor accent divider (theme navLogoFlag, falls back to primary) */}
                <div
                  className="h-[3px] w-full"
                  style={{ background: "var(--nav-logo-flag, var(--primary))" }}
                  aria-hidden="true"
                />

                {/* Content */}
                <div className="flex flex-1 flex-col p-spacing-lg">
                  <h3
                    className="text-2xl lg:text-3xl font-heading text-foreground mb-spacing-md"
                    data-field={`items.${index}.title`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm text-muted leading-relaxed mb-spacing-lg"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>
                  <span
                    className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-radius text-sm font-semibold uppercase tracking-[0.15em] text-primary transition-colors group-hover:text-white"
                    data-field={`items.${index}.linkLabel`}
                  >
                    {item.linkLabel || linkLabel || "See details"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
