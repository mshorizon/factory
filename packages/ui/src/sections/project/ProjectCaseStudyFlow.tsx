"use client";

import { useState } from "react";
import { MoveRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { CaseStudyQuote, CaseStudyItem } from "./ProjectCaseStudy";

/** A single case study rendered as the quote → screenshot → result flow. */
export interface CaseStudyFlowEntry {
  quote?: CaseStudyQuote;
  /** Screenshot shown inside the browser frame of the middle card */
  image?: string;
  /** name = URL-bar text, description = caption at the bottom of the card */
  imageDescription?: { name?: string; description?: string };
  /** Small mono uppercase label above the browser frame (e.g. "02 · Gotowa strona") */
  imageMeta?: string;
  /** Result cards rendered after the image card (usually one, e.g. "03 · Efekt") */
  items?: CaseStudyItem[];
}

export interface ProjectCaseStudyFlowProps extends CaseStudyFlowEntry {
  /**
   * Multiple case studies the visitor can switch between via dots at the
   * bottom of the section. When provided (and non-empty) this takes precedence
   * over the single-case-study props above.
   */
  caseStudies?: CaseStudyFlowEntry[];
  className?: string;
}

/**
 * Horizontal three-step case study: quote card → browser-mockup card → result
 * card(s), joined by arrows. All steps sit on one row on desktop.
 *
 * When more than one case study is supplied, dots at the bottom let the visitor
 * switch between them; clicking an inactive dot swaps the displayed case study.
 */
export function ProjectCaseStudyFlow({
  quote,
  image,
  imageDescription,
  imageMeta,
  items,
  caseStudies,
  className,
}: ProjectCaseStudyFlowProps) {
  // Prefer the explicit list; otherwise fall back to the single-case-study props.
  const studies: CaseStudyFlowEntry[] =
    caseStudies && caseStudies.length > 0
      ? caseStudies
      : [{ quote, image, imageDescription, imageMeta, items }];

  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, studies.length - 1);
  const study = studies[activeIndex];

  const meta = (text?: string) =>
    text ? (
      <p className="font-mono text-xs font-bold tracking-[.14em] uppercase text-primary mb-spacing-md">
        {text}
      </p>
    ) : null;

  const arrow = (
    <MoveRight aria-hidden="true" className="hidden lg:block w-7 h-7 text-primary shrink-0 self-center" />
  );

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        // Re-key on the active index so the reveal animations replay on switch.
        key={activeIndex}
        className="grid gap-spacing-lg items-stretch lg:grid-cols-[1fr_auto_1.25fr_auto_1fr]"
      >
        {/* Step 1 — the submission quote */}
        {study.quote && (
          <ScrollReveal delay={0.1} direction="up" distance={30}>
            <div
              className="bg-card rounded-2xl p-spacing-xl shadow-xl shadow-primary/10 flex flex-col h-full"
              style={pageSurfaceVars}
              data-field="quote"
            >
              {meta(study.quote.note)}
              {study.quote.text && (
                <blockquote className="italic text-[15px] leading-relaxed text-muted flex-1" data-field="quote.text">
                  &bdquo;{study.quote.text}&rdquo;
                </blockquote>
              )}
              {study.quote.author && (
                <p className="text-sm font-bold text-primary-dark mt-spacing-md" data-field="quote.author">
                  {study.quote.author}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {arrow}

        {/* Step 2 — the finished site in a browser frame */}
        {study.image && (
          <ScrollReveal delay={0.2} direction="up" distance={30}>
            <div
              className="bg-card rounded-2xl p-spacing-lg shadow-2xl shadow-primary/15 flex flex-col h-full"
              style={pageSurfaceVars}
            >
              {meta(study.imageMeta)}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  {study.imageDescription?.name && (
                    <span className="flex-1 ml-2.5 bg-card rounded-md px-3 py-1 font-mono text-[11px] text-muted truncate" data-field="imageDescription.name">
                      {study.imageDescription.name}
                    </span>
                  )}
                </div>
                <div className="aspect-[16/10] w-full overflow-hidden" data-field="image">
                  <SafeImage
                    src={study.image}
                    alt={study.imageDescription?.name || ""}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              {study.imageDescription?.description && (
                <p className="text-sm font-semibold text-muted mt-auto pt-spacing-md" data-field="imageDescription.description">
                  {study.imageDescription.description}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {arrow}

        {/* Step 3 — the outcome */}
        {study.items?.[0] && (
          <ScrollReveal delay={0.3} direction="up" distance={30}>
            <div
              className="bg-card rounded-2xl p-spacing-xl shadow-xl shadow-primary/10 flex flex-col h-full"
              style={pageSurfaceVars}
              data-field="items.0"
            >
              {meta(study.items[0].meta)}
              {study.items[0].title && (
                <h3 className="text-xl font-bold text-foreground mb-spacing-sm" data-field="items.0.title">
                  {study.items[0].title}
                </h3>
              )}
              {study.items[0].description && (
                <p className="text-[15px] text-muted leading-relaxed" data-field="items.0.description">
                  {study.items[0].description}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Dot navigation — only when there is more than one case study */}
      {studies.length > 1 && (
        <div className="flex items-center justify-center gap-spacing-sm mt-spacing-2xl">
          {studies.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show case study ${i + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  isActive
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-border hover:bg-primary/50 cursor-pointer"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
