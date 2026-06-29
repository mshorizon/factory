"use client";

import { cn } from "../../lib/utils";
import { ArrowRight } from "lucide-react";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutQuoteSplitProps } from "./types";

export function AboutQuoteSplit({
  badge,
  title,
  story,
  stats,
  quote,
  cta,
  ctaHref = "/contact",
  className,
  background,
  cardBackgroundColor,
  badgeVariant = "accent",
  image,
  contentAlign = "right",
}: AboutQuoteSplitProps) {
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  // Image-overlay layout: a single full-bleed photo with every piece of copy laid
  // on top of it. A dark gradient rising from the bottom keeps the text legible no
  // matter the photo. The content block hugs one side (right by default) and is
  // anchored to the bottom, where the gradient is darkest.
  if (image) {
    const alignRight = contentAlign !== "left";
    return (
      <ScrollReveal delay={0.1} direction="up" distance={30}>
        <div
          className={cn(
            "relative overflow-hidden rounded-radius min-h-[560px] lg:min-h-[680px] flex",
            className
          )}
          data-field="image"
        >
          <SafeImage
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Dark gradient from the bottom for legibility. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
            aria-hidden="true"
          />

          <div
            className={cn(
              "relative z-10 w-full flex flex-col justify-end p-spacing-2xl lg:p-spacing-3xl",
              alignRight ? "items-end text-right" : "items-start text-left"
            )}
          >
            <div className="w-full max-w-xl space-y-spacing-lg text-white">
              {(badge || title) && (
                <div className={cn("flex items-center gap-spacing-sm", alignRight && "justify-end")}>
                  {badgeVariant !== "accent-no-line" && (
                    <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
                  )}
                  {badge && (
                    <Badge variant="accent" style={{ color: badgeColor }} data-field="header.badge">{badge}</Badge>
                  )}
                </div>
              )}

              {title && (
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-heading leading-tight" data-field="header.title">{title}</h2>
              )}

              {story && story.content && (
                <div className="space-y-spacing-md">
                  {story.content.split("\n\n").map((paragraph: string, index: number) => (
                    <p key={index} className="text-white/80 leading-relaxed" data-field={`story.content.${index}`}>{paragraph}</p>
                  ))}
                </div>
              )}

              {quote && quote.text && (
                <blockquote
                  className="text-xl md:text-2xl font-heading italic leading-snug text-white"
                  data-field="quote.text"
                >
                  {`“${quote.text}”`}
                </blockquote>
              )}
              {quote && quote.author && (
                <p className="text-sm font-medium uppercase tracking-wide text-white/70" data-field="quote.author">{quote.author}</p>
              )}
              {quote && quote.note && (
                <p className="text-white/80 leading-relaxed" data-field="quote.note">{quote.note}</p>
              )}

              {stats && stats.length > 0 && (
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-md pt-spacing-sm" staggerDelay={0.1}>
                  {stats.map((stat, index) => (
                    <StaggerItem key={index} direction="up" distance={20}>
                      <div
                        className="border border-white/25 rounded-radius px-spacing-md py-spacing-lg text-center h-full flex flex-col items-center justify-center gap-spacing-xs"
                        data-field={`stats.${index}`}
                      >
                        <span className="text-xl font-bold text-white font-heading" data-field={`stats.${index}.value`}>{stat.value}</span>
                        <span className="text-xs uppercase tracking-wide text-white/70" data-field={`stats.${index}.label`}>{stat.label}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}

              {cta && (
                <a
                  href={ctaHref}
                  onClick={() => (window as any).umami?.track("cta-click", { section: "about", label: cta })}
                  className={cn(
                    "inline-flex items-center gap-spacing-xs text-sm font-semibold uppercase [letter-spacing:var(--btn-letter-spacing,0.025em)] text-white hover:opacity-80 transition-opacity w-fit",
                    alignRight && "ml-auto"
                  )}
                  data-field="cta"
                >
                  {cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <div className={cn("grid gap-spacing-section-sm lg:grid-cols-[1fr_minmax(0,480px)] items-stretch", className)}>
      {/* Left column: eyebrow, heading, story, cards */}
      <ScrollReveal delay={0.1} direction="right" distance={30}>
        <div className="space-y-spacing-lg flex flex-col justify-center h-full">
          {(badge || title) && (
            <div className="flex items-center gap-spacing-sm">
              {badgeVariant !== "accent-no-line" && (
                <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
              )}
              {badge && (
                <Badge variant="accent" style={{ color: badgeColor }} data-field="header.badge">{badge}</Badge>
              )}
            </div>
          )}

          {title && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading leading-tight" data-field="header.title">{title}</h2>
          )}

          {story && story.content && (
            <div className="space-y-spacing-md">
              {story.content.split("\n\n").map((paragraph: string, index: number) => (
                <p key={index} className="text-muted leading-relaxed" data-field={`story.content.${index}`}>{paragraph}</p>
              ))}
            </div>
          )}

          {stats && stats.length > 0 && (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-md pt-spacing-sm" staggerDelay={0.1}>
              {stats.map((stat, index) => (
                <StaggerItem key={index} direction="up" distance={20}>
                  <div
                    className="border border-border rounded-radius px-spacing-md py-spacing-lg text-center h-full flex flex-col items-center justify-center gap-spacing-xs"
                    data-field={`stats.${index}`}
                  >
                    <span className="text-xl font-bold text-foreground font-heading" data-field={`stats.${index}.value`}>{stat.value}</span>
                    <span className="text-xs uppercase tracking-wide text-muted" data-field={`stats.${index}.label`}>{stat.label}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </ScrollReveal>

      {/* Right column: quote panel */}
      {quote && (
        <ScrollReveal delay={0.2} direction="left" distance={30}>
          <div
            className="bg-card border border-border rounded-radius p-spacing-2xl flex flex-col justify-center gap-spacing-lg h-full"
            style={cardBackgroundColor ? { backgroundColor: cardBackgroundColor } : undefined}
            data-field="quote"
          >
            {quote.flag ? (
              <SafeImage
                src={quote.flag}
                alt=""
                className="rounded-[2px] object-cover shadow-sm"
                style={{ width: "56px", height: "4px" }}
                data-field="quote.flag"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span
                className="rounded-[2px] shadow-sm"
                style={{ width: "56px", height: "4px", background: "var(--nav-logo-flag)" }}
                aria-hidden="true"
                data-field="quote.flag"
              />
            )}

            {quote.text && (
              <blockquote
                className="text-2xl md:text-3xl font-heading italic leading-snug text-foreground"
                data-field="quote.text"
              >
                {`“${quote.text}”`}
              </blockquote>
            )}

            {quote.author && (
              <p className="text-sm font-medium uppercase tracking-wide text-muted" data-field="quote.author">{quote.author}</p>
            )}

            {quote.note && (
              <>
                <span className="block w-full h-px bg-border" aria-hidden="true" />
                <p className="text-muted leading-relaxed" data-field="quote.note">{quote.note}</p>
              </>
            )}

            {cta && (
              <a
                href={ctaHref}
                onClick={() => (window as any).umami?.track("cta-click", { section: "about", label: cta })}
                className="inline-flex items-center gap-spacing-xs text-sm font-semibold uppercase [letter-spacing:var(--btn-letter-spacing,0.025em)] text-accent hover:opacity-80 transition-opacity w-fit"
                data-field="cta"
              >
                {cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
