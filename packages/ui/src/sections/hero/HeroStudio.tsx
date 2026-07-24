"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { Button } from "../../atoms/Button";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export interface HeroStudioTab {
  /** Tab label */
  title?: string;
  /** Screenshot shown inside the browser frame when this tab is active */
  image?: string;
  /** Text shown inside the fake browser URL bar */
  meta?: string;
}

export interface HeroStudioProps extends HeroProps {
  /** Pill tabs above the browser frame — each swaps the framed screenshot + URL text */
  items?: HeroStudioTab[];
  /** Small mono footnote rendered below the browser frame */
  footnote?: string;
}

/** How long each screenshot stays on screen before auto-advancing (ms). */
const SLIDE_DURATION = 5000;

/**
 * Splits the title on a "|" delimiter: text before it is rendered in the
 * foreground color, text after it in the primary color.
 */
function renderTitle(title: string) {
  const idx = title.indexOf("|");
  if (idx === -1) return title;
  return (
    <>
      <span>{title.slice(0, idx)}</span>
      <span className="text-primary">{title.slice(idx + 1)}</span>
    </>
  );
}

export function HeroStudio({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  items = [],
  footnote,
  className,
  isHomePage = false,
}: HeroStudioProps) {
  const [activeTab, setActiveTab] = useState(0);
  // Paused while the visitor hovers the screenshot — hovering also resets the timer.
  const [paused, setPaused] = useState(false);
  // Auto-cycle is disabled for visitors who prefer reduced motion.
  const [autoplay, setAutoplay] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const active = items[activeTab] || items[0];
  const canCycle = items.length > 1;

  // Respect prefers-reduced-motion: only auto-cycle when motion is welcome.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAutoplay(!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  // Drive the timer + progress bar with rAF so the bar shows exactly how long
  // the current screenshot has been displayed. Re-runs (and so resets to 0)
  // whenever the active tab changes or the visitor pauses/resumes on hover.
  useEffect(() => {
    const bar = progressRef.current;
    if (!canCycle || !autoplay || paused) {
      if (bar) bar.style.transform = "scaleX(0)";
      return;
    }
    let rafId = 0;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / SLIDE_DURATION, 1);
      if (bar) bar.style.transform = `scaleX(${progress})`;
      if (progress >= 1) {
        setActiveTab((prev) => (prev + 1) % items.length);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab, paused, autoplay, canCycle, items.length]);

  return (
    <section
      className={cn(
        "relative z-0 bg-background",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-spacing-2xl lg:gap-14 items-center">
          {/* Content side */}
          <div className="flex flex-col items-start">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <span
                  className="inline-flex items-center gap-spacing-xs bg-primary-light text-primary-dark rounded-full px-4 py-1.5 text-[13px] font-bold mb-spacing-lg"
                  data-field="header.badge"
                >
                  {badge}
                </span>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.1} direction="up">
              <h1
                className="text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.12] font-extrabold tracking-tight text-foreground mb-spacing-lg font-heading"
                data-field="header.title"
              >
                {renderTitle(title)}
              </h1>
            </ScrollReveal>

            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p
                  className="text-lg text-muted leading-relaxed mb-spacing-2xl max-w-xl"
                  data-field="header.subtitle"
                >
                  {subtitle}
                </p>
              </ScrollReveal>
            )}

            {(cta || secondaryCta) && (
              <ScrollReveal delay={0.3} direction="up">
                <div className="flex flex-wrap gap-spacing-md">
                  {cta && (
                    <Button
                      asChild
                      size="lg"
                      variant={cta.variant || "default"}
                      className="!rounded-full h-12 px-7 text-[15px] font-bold shadow-lg shadow-primary/25 hover:brightness-95 transition-all group"
                      data-field="cta"
                    >
                      <a
                        href={cta.href}
                        className="flex items-center gap-spacing-sm"
                        onClick={() => (window as any).umami?.track("cta-click", { section: "hero", label: cta.label })}
                      >
                        <span>{cta.label}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="!rounded-full h-12 px-7 text-[15px] font-bold bg-primary-light text-primary-dark hover:brightness-95 hover:text-primary-dark transition-all"
                      data-field="secondaryCta"
                    >
                      <a
                        href={secondaryCta.href}
                        onClick={() => (window as any).umami?.track("cta-click", { section: "hero-secondary", label: secondaryCta.label })}
                      >
                        {secondaryCta.label}
                      </a>
                    </Button>
                  )}
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* Browser-frame side */}
          <ScrollReveal delay={0.2} direction="right" distance={50}>
            <div className="w-full" style={pageSurfaceVars}>
              {/* Pill tabs */}
              {canCycle && (
                <div className="flex flex-wrap gap-spacing-xs mb-spacing-md" data-field="items">
                  {items.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      aria-pressed={i === activeTab}
                      className={cn(
                        "rounded-full px-4 py-2 text-[13px] font-bold transition-colors cursor-pointer",
                        i === activeTab
                          ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                          : "bg-card text-muted shadow-sm hover:text-foreground"
                      )}
                      data-field={`items.${i}.title`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Browser frame — hovering the frame pauses the auto-cycle and resets the timer */}
              <div
                className="bg-card rounded-2xl shadow-2xl shadow-primary/15 overflow-hidden"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  {active?.meta && (
                    <span
                      className="flex-1 ml-2.5 bg-card rounded-md px-3 py-1 font-mono text-[11px] text-muted truncate"
                      data-field={`items.${activeTab}.meta`}
                    >
                      {active.meta}
                    </span>
                  )}
                </div>

                {/* Auto-cycle progress bar — fills over SLIDE_DURATION, empty while paused */}
                {canCycle && (
                  <div className="h-1 w-full bg-secondary overflow-hidden">
                    <div
                      ref={progressRef}
                      className="h-full w-full origin-left bg-primary"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                )}

                {/* Screenshots — stacked and cross-faded on change */}
                {items.some((item) => item.image) && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-card">
                    {items.map((item, i) =>
                      item.image ? (
                        <SafeImage
                          key={item.image}
                          src={item.image}
                          alt={item.title || ""}
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover object-top transition-opacity ease-in-out duration-1000",
                            i === activeTab ? "opacity-100" : "opacity-0"
                          )}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          data-field={`items.${i}.image`}
                        />
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {footnote && (
                <p className="font-mono text-[11px] text-muted mt-spacing-sm text-center" data-field="footnote">
                  {footnote}
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
