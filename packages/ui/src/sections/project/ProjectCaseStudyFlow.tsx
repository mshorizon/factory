"use client";

import { MoveRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { CaseStudyQuote, CaseStudyItem } from "./ProjectCaseStudy";

export interface ProjectCaseStudyFlowProps {
  quote?: CaseStudyQuote;
  /** Screenshot shown inside the browser frame of the middle card */
  image?: string;
  /** name = URL-bar text, description = caption at the bottom of the card */
  imageDescription?: { name?: string; description?: string };
  /** Small mono uppercase label above the browser frame (e.g. "02 · Gotowa strona") */
  imageMeta?: string;
  /** Result cards rendered after the image card (usually one, e.g. "03 · Efekt") */
  items?: CaseStudyItem[];
  className?: string;
}

/**
 * Horizontal three-step case study: quote card → browser-mockup card → result
 * card(s), joined by arrows. All steps sit on one row on desktop.
 */
export function ProjectCaseStudyFlow({
  quote,
  image,
  imageDescription,
  imageMeta,
  items = [],
  className,
}: ProjectCaseStudyFlowProps) {
  const meta = (text?: string) => (
    text ? (
      <p className="font-mono text-xs font-bold tracking-[.14em] uppercase text-primary mb-spacing-md">
        {text}
      </p>
    ) : null
  );

  const arrow = (
    <MoveRight aria-hidden="true" className="hidden lg:block w-7 h-7 text-primary shrink-0 self-center" />
  );

  return (
    <div
      className={cn(
        "grid gap-spacing-lg items-stretch lg:grid-cols-[1fr_auto_1.25fr_auto_1fr]",
        className
      )}
    >
      {/* Step 1 — the submission quote */}
      {quote && (
        <ScrollReveal delay={0.1} direction="up" distance={30}>
          <div
            className="bg-card rounded-2xl p-spacing-xl shadow-xl shadow-primary/10 flex flex-col h-full"
            style={pageSurfaceVars}
            data-field="quote"
          >
            {meta(quote.note)}
            {quote.text && (
              <blockquote className="italic text-[15px] leading-relaxed text-muted flex-1" data-field="quote.text">
                &bdquo;{quote.text}&rdquo;
              </blockquote>
            )}
            {quote.author && (
              <p className="text-sm font-bold text-primary-dark mt-spacing-md" data-field="quote.author">
                {quote.author}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}

      {arrow}

      {/* Step 2 — the finished site in a browser frame */}
      {image && (
        <ScrollReveal delay={0.2} direction="up" distance={30}>
          <div
            className="bg-card rounded-2xl p-spacing-lg shadow-2xl shadow-primary/15 flex flex-col h-full"
            style={pageSurfaceVars}
          >
            {meta(imageMeta)}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                {imageDescription?.name && (
                  <span className="flex-1 ml-2.5 bg-card rounded-md px-3 py-1 font-mono text-[11px] text-muted truncate" data-field="imageDescription.name">
                    {imageDescription.name}
                  </span>
                )}
              </div>
              <div className="aspect-[16/10] w-full overflow-hidden" data-field="image">
                <SafeImage
                  src={image}
                  alt={imageDescription?.name || ""}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            {imageDescription?.description && (
              <p className="text-sm font-semibold text-muted mt-auto pt-spacing-md" data-field="imageDescription.description">
                {imageDescription.description}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}

      {arrow}

      {/* Step 3 — the outcome */}
      {items[0] && (
        <ScrollReveal delay={0.3} direction="up" distance={30}>
          <div
            className="bg-card rounded-2xl p-spacing-xl shadow-xl shadow-primary/10 flex flex-col h-full"
            style={pageSurfaceVars}
            data-field="items.0"
          >
            {meta(items[0].meta)}
            {items[0].title && (
              <h3 className="text-xl font-bold text-foreground mb-spacing-sm" data-field="items.0.title">
                {items[0].title}
              </h3>
            )}
            {items[0].description && (
              <p className="text-[15px] text-muted leading-relaxed" data-field="items.0.description">
                {items[0].description}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
