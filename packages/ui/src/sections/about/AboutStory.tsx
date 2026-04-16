"use client";

import { cn } from "../../lib/utils";
import { ArrowRight } from "lucide-react";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { Card, CardContent } from "../../atoms/Card";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutStoryProps } from "./types";

export function AboutStory({
  badge,
  title,
  story,
  stats,
  commitment,
  image,
  cta,
  ctaHref = "/contact",
  whyChooseUs,
  experienceBadge,
  experienceBadgeLabel,
  className,
  background,
  imagePosition = "left",
}: AboutStoryProps) {
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";
  const imageRight = imagePosition === "right";

  const imageBlock = image ? (
    <ScrollReveal delay={0} direction={imageRight ? "right" : "left"} distance={30}>
      <div className="relative flex items-center justify-center lg:justify-start py-spacing-2xl">
        <SafeImage
          src={image}
          alt=""
          className="w-[364px] max-w-full h-[400px] object-cover rounded-radius-secondary shadow-lg"
          data-field="image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </ScrollReveal>
  ) : null;

  const textBlock = (
    <ScrollReveal delay={0.1} direction={imageRight ? "left" : "right"} distance={30}>
      <div className="space-y-spacing-lg py-spacing-3xl flex flex-col justify-center">
        {badge && (
          <div className="flex items-center gap-spacing-sm">
            <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
            <Badge variant="accent" style={{ color: badgeColor }} data-field="header.badge">{badge}</Badge>
          </div>
        )}
        {title && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading leading-tight" data-field="header.title">{title}</h2>
        )}
        {story && story.content && (
          <div className="space-y-spacing-md">
            {story.content.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="text-muted leading-relaxed" data-field={`story.content.${index}`}>{paragraph}</p>
            ))}
          </div>
        )}

        {cta && (
          <div className="pt-4">
            <a
              href={ctaHref}
              onClick={() => (window as any).umami?.track('cta-click', { section: 'about', label: cta })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-on-accent font-medium rounded-full hover:opacity-90 transition-opacity w-fit"
            >
              {cta}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        )}
      </div>
    </ScrollReveal>
  );

  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      {/* Split layout */}
      <div className={cn(
        "grid gap-spacing-section-sm items-stretch",
        image ? (imageRight ? "lg:grid-cols-[1fr_auto]" : "lg:grid-cols-[auto_1fr]") : "grid-cols-1"
      )}>
        {imageRight ? (
          <>
            {textBlock}
            {imageBlock}
          </>
        ) : (
          <>
            {imageBlock}
            {textBlock}
          </>
        )}
      </div>

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <ScrollReveal delay={0.2} direction="up">
          <StaggerContainer className="flex flex-row flex-wrap justify-center gap-spacing-2xl md:gap-spacing-3xl py-spacing-2xl" staggerDelay={0.1}>
            {stats.map((stat, index) => (
              <StaggerItem key={index} direction="up" distance={20}>
                <div className="text-center" data-field={`stats.${index}`}>
                  <div className="text-5xl md:text-6xl font-bold text-foreground mb-spacing-xs font-heading" data-field={`stats.${index}.value`}>{stat.value}</div>
                  <p className="text-sm text-muted" data-field={`stats.${index}.label`}>{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      )}

      {commitment && (
        <ScrollReveal delay={0.3} direction="up">
          <section>
            <h2 className="text-2xl font-bold font-heading text-foreground mb-spacing-md" data-field="commitment.title">{commitment.title}</h2>
            <p className="text-muted leading-relaxed mb-spacing-lg" data-field="commitment.content">{commitment.content}</p>
            {!cta && commitment && (
              <a
                href={ctaHref}
                onClick={() => (window as any).umami?.track('cta-click', { section: 'about', label: cta })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-on-accent font-medium rounded-full hover:opacity-90 transition-opacity w-fit"
              >
                {cta}
                <ArrowRight className="h-5 w-5" />
              </a>
            )}
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
