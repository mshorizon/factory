import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import type { HeroProps } from "./types";

export function HeroVideo({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  backgroundImage,
  children,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative z-0 min-h-screen flex items-end",
        className
      )}
    >
      {/* Full-bleed background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content pinned to bottom */}
      <div className="relative container mx-auto px-4 pb-16 pt-48 md:pb-24 md:pt-64">
        {badge && (
          <Badge
            variant="accent"
            className="mb-4 text-sm px-4 py-2 backdrop-blur-sm bg-background/30 border border-foreground/10"
          >
            {badge}
          </Badge>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-foreground max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl">
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
          <div className="flex flex-wrap gap-4">
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
