"use client";

import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import type { HeroProps } from "./types";

// Hero content lives above the fold and must be visible on the very first
// paint — using ScrollReveal here would hide it behind framer-motion's
// initial opacity:0 until React hydrates, producing a visible "pop in"
// once the JS bundle finishes loading. The .hero-fade-up class (defined in
// global.css) uses plain CSS keyframes that run as soon as CSS parses and
// survive React's hydration pass unchanged.
const heroFadeDelay = (s: number): CSSProperties =>
  ({ ["--hero-fade-delay" as string]: `${s}s` } as CSSProperties);

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
  isHomePage = false,
}: HeroProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <section
      className={cn(
        "relative z-0 bg-background overflow-hidden",
        fullHeight && "min-h-screen w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]",
        className
      )}
      style={
        fullHeight
          ? { marginTop: "calc(var(--main-nav-offset, 64px) * -1)" }
          : undefined
      }
    >
      {backgroundImage && (
        <>
          <div
            className="hero-bg-zoom absolute inset-0 will-change-transform"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            data-field="backgroundImage"
          />
          {overlay && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  "color-mix(in oklab, hsl(24 15% 10%) 60%, transparent)",
              }}
            />
          )}
        </>
      )}
      <div
        className={cn(
          "relative container mx-auto flex flex-col justify-center",
          fullHeight && "min-h-screen",
          alignmentClasses[align]
        )}
      >
        {badge && (
          <div className="hero-fade-up" style={heroFadeDelay(0)}>
            <Badge variant="accent" className="mb-spacing-md text-sm px-spacing-md py-1" data-field="header.badge">
              {badge}
            </Badge>
          </div>
        )}
        <div className="hero-fade-up" style={heroFadeDelay(0.1)}>
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-spacing-md tracking-tight",
              backgroundImage ? "text-on-primary" : "text-foreground"
            )}
            data-field="header.title"
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <div className="hero-fade-up" style={heroFadeDelay(0.2)}>
            <p
              className={cn(
                "text-lg md:text-xl max-w-2xl mb-spacing-2xl",
                backgroundImage ? "text-on-primary/90" : "text-muted",
                align === "center" && "mx-auto"
              )}
              data-field="header.subtitle"
            >
              {subtitle}
            </p>
          </div>
        )}
        {(cta || secondaryCta) && (
          <div className="hero-fade-up" style={heroFadeDelay(0.3)}>
            <div
              className={cn(
                "flex flex-wrap gap-spacing-md",
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
                  <a href={cta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero', label: cta.label })}>
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
                  <a href={secondaryCta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero-secondary', label: secondaryCta.label })}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
