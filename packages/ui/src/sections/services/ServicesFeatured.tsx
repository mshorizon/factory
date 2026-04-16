"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesFeatured({
  items,
  className,
}: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-xl", className)}
      staggerDelay={0.12}
    >
      {items.map((item, index) => {
        const direction = index % 2 === 0 ? "left" : "right";
        return (
          <StaggerItem key={index} direction={direction} distance={40}>
            <Card
              className="group h-full overflow-hidden !rounded-[1.25rem] border-border/50 hover:border-primary/30 transition-all duration-300"
              data-field={`items.${index}`}
            >
              {/* Image/mockup area */}
              {item.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-alt">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-spacing-xl space-y-4">
                {/* Feature tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag: string, tIdx: number) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <h3
                    className="text-xl font-semibold font-heading text-foreground mb-2 group-hover:text-primary transition-colors"
                    data-field={`items.${index}.title`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm text-muted leading-relaxed"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Metric badge */}
                {item.metric && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-full bg-primary/15 text-primary">
                      {item.metric}
                    </span>
                    {item.metricLabel && (
                      <span className="text-xs text-muted">{item.metricLabel}</span>
                    )}
                  </div>
                )}

                {/* Learn more link */}
                {item.href && (
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2"
                    style={{ color: "var(--primary-dark)" }}
                  >
                    <span>{item.linkLabel || "Learn more"}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
