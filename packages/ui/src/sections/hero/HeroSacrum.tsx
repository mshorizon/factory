"use client";

import { ArrowRight, Clock, Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export interface ScheduleCardRow {
  label?: string;
  value?: string;
}

export interface ScheduleCard {
  title?: string;
  icon?: string;
  rows?: ScheduleCardRow[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  heart: Heart,
};

interface HeroSacrumProps extends HeroProps {
  titleAccent?: string;
  scheduleCards?: ScheduleCard[];
  badgeColor?: string;
}

function CardIcon({ name }: { name?: string }) {
  const Component = name ? iconMap[name] : undefined;
  if (!Component) return null;
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: "rgba(179, 139, 63, 0.12)" }}
    >
      <Component className="h-[18px] w-[18px] text-primary" />
    </div>
  );
}

export function HeroSacrum({
  title,
  subtitle,
  badge,
  badgeColor,
  cta,
  image,
  backgroundImage,
  titleAccent,
  scheduleCards = [],
  className,
  isHomePage = false,
}: HeroSacrumProps) {
  const heroImage = image || backgroundImage;
  const resolvedBadgeColor = badgeColor || "var(--primary)";

  return (
    <section
      className={cn(
        "relative z-0 bg-background overflow-hidden",
        isHomePage ? "pt-28 pb-20 md:pt-36 md:pb-28 lg:pb-32" : "py-spacing-section-sm",
        className
      )}
    >
      <div className="container mx-auto">
        <div className="grid gap-spacing-2xl lg:grid-cols-[1fr_1fr] items-start">
          <div className="flex flex-col">
            {badge && (
              <ScrollReveal direction="up" delay={0}>
                <div className="flex items-center gap-spacing-sm mb-spacing-lg">
                  <span
                    className="w-8 h-[2px]"
                    style={{ backgroundColor: resolvedBadgeColor }}
                  />
                  <span
                    className="text-[13px] font-medium uppercase tracking-[0.18em]"
                    style={{ color: resolvedBadgeColor }}
                    data-field="header.badge"
                  >
                    {badge}
                  </span>
                </div>
              </ScrollReveal>
            )}
            <ScrollReveal direction="up" delay={0.05}>
              <h1
                className="font-heading text-foreground tracking-tight text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.05] font-light mb-spacing-lg"
                data-field="header.title"
                style={{ letterSpacing: "-1.5px" }}
              >
                {title}
                {titleAccent && (
                  <>
                    <br />
                    <span className="italic text-primary" data-field="titleAccent">
                      {titleAccent}
                    </span>
                  </>
                )}
              </h1>
            </ScrollReveal>

            {subtitle && (
              <ScrollReveal direction="up" delay={0.15}>
                <p
                  className="text-base text-muted leading-relaxed max-w-md mb-spacing-2xl"
                  data-field="header.subtitle"
                >
                  {subtitle}
                </p>
              </ScrollReveal>
            )}

            {scheduleCards.length > 0 && (
              <div className="flex flex-col gap-spacing-md max-w-md w-full">
                {scheduleCards.map((card, ci) => (
                  <ScrollReveal key={ci} direction="up" delay={0.2 + ci * 0.08}>
                    <div
                      className="border p-spacing-lg rounded-radius shadow-sm"
                      style={{ backgroundColor: "#FFFFFF", borderColor: "#b38b3f33" }}
                      data-field={`scheduleCards.${ci}`}
                    >
                      <div className="flex items-center gap-spacing-md mb-spacing-md">
                        <CardIcon name={card.icon} />
                        <h3
                          className="font-heading text-foreground text-[22px] font-medium"
                          data-field={`scheduleCards.${ci}.title`}
                        >
                          {card.title}
                        </h3>
                      </div>
                      <ul className="flex flex-col">
                        {(card.rows || []).map((row, ri) => (
                          <li
                            key={ri}
                            className="flex items-baseline justify-between gap-spacing-md pb-1.5 mt-1.5 first:mt-0 border-b"
                            style={{ borderColor: "#b38b3f33" }}
                          >
                            <span className="text-sm text-muted">{row.label}</span>
                            <span
                              className="text-sm font-medium text-foreground tabular-nums"
                              style={{ color: "var(--primary-dark, var(--primary))" }}
                            >
                              {row.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}

            {cta && (
              <ScrollReveal direction="up" delay={0.3}>
                <div className="mt-spacing-xl">
                  <Button
                    asChild
                    size="lg"
                    className="!rounded-[4px] h-11 px-spacing-xl text-sm font-medium tracking-wide uppercase"
                  >
                    <a href={cta.href}>
                      {cta.label}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </ScrollReveal>
            )}
          </div>

          {heroImage && (
            <ScrollReveal direction="right" delay={0.15} distance={40}>
              <div
                className="relative w-full overflow-hidden rounded-radius shadow-xl"
                style={{ aspectRatio: "1 / 1" }}
                data-field="image"
              >
                <SafeImage
                  src={heroImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
