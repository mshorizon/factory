"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { EventsDefaultProps } from "./types";

export function EventsDefault({ items, className }: EventsDefaultProps) {
  return (
    <div className={cn("space-y-spacing-lg", className)}>
      {items.map((item, index) => (
        <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={30}>
          <a
            href={item.href || "#"}
            target={item.href?.startsWith("http") ? "_blank" : undefined}
            rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group block bg-surface-alt rounded-radius overflow-hidden transition-shadow hover:shadow-lg"
            data-field={`items.${index}`}
          >
            {/* Event image */}
            {item.image && (
              <div className="aspect-[16/7] overflow-hidden">
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  loading={index < 2 ? "eager" : "lazy"}
                />
              </div>
            )}

            {/* Event details */}
            <div className="p-spacing-lg flex items-start justify-between gap-spacing-lg">
              <div className="flex-1">
                {/* Date badge */}
                {(item.dateStart || item.dateEnd) && (
                  <div className="inline-flex items-center gap-1.5 text-sm text-muted mb-spacing-sm border border-border rounded-full px-3 py-1">
                    {item.dateStart && <span>{item.dateStart}</span>}
                    {item.dateStart && item.dateEnd && <span>-</span>}
                    {item.dateEnd && <span>{item.dateEnd}</span>}
                  </div>
                )}

                <h3
                  className="text-xl font-medium text-foreground mb-spacing-xs"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm text-muted leading-relaxed line-clamp-3"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>
              </div>

              <span className="flex items-center gap-1 text-sm text-muted whitespace-nowrap group-hover:text-foreground transition-colors pt-spacing-sm">
                See details
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </a>
        </ScrollReveal>
      ))}
    </div>
  );
}
