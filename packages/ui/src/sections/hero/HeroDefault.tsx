"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroDefault({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  backgroundImage,
  overlay = true,
  align = "center",
  fullHeight = false,
  children,
  className,
}: HeroProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <section
      className={cn(
        "relative z-0 bg-background",
        fullHeight ? "min-h-screen" : "pt-[184px] md:pt-[216px] pb-[120px]",
        className
      )}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {backgroundImage && overlay && (
        <div className="absolute inset-0 bg-black/50" data-field="backgroundImage" />
      )}
      <div
        className={cn(
          "relative container mx-auto flex flex-col justify-center",
          alignmentClasses[align],
          fullHeight && "min-h-screen pt-[184px] md:pt-[216px] pb-[120px]"
        )}
      >
        {badge && (
          <ScrollReveal delay={0} direction="up">
            <Badge variant="accent" className="mb-4 text-sm px-4 py-1" data-field="header.badge">
              {badge}
            </Badge>
          </ScrollReveal>
        )}
        <ScrollReveal delay={0.1} direction="up">
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight",
              backgroundImage ? "text-on-primary" : "text-foreground"
            )}
            data-field="header.title"
          >
            {title}
          </h1>
        </ScrollReveal>
        {subtitle && (
          <ScrollReveal delay={0.2} direction="up">
            <p
              className={cn(
                "text-lg md:text-xl max-w-2xl mb-8",
                backgroundImage ? "text-on-primary/90" : "text-muted",
                align === "center" && "mx-auto"
              )}
              data-field="header.subtitle"
            >
              {subtitle}
            </p>
          </ScrollReveal>
        )}
        {(cta || secondaryCta) && (
          <ScrollReveal delay={0.3} direction="up">
            <div
              className={cn(
                "flex flex-wrap gap-4",
                align === "center"
                  ? "justify-center"
                  : align === "right"
                  ? "justify-end"
                  : "justify-start"
              )}
            >
              {cta && (
                <Button
                  asChild
                  size="xl"
                  variant={cta.variant || "default"}
                  className="shadow-lg shadow-primary/25"
                  data-field="cta"
                >
                  <a href={cta.href}>
                    {cta.label}
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </a>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  size="xl"
                  variant={secondaryCta.variant || "outline"}
                  className={backgroundImage ? "border-on-primary text-on-primary hover:bg-on-primary hover:text-foreground" : ""}
                  data-field="secondaryCta"
                >
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </ScrollReveal>
        )}
        {children}
      </div>
    </section>
  );
}
