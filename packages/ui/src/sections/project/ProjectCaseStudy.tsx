"use client";

import { MoveRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";

export interface CaseStudyQuote {
  /** Italic quote text */
  text?: string;
  /** Bold footer line under the quote */
  author?: string;
  /** Small mono uppercase label above the quote */
  note?: string;
}

export interface CaseStudyItem {
  /** Small mono uppercase label (e.g. "PRZED") */
  meta?: string;
  title?: string;
  description?: string;
}

export interface ProjectCaseStudyProps {
  quote?: CaseStudyQuote;
  /** Screenshot shown inside the browser frame */
  image?: string;
  /** name = URL-bar text, description = mono caption under the frame */
  imageDescription?: { name?: string; description?: string };
  /** Before/after cards — the second one gets a primary border highlight */
  items?: CaseStudyItem[];
  className?: string;
}

export function ProjectCaseStudy({
  quote,
  image,
  imageDescription,
  items = [],
  className,
}: ProjectCaseStudyProps) {
  const cards = items.slice(0, 2);

  return (
    <div className={cn("flex flex-col gap-spacing-2xl", className)}>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-spacing-xl items-center">
        {/* Quote card */}
        {quote && (
          <ScrollReveal delay={0.1} direction="left" distance={30}>
            <div
              className="bg-card rounded-2xl p-spacing-xl shadow-xl shadow-primary/10"
              style={pageSurfaceVars}
              data-field="quote"
            >
              {quote.note && (
                <p className="font-mono text-xs font-bold tracking-[.14em] uppercase text-primary mb-spacing-md" data-field="quote.note">
                  {quote.note}
                </p>
              )}
              {quote.text && (
                <blockquote className="italic text-[15px] leading-relaxed text-muted mb-spacing-md" data-field="quote.text">
                  &bdquo;{quote.text}&rdquo;
                </blockquote>
              )}
              {quote.author && (
                <p className="text-sm font-bold text-primary-dark" data-field="quote.author">
                  {quote.author}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Browser-frame screenshot */}
        {image && (
          <ScrollReveal delay={0.2} direction="right" distance={30}>
            <div style={pageSurfaceVars}>
              <div className="bg-card rounded-2xl shadow-2xl shadow-primary/15 overflow-hidden">
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
                <p className="font-mono text-[11px] text-muted mt-spacing-sm text-center" data-field="imageDescription.description">
                  {imageDescription.description}
                </p>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Before / after cards */}
      {cards.length > 0 && (
        <ScrollReveal delay={0.3} direction="up" distance={30}>
          <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-spacing-lg max-w-4xl mx-auto w-full">
            {cards.map((item, i) => (
              <div key={i} className="contents">
                {i > 0 && (
                  <MoveRight aria-hidden="true" className="hidden md:block w-7 h-7 text-primary shrink-0" />
                )}
                <div
                  className={cn(
                    "bg-card rounded-2xl p-spacing-lg h-full",
                    i === 1
                      ? "border-2 border-primary shadow-xl shadow-primary/15"
                      : "shadow-lg shadow-primary/10"
                  )}
                  style={pageSurfaceVars}
                  data-field={`items.${i}`}
                >
                  {item.meta && (
                    <p
                      className={cn(
                        "font-mono text-xs font-bold tracking-[.14em] uppercase mb-spacing-md",
                        i === 1 ? "text-primary" : "text-muted"
                      )}
                      data-field={`items.${i}.meta`}
                    >
                      {item.meta}
                    </p>
                  )}
                  {item.title && (
                    <h3 className="text-base font-bold text-foreground mb-spacing-xs" data-field={`items.${i}.title`}>
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted leading-relaxed" data-field={`items.${i}.description`}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
