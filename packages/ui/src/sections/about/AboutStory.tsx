"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { ArrowRight } from "lucide-react";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ImageDescription } from "../../atoms/ImageDescription";
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
  statsPlacement = "below",
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
  ctaShape = "pill",
  quote,
  imageFill = false,
  imageFrame = false,
  imageBorder = false,
  imageDescription,
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
  // so the size can stay responsive: the photo fills the full section width on
  // mobile (matching the sibling image-split section), and the custom size only
  // kicks in from `md` up. Inline width/height would override every breakpoint
  // and blow the photo up on phones.
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
    : ctaVariant === "primary"
    ? "bg-primary hover:bg-primary/90 text-on-primary"
    : "bg-accent text-on-primary hover:opacity-90";

  const imageBlock = image ? (
    imageFill ? (
      <div className={cn("relative min-h-[450px] lg:min-h-0 h-full", imageFrame && "border border-primary p-spacing-sm")}>
        <div className="relative w-full h-full">
          <SafeImage
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            data-field="image"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    ) : (
      <ScrollReveal delay={0} direction={imageRight ? "right" : "left"} distance={30}>
        <div className="relative flex items-center justify-center lg:justify-start">
          {/* The wrapper hugs the image exactly so the overlay caption can anchor to
              the photo's bottom-left corner. */}
          <div className="relative inline-block leading-[0] w-full md:w-auto">
            <SafeImage
              src={image}
              alt=""
              className={cn(
                "max-w-full object-cover",
                !imageBlend && !imageBorder && "shadow-lg",
                hasCustomSize
                  ? cn(
                      "w-full h-auto",
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
            {/* Inner border — a translucent line overlaid on the image so its color
                blends with the photo beneath (matches the services section). */}
            {imageBorder && (
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 border border-white/20",
                  imageRounded && imageBlend !== "feather" && "rounded-[var(--radius-lg)]"
                )}
              />
            )}
            {imageDescription && (imageDescription.name || imageDescription.description) && (
              <ImageDescription
                {...imageDescription}
                className="absolute bottom-0 left-0"
              />
            )}
          </div>
        </div>
      </ScrollReveal>
    )
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
              <Badge variant={badgeVariant === "text" ? "text" : "accent"} className="px-0 py-0 text-[14px] tracking-[.05rem] uppercase font-medium" style={{ color: badgeColor }} data-field="header.badge">{badge}</Badge>
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
        {statsPlacement === "text" && stats && stats.length > 0 && (
          <StaggerContainer className="flex flex-row flex-wrap gap-spacing-xl md:gap-spacing-2xl" staggerDelay={0.1}>
            {stats.map((stat, index) => (
              <StaggerItem key={index} direction="up" distance={20}>
                <div className="text-left" data-field={`stats.${index}`}>
                  <div className="text-4xl md:text-5xl font-bold text-foreground mb-spacing-xs font-heading" data-field={`stats.${index}.value`}>{stat.value}</div>
                  <p className="text-sm text-muted" data-field={`stats.${index}.label`}>{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
        {quote && quote.text && (
          <figure className="border-l-2 border-primary pl-spacing-md" data-field="quote">
            <blockquote className="text-lg md:text-xl italic font-heading text-foreground leading-snug" data-field="quote.text">{quote.text}</blockquote>
            {quote.author && (
              <figcaption className="mt-spacing-xs text-sm text-muted" data-field="quote.author">{quote.author}</figcaption>
            )}
          </figure>
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
                "inline-flex items-center gap-2 px-6 py-3 font-medium transition-opacity w-fit",
                ctaShape === "rect" ? "rounded-radius uppercase [letter-spacing:var(--btn-letter-spacing,0.05em)]" : "rounded-full",
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
        "grid items-stretch",
        imageFill
          ? cn(imageRight ? "lg:grid-cols-[1fr_45%]" : "lg:grid-cols-[45%_1fr]", "gap-spacing-xl")
          : cn("gap-spacing-section-sm", image ? (imageRight ? "lg:grid-cols-[1fr_auto]" : "lg:grid-cols-[auto_1fr]") : "grid-cols-1")
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
      {statsPlacement === "below" && stats && stats.length > 0 && (
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
