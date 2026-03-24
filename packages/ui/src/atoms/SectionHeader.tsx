import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./Badge";

export interface SectionHeaderProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  layout?: "stacked" | "split";
  className?: string;
  background?: string;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  layout = "stacked",
  className,
  background,
}: SectionHeaderProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  // Determine badge color based on background
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  if (!badge && !title && !subtitle) {
    return null;
  }

  if (layout === "split") {
    return (
      <div className={cn("mb-spacing-3xl", className)}>
        {badge && (
          <div data-reveal data-reveal-delay="0" className={cn(
            "flex items-center gap-spacing-sm mb-spacing-lg",
            align === "center" && "justify-center",
            align === "right" && "justify-end"
          )}>
            <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
            <Badge variant="accent" data-field="header.badge" style={{ color: badgeColor }}>
              {badge}
            </Badge>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-spacing-md lg:gap-16">
          {title && (
            <h2 data-reveal data-reveal-delay={badge ? "100" : "0"} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading flex-shrink-0" data-field="header.title">{title}</h2>
          )}
          {subtitle && (
            <p data-reveal data-reveal-delay={badge ? "200" : "100"} className="text-muted max-w-lg lg:text-right" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mb-spacing-3xl", alignClass, className)}>
      {badge && (
        <div data-reveal data-reveal-delay="0" className={cn(
          "flex items-center gap-spacing-sm mb-spacing-lg",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}>
          <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
          <Badge variant="accent" data-field="header.badge" style={{ color: badgeColor }}>
            {badge}
          </Badge>
        </div>
      )}
      {title && (
        <h2 data-reveal data-reveal-delay={badge ? "100" : "0"} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-spacing-md font-heading" data-field="header.title">{title}</h2>
      )}
      {subtitle && (
        <p
          data-reveal
          data-reveal-delay={badge ? "200" : "100"}
          className={cn(
            "text-muted max-w-2xl",
            align === "center" && "mx-auto"
          )}
          data-field="header.subtitle"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
