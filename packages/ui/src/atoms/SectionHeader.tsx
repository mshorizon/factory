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
  badgeVariant?: "accent" | "accent-no-line" | "outlined" | "text";
  titleSize?: string;
  revealDelay?: number;
  /** Render a small country flag accent bar (144x3px, theme navLogoFlag colors) below the title. */
  flag?: boolean;
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
  titleSize,
  revealDelay = 0,
  flag = false,
}: SectionHeaderProps) {
  const resolvedBadgeVariant = badgeVariant || "accent";
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  // Determine badge color based on background
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  const renderTitle = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <span key={i} className="font-heading-secondary italic font-medium text-primary">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  if (layout === "none" || (!badge && !title && !subtitle)) {
    return null;
  }

  // Small country flag accent bar (144x3px) using the theme navLogoFlag gradient.
  const renderFlag = () => {
    if (!flag) return null;
    return (
      <div
        data-reveal
        data-reveal-delay={String(revealDelay + 150)}
        className={cn(
          "mt-spacing-sm flex",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}
      >
        <span
          className="block rounded-full"
          style={{ width: "144px", height: "3px", background: "var(--nav-logo-flag, var(--primary))" }}
          data-field="header.flag"
        />
      </div>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;
    if (resolvedBadgeVariant === "text") {
      return (
        <div data-reveal data-reveal-delay={String(revealDelay)} className={cn(
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
        <div data-reveal data-reveal-delay={String(revealDelay)} className={cn(
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
      <div data-reveal data-reveal-delay={String(revealDelay)} className={cn(
        "flex flex-col gap-spacing-sm mb-spacing-lg",
        align === "center" && "items-center",
        align === "right" && "items-end",
        align === "left" && "items-start"
      )}>
        {resolvedBadgeVariant === "accent" && (
          <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
        )}
        <Badge variant="accent" data-field="header.badge" className="px-0 py-0 text-[14px] tracking-[.05rem] uppercase font-medium" style={{ color: badgeColor }}>
          {badge}
        </Badge>
      </div>
    );
  };

  if (layout === "most-minimalistic") {
    return (
      <div className={cn("mb-spacing-2xl text-left", className)}>
        {title && (
          <h2
            data-reveal
            data-reveal-delay={revealDelay}
            className="text-[2.5rem] leading-tight text-foreground font-heading"
            data-field="header.title"
          >
            {renderTitle(title)}
          </h2>
        )}
        {renderFlag()}
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className={cn("mb-spacing-3xl", className)}>
        {renderBadge()}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-spacing-md lg:gap-16">
          {title && (
            <div className="flex-shrink-0">
              <h2 data-reveal data-reveal-delay={String(badge ? revealDelay + 100 : revealDelay)} className="text-3xl md:text-4xl lg:text-5xl text-foreground font-heading max-w-[700px]" data-field="header.title">{renderTitle(title)}</h2>
              {renderFlag()}
            </div>
          )}
          {subtitle && (
            <p data-reveal data-reveal-delay={String(badge ? revealDelay + 200 : revealDelay + 100)} className="text-muted max-w-lg lg:text-right" data-field="header.subtitle">
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
        <h2 data-reveal data-reveal-delay={String(badge ? revealDelay + 100 : revealDelay)} className={cn(titleSize || "text-3xl md:text-4xl lg:text-5xl", "text-foreground mb-spacing-md font-heading max-w-[700px]", align === "center" && "mx-auto")} data-field="header.title">{renderTitle(title)}</h2>
      )}
      {renderFlag()}
      {subtitle && (
        <p
          data-reveal
          data-reveal-delay={String(badge ? revealDelay + 200 : revealDelay + 100)}
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
