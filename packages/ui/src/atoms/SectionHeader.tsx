import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./Badge";

export interface SectionHeaderProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  layout?: "stacked" | "split" | "most-minimalistic" | "none";
  className?: string;
  background?: string;
  badgeVariant?: "accent" | "outlined" | "text";
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  layout = "stacked",
  className,
  background,
  badgeVariant,
}: SectionHeaderProps) {
  const resolvedBadgeVariant = badgeVariant || "accent";
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  // Determine badge color based on background
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  if (layout === "none" || (!badge && !title && !subtitle)) {
    return null;
  }

  const renderBadge = () => {
    if (!badge) return null;
    if (resolvedBadgeVariant === "text") {
      return (
        <div data-reveal data-reveal-delay="0" className={cn(
          "flex items-center mb-spacing-sm",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest" data-field="header.badge">
            {badge}
          </span>
        </div>
      );
    }
    if (resolvedBadgeVariant === "outlined") {
      return (
        <div data-reveal data-reveal-delay="0" className={cn(
          "flex items-center mb-spacing-lg",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}>
          <span className="inline-flex items-center border border-border/30 rounded-md px-3 py-1.5 text-sm font-medium text-muted" data-field="header.badge">
            {badge}
          </span>
        </div>
      );
    }
    return (
      <div data-reveal data-reveal-delay="0" className={cn(
        "flex items-center gap-spacing-sm mb-spacing-lg",
        align === "center" && "justify-center",
        align === "right" && "justify-end"
      )}>
        <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
      </div>
    );
  };

  if (layout === "most-minimalistic") {
    return (
      <div className={cn("mb-spacing-2xl text-left", className)}>
        {title && (
          <h2
            data-reveal
            data-reveal-delay="0"
            className="text-[2.5rem] leading-tight text-foreground font-heading"
            data-field="header.title"
          >
            {title}
          </h2>
        )}
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className={cn("mb-spacing-3xl", className)}>
        {renderBadge()}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-spacing-md lg:gap-16">
          {title && (
            <h2 data-reveal data-reveal-delay={badge ? "100" : "0"} className="text-3xl md:text-4xl lg:text-5xl text-foreground font-heading flex-shrink-0 max-w-[700px]" data-field="header.title">{title}</h2>
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
      {renderBadge()}
      {title && (
        <h2 data-reveal data-reveal-delay={badge ? "100" : "0"} className={cn("text-3xl md:text-4xl lg:text-5xl text-foreground mb-spacing-md font-heading max-w-[700px]", align === "center" && "mx-auto")} data-field="header.title">{title}</h2>
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
