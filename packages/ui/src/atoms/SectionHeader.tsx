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
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  layout = "stacked",
  className,
}: SectionHeaderProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  if (!badge && !title && !subtitle) {
    return null;
  }

  if (layout === "split") {
    return (
      <div className={cn("mb-12", className)}>
        {badge && (
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-0.5" style={{ backgroundColor: "#CA9102" }} />
            <Badge variant="accent" className="mb-4" data-field="header.badge" style={{ color: "#CA9102" }}>
              {badge}
            </Badge>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-16">
          {title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading flex-shrink-0" data-field="header.title">{title}</h2>
          )}
          {subtitle && (
            <p className="text-muted max-w-lg lg:text-right" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mb-12", alignClass, className)}>
      {badge && (
        <Badge variant="accent" className="mb-4" data-field="header.badge" style={{ color: "#CA9102" }}>
          {badge}
        </Badge>
      )}
      {title && (
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-heading" data-field="header.title">{title}</h2>
      )}
      {subtitle && (
        <p
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
