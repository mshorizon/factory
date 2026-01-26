import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./Badge";

export interface SectionHeaderProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
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

  return (
    <div className={cn("mb-12", alignClass, className)}>
      {badge && (
        <Badge variant="accent" className="mb-4">
          {badge}
        </Badge>
      )}
      {title && (
        <h2 className="text-4xl font-bold text-foreground mb-4">{title}</h2>
      )}
      {subtitle && (
        <p
          className={cn(
            "text-muted max-w-2xl",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
