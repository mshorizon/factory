"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ServicesProps } from "./types";

export function ServicesAlternating({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <div className={cn("flex flex-col gap-spacing-3xl", className)}>
      {items.map((item, index) => {
        const isEven = index % 2 === 1;

        return (
          <div
            key={index}
            className="grid md:grid-cols-2 gap-spacing-xl items-center"
            data-field={`items.${index}`}
          >
            {/* Image side */}
            <ScrollReveal
              delay={0}
              direction="up"
              className={cn(isEven && "md:order-2")}
            >
              <div className="overflow-hidden rounded-[1.25rem] border border-border/50">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-auto object-cover aspect-[4/3]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-muted/20" />
                )}
              </div>
            </ScrollReveal>

            {/* Text side */}
            <ScrollReveal
              delay={0.15}
              direction="up"
              className={cn(isEven && "md:order-1")}
            >
              <div className="flex flex-col gap-spacing-md">
                {item.metric && (
                  <span
                    className="inline-flex items-center self-start border border-border/50 rounded-full px-3 py-1 text-xs text-muted"
                    data-field={`items.${index}.metric`}
                  >
                    {item.metric}
                    {item.metricLabel && ` ${item.metricLabel}`}
                  </span>
                )}

                <a href={`/services/${item.slug || item.id}`} className="group">
                  <h3
                    className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors"
                    data-field={`items.${index}.title`}
                  >
                    {item.title}
                  </h3>
                </a>

                <p
                  className="text-base text-muted leading-relaxed"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-spacing-sm">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex px-3 py-1 text-xs border border-border/50 rounded-full text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        );
      })}
    </div>
  );
}
