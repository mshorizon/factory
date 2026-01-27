import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import type { HeroProps } from "./types";

export function HeroGradient({
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
        "relative z-0 min-h-screen bg-background overflow-hidden flex items-center justify-center",
        className
      )}
    >
      {/* Background image (if provided) */}
      {backgroundImage && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Animated gradient blur circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-primary/25 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative container mx-auto px-4 py-16 text-center">
        {badge && (
          <Badge
            variant="accent"
            className="mb-6 text-sm px-4 py-2 backdrop-blur-sm bg-primary/10 border border-primary/20"
          >
            {badge}
          </Badge>
        )}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-foreground max-w-4xl mx-auto">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
          <div className="flex flex-wrap gap-4 justify-center">
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
