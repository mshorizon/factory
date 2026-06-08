"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
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
          return (
            <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={30}>
              <div
                className="h-full flex flex-col border border-border rounded-radius p-spacing-lg"
                data-field={`items.${index}`}
              >
                {/* Top row: category tag + meta note */}
                <div className="flex items-center justify-between gap-spacing-md mb-spacing-lg">
                  {tag ? (
                    <span
                      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                      style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
                      data-field={`items.${index}.tags`}
                    >
                      {tag}
                    </span>
                  ) : (
                    <span />
                  )}
                  {item.meta && (
                    <span className="text-sm text-muted" data-field={`items.${index}.meta`}>
                      {item.meta}
                    </span>
                  )}
                </div>

                {/* Date */}
                {item.dateStart && (
                  <p
                    className="font-heading text-base text-muted mb-spacing-md"
                    data-field={`items.${index}.dateStart`}
                  >
                    {item.dateStart}
                  </p>
                )}

                {/* Divider */}
                <div className="border-t border-border mb-spacing-lg" />

                {/* Title */}
                <h3
                  className="text-2xl lg:text-3xl font-heading text-foreground mb-spacing-md"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm text-muted leading-relaxed mb-spacing-lg"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>

                {/* CTA */}
                <a
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="group mt-auto inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-primary"
                  data-field={`items.${index}.linkLabel`}
                >
                  {item.linkLabel || linkLabel || "See details"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
