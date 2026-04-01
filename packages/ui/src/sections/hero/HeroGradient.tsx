"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroGradient({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  backgroundImage,
  children,
  className,
  isHomePage = false,
}: HeroProps) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={cn(
        "relative z-0 bg-background overflow-hidden flex items-center justify-center",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      {/* Background image (if provided) */}
      {backgroundImage && (
        <div
          className="absolute inset-0 opacity-20"
          data-field="backgroundImage"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Animated swirling orb background */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes swirl {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          25% { transform: translate(-50%, -50%) rotate(90deg) scale(1.1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(0.95); }
          75% { transform: translate(-50%, -50%) rotate(270deg) scale(1.08); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        @keyframes swirl-reverse {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1.05); }
          25% { transform: translate(-50%, -50%) rotate(-90deg) scale(0.95); }
          50% { transform: translate(-50%, -50%) rotate(-180deg) scale(1.1); }
          75% { transform: translate(-50%, -50%) rotate(-270deg) scale(1); }
          100% { transform: translate(-50%, -50%) rotate(-360deg) scale(1.05); }
        }
        @keyframes float-particle {
          0%, 100% { opacity: 0.3; transform: translateY(0px) scale(1); }
          50% { opacity: 0.8; transform: translateY(-20px) scale(1.5); }
        }
      `}} />
      <div className="absolute inset-0 overflow-hidden">
        {/* Main swirling orb */}
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/40 rounded-full blur-[100px]"
          style={{ animation: "swirl 12s ease-in-out infinite" }}
        />
        {/* Secondary offset orb */}
        <div
          className="absolute top-[40%] left-[55%] w-[300px] h-[300px] bg-primary/25 rounded-full blur-[80px]"
          style={{ animation: "swirl-reverse 16s ease-in-out infinite" }}
        />
        {/* Scattered particles */}
        {[
          { top: "20%", left: "30%", delay: "0s", size: "w-2 h-2" },
          { top: "60%", left: "70%", delay: "1s", size: "w-1.5 h-1.5" },
          { top: "35%", left: "65%", delay: "2s", size: "w-1 h-1" },
          { top: "70%", left: "25%", delay: "0.5s", size: "w-2 h-2" },
          { top: "25%", left: "55%", delay: "1.5s", size: "w-1 h-1" },
          { top: "55%", left: "40%", delay: "3s", size: "w-1.5 h-1.5" },
          { top: "45%", left: "80%", delay: "2.5s", size: "w-1 h-1" },
          { top: "80%", left: "50%", delay: "0.8s", size: "w-2 h-2" },
        ].map((p, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full bg-primary/60", p.size)}
            style={{
              top: p.top,
              left: p.left,
              animation: `float-particle 4s ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto text-center">
        {badge && (
          <ScrollReveal delay={0} direction="up">
            {badge.includes("|") ? (
              <div className="mb-spacing-lg inline-flex items-center gap-2 py-spacing-sm backdrop-blur-sm bg-primary/10 border border-primary/20 rounded-full" style={{ padding: "2px 10px 2px 2px" }} data-field="header.badge">
                <span className="bg-primary text-on-primary px-2.5 py-0.5 rounded-lg text-xs font-medium">
                  {badge.split("|")[0]}
                </span>
                <span className={cn(
                  "text-sm text-foreground/90 overflow-hidden transition-all duration-700 whitespace-nowrap",
                  showText ? "max-w-[300px] opacity-100" : "max-w-0 opacity-0"
                )}>{badge.split("|")[1]}</span>
              </div>
            ) : (
              <Badge
                variant="accent"
                className="mb-spacing-lg text-sm px-spacing-md py-spacing-sm backdrop-blur-sm bg-primary/10 border border-primary/20"
                data-field="header.badge"
              >
                {badge}
              </Badge>
            )}
          </ScrollReveal>
        )}
        <ScrollReveal delay={0.1} direction="up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-spacing-lg tracking-tight text-foreground max-w-4xl mx-auto" data-field="header.title">
            {title}
          </h1>
        </ScrollReveal>
        {subtitle && (
          <ScrollReveal delay={0.2} direction="up">
            <p className="text-lg md:text-xl text-muted mb-spacing-2xl max-w-2xl mx-auto" data-field="header.subtitle">
              {subtitle}
            </p>
          </ScrollReveal>
        )}
        {(cta || secondaryCta) && (
          <ScrollReveal delay={0.3} direction="up">
            <div className="flex flex-wrap gap-spacing-md justify-center">
              {cta && (
                <Button
                  asChild
                  size="lg"
                  variant={cta.variant || "default"}
                  className="!rounded-lg shadow-lg shadow-primary/25"
                  data-field="cta"
                >
                  <a href={cta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero', label: cta.label })}>
                    {cta.label}
                  </a>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="!rounded-lg border-border/50 text-foreground hover:bg-white/5"
                  data-field="secondaryCta"
                >
                  <a href={secondaryCta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero-secondary', label: secondaryCta.label })}>{secondaryCta.label}</a>
                </Button>
              )}
            </div>
          </ScrollReveal>
        )}
        {children}
      </div>
    </section>
  );
}
