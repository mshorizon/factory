"use client";

import { cn } from "../../lib/utils";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ArrowRight, GraduationCap } from "lucide-react";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutSummaryProps } from "./types";

export function AboutSummary({
  badge,
  title,
  description,
  image,
  experienceYears,
  experienceLabel,
  cta,
  ctaHref = "/about",
  stats,
  className,
  background,
  hideDots,
  badgeVariant = "accent",
  badgeColor,
  descriptionColor,
  ctaColor,
  statsInverted,
}: AboutSummaryProps) {
  const defaultBadgeColor = background === "dark" || background === "dark-padded" ? "var(--primary)" : "var(--primary-dark)";
  const resolvedBadgeColor = badgeColor || defaultBadgeColor;

  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      {/* Split layout: image left, content right */}
      <div className="grid lg:grid-cols-2 gap-spacing-2xl items-center">
        {/* Left: Image with experience badge */}
        {image && (
          <ScrollReveal delay={0} direction="left" distance={30}>
            <div className="relative w-full max-w-[448px] h-[448px] mx-auto lg:mx-0">
              {/* Dots BEHIND image - mirrored from hero section */}
              {!hideDots && (
                <>
                  <div
                    className="absolute bottom-[26px] -left-[46px] w-[36px] h-[216px] opacity-15 pointer-events-none text-foreground"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                      backgroundSize: "18px 18px",
                      zIndex: 0,
                    }}
                  />
                  <div
                    className="absolute top-[26px] -right-[46px] w-[36px] h-[144px] opacity-15 pointer-events-none text-foreground"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                      backgroundSize: "18px 18px",
                      zIndex: 0,
                    }}
                  />
                </>
              )}

              {/* Image */}
              <SafeImage
                src={image}
                alt=""
                className="relative w-full h-full object-cover rounded-[20px] shadow-lg"
                style={{ zIndex: 1 }}
                data-field="image"
                loading="lazy"
                decoding="async"
              />

              {/* Yellow badge overlay - positioned to extend beyond image */}
              {experienceYears && (
                <div
                  className="absolute -bottom-6 -right-6 bg-primary text-[var(--text-on-primary)] p-spacing-xl rounded-radius-secondary shadow-xl"
                  style={{ width: '234px', zIndex: 2 }}
                  data-field="experienceYears"
                >
                  <div className="flex flex-col items-center text-center">
                    <GraduationCap className="h-8 w-8 mb-2" />
                    <div className="text-4xl font-bold font-heading">{experienceYears}</div>
                    {experienceLabel && (
                      <div className="text-sm font-semibold mt-1 opacity-90" data-field="experienceLabel">
                        {experienceLabel}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Right: Content */}
        <ScrollReveal delay={0.1} direction="right" distance={30}>
          <div className="space-y-spacing-lg">
            {badge && (
              <div className={cn(
                "flex items-center",
                badgeVariant !== "text" && "gap-spacing-sm"
              )}>
                {badgeVariant !== "text" && (
                  <span className="w-12 h-[2px]" style={{ backgroundColor: resolvedBadgeColor }} />
                )}
                <Badge
                  variant={badgeVariant === "text" ? "text" : "accent"}
                  style={{ color: resolvedBadgeColor }}
                  data-field="header.badge"
                >
                  {badge}
                </Badge>
              </div>
            )}
            {title && (
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading leading-tight"
                data-field="header.title"
              >
                {title}
              </h2>
            )}
            {description && (
              <div className="space-y-spacing-md">
                {description.split('\n\n').map((paragraph: string, index: number) => (
                  <p
                    key={index}
                    className="leading-relaxed"
                    style={descriptionColor ? { color: descriptionColor } : undefined}
                    data-field={`description.${index}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {cta && ctaHref && (
              <div className="pt-4">
                <a
                  href={ctaHref}
                  className="inline-flex items-center gap-2 font-semibold hover:gap-3 transition-all"
                  style={ctaColor ? { color: ctaColor } : undefined}
                  data-field="cta.label"
                >
                  {cta}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <ScrollReveal delay={0.2} direction="up">
          <StaggerContainer
            className="flex flex-row flex-nowrap justify-center gap-spacing-lg md:gap-spacing-xl pt-spacing-2xl"
            staggerDelay={0.1}
          >
            {stats.map((stat, index) => (
              <StaggerItem key={index} direction="up" distance={20}>
                <div
                  className={cn(
                    "text-center flex-1 min-w-0",
                    statsInverted && "bg-background rounded-radius-secondary p-spacing-lg"
                  )}
                  style={statsInverted ? {
                    backgroundColor: "var(--light-background, #EDF0F5)",
                    color: "var(--light-foreground, #131820)",
                  } : undefined}
                  data-field={`stats.${index}`}
                >
                  <div
                    className="text-[40px] md:text-[64px] font-medium font-heading leading-none"
                    style={statsInverted ? { color: "var(--light-foreground, #131820)" } : undefined}
                    data-field={`stats.${index}.value`}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={cn("text-sm md:text-xl mt-spacing-sm md:mt-spacing-xl")}
                    style={statsInverted ? { color: "var(--light-muted, #6b7280)" } : undefined}
                    data-field={`stats.${index}.label`}
                  >
                    {stat.label}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      )}
    </div>
  );
}
