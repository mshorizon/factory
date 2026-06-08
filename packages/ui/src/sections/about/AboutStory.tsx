"use client";

import { useState } from "react";
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
  signature,
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
  badgeVariant = "accent",
  imagePosition = "left",
  ctaVariant = "accent",
  imageRounded = true,
  contentFontFamily,
  contentFontSize,
  imageWidth,
  imageHeight,
  imageBlend,
  readMoreLabel = "Read more",
}: AboutStoryProps) {
  // On mobile the story is collapsed to its first paragraph; the rest is revealed
  // on tap. On md+ everything is always visible regardless of this state.
  const [expanded, setExpanded] = useState(false);
  const paragraphs = story?.content ? story.content.split('\n\n') : [];
  const hasMore = paragraphs.length > 1;
  const contentStyle = (contentFontFamily || contentFontSize)
    ? { fontFamily: contentFontFamily, fontSize: contentFontSize }
    : undefined;
  // Feathering the edges integrates the photo into the page; a softer ambient shadow
  // grounds it. Both blend modes drop the punchy `shadow-lg` floating-card look.
  // A radial vignette only softens the corners, so the photo keeps hard rectangular
  // edges and still reads as a floating card. Feather every side instead by crossing
  // two linear-gradient mask layers (intersected) — all four edges dissolve into the
  // page so the image melts into the background rather than sitting on top of it.
  const edgeFeather =
    "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%), " +
    "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)";
  const featherStyle = imageBlend === "feather"
    ? {
        WebkitMaskImage: edgeFeather,
        WebkitMaskComposite: "source-in",
        maskImage: edgeFeather,
        maskComposite: "intersect",
      }
    : undefined;
  const softShadowStyle = imageBlend === "soft"
    ? { boxShadow: "0 30px 60px -25px rgba(0, 0, 0, 0.45)" }
    : undefined;
  // Custom dimensions are exposed as CSS variables (instead of inline width/height)
  // so the size can stay responsive: a much smaller image on mobile, the full
  // custom size only from `lg` up. Inline width/height would override every
  // breakpoint and blow the photo up on phones.
  const hasCustomSize = Boolean(imageWidth || imageHeight);
  const imageSizeStyle = (hasCustomSize || featherStyle || softShadowStyle)
    ? {
        ...(imageWidth ? { ["--about-img-w" as any]: imageWidth } : {}),
        ...(imageHeight ? { ["--about-img-h" as any]: imageHeight } : {}),
        ...featherStyle,
        ...softShadowStyle,
      }
    : undefined;
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";
  const imageRight = imagePosition === "right";
  const ctaClass = ctaVariant === "primaryLight"
    ? "bg-primary-light hover:bg-primary-light/90 text-on-primary"
    : "bg-accent text-on-primary hover:opacity-90";

  const imageBlock = image ? (
    <ScrollReveal delay={0} direction={imageRight ? "right" : "left"} distance={30}>
      <div className="relative flex items-center justify-center lg:justify-start">
        <SafeImage
          src={image}
          alt=""
          className={cn(
            "max-w-full object-cover",
            !imageBlend && "shadow-lg",
            hasCustomSize
              ? cn(
                  // Mobile only: a lot smaller, natural aspect ratio.
                  "w-[220px] h-auto",
                  // From md up (tablet + desktop): honor the configured custom dimensions.
                  imageWidth && "md:w-[var(--about-img-w)]",
                  imageHeight && "md:h-[var(--about-img-h)]"
                )
              : "w-[448px] h-[500px]",
            imageRounded && imageBlend !== "feather" && "rounded-[var(--radius-lg)]"
          )}
          style={imageSizeStyle}
          data-field="image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </ScrollReveal>
  ) : null;

  const textBlock = (
    <ScrollReveal delay={0.1} direction={imageRight ? "left" : "right"} distance={30}>
      <div className="space-y-spacing-lg flex flex-col justify-center">
        {(badge || title) && (
          <div className="flex flex-col items-start gap-spacing-sm">
            {badgeVariant === "accent" && (
              <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
            )}
            {badge && (
              <Badge variant={badgeVariant === "text" ? "text" : "accent"} style={{ color: badgeColor }} data-field="header.badge">{badge}</Badge>
            )}
          </div>
        )}
        {title && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading leading-tight" data-field="header.title">{title}</h2>
        )}
        {paragraphs.length > 0 && (
          <div className="space-y-spacing-md">
            {paragraphs.map((paragraph: string, index: number) => (
              <p
                key={index}
                className={cn(
                  "text-muted leading-relaxed",
                  // Mobile: keep only the first paragraph until expanded; md+ shows all.
                  index > 0 && !expanded && "hidden md:block"
                )}
                style={contentStyle}
                data-field={`story.content.${index}`}
              >{paragraph}</p>
            ))}
            {hasMore && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="md:hidden inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4"
              >
                {readMoreLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {signature && signature.text && (
          <div className="mt-spacing-xl flex items-center gap-spacing-sm" data-field="signature">
            {signature.flag ? (
              <SafeImage
                src={signature.flag}
                alt=""
                className="shrink-0 rounded-[2px] object-cover shadow-sm"
                style={{ width: "26px", height: "24px" }}
                data-field="signature.flag"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span
                className="shrink-0 rounded-[2px] shadow-sm"
                style={{ width: "26px", height: "24px", background: "var(--nav-logo-flag)" }}
                aria-hidden="true"
                data-field="signature.flag"
              />
            )}
            <span className="text-sm font-medium uppercase tracking-wide text-muted" data-field="signature.text">{signature.text}</span>
          </div>
        )}

        {cta && (
          <div className="pt-4">
            <a
              href={ctaHref}
              onClick={() => (window as any).umami?.track('cta-click', { section: 'about', label: cta })}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 font-medium rounded-full transition-opacity w-fit",
                ctaClass
              )}
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-on-primary font-medium rounded-full hover:opacity-90 transition-opacity w-fit"
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
