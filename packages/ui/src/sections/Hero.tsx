import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";
import { Badge } from "../atoms/Badge";

interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

interface HeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  cta?: CTAButton;
  secondaryCta?: CTAButton;
  backgroundImage?: string;
  overlay?: boolean;
  align?: "left" | "center" | "right";
  fullHeight?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Hero({
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
        "relative bg-background",
        fullHeight ? "min-h-screen" : "py-16 md:py-24",
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
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div
        className={cn(
          "relative container mx-auto px-4 flex flex-col justify-center",
          alignmentClasses[align],
          fullHeight && "min-h-screen py-16"
        )}
      >
        {badge && (
          <Badge variant="accent" className="mb-4 text-sm px-4 py-1">
            {badge}
          </Badge>
        )}
        <h1
          className={cn(
            "text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight",
            backgroundImage ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "text-lg md:text-xl max-w-2xl mb-8",
              backgroundImage ? "text-white/90" : "text-muted",
              align === "center" && "mx-auto"
            )}
          >
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
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
                className={backgroundImage ? "border-white text-white hover:bg-white hover:text-foreground" : ""}
              >
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
