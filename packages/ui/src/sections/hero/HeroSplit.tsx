import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import type { HeroProps } from "./types";

export function HeroSplit({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  image,
  backgroundImage,
  children,
  className,
}: HeroProps) {
  const heroImage = image || backgroundImage;

  return (
    <section
      className={cn(
        "relative bg-background min-h-[80vh] flex items-center",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Side */}
          <div className="flex flex-col justify-center py-12 lg:py-24">
            {badge && (
              <Badge variant="accent" className="mb-4 text-sm px-4 py-1 w-fit">
                {badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-muted mb-8 max-w-lg">
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

          {/* Image Side */}
          {heroImage && (
            <div className="relative lg:h-[600px] h-[400px] rounded-radius overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
