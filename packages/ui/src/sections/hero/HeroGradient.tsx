"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
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
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 2000);
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

      {/* Animated orb background - matching Xtract Framer reference */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orb-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orb-rotate-reverse {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes hero-reveal {
          from { opacity: 0; filter: blur(20px); }
          to { opacity: 1; filter: blur(0px); }
        }
        @keyframes particle-drift {
          0%, 100% { opacity: 0.2; transform: translateY(0) scale(0.8); }
          50% { opacity: 0.6; transform: translateY(-15px) scale(1.2); }
        }
      `}} />
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
        {/* Orb container */}
        <div className="relative w-[406px] h-[406px]" style={{ opacity: 0.6 }}>
          {/* Big circle */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: "363px",
              background: "linear-gradient(229deg, #DF7AFE 13%, rgba(201,110,240,0) 35%, rgba(164,92,219,0) 64%, #814AC8 88%)",
              animation: "orb-rotate 20s linear infinite",
            }}
          />
          {/* Small circle */}
          <div
            className="absolute w-[300px] h-[300px] top-1/2 left-1/2 overflow-hidden"
            style={{
              borderRadius: "363px",
              background: "linear-gradient(141deg, #DF7AFE 13%, rgba(201,110,240,0) 35%, rgba(164,92,219,0) 64%, #814AC8 88%)",
              animation: "orb-rotate-reverse 15s linear infinite",
            }}
          />
        </div>
        {/* Scattered particles */}
        {[
          { top: "20%", left: "35%", delay: "0s", size: "2px" },
          { top: "65%", left: "60%", delay: "1.2s", size: "1.5px" },
          { top: "30%", left: "70%", delay: "2.4s", size: "2px" },
          { top: "75%", left: "30%", delay: "0.6s", size: "1.5px" },
          { top: "25%", left: "55%", delay: "1.8s", size: "1px" },
          { top: "55%", left: "45%", delay: "3s", size: "2px" },
          { top: "40%", left: "75%", delay: "2s", size: "1px" },
          { top: "80%", left: "55%", delay: "0.8s", size: "1.5px" },
          { top: "15%", left: "45%", delay: "3.5s", size: "1px" },
          { top: "50%", left: "25%", delay: "1.5s", size: "2px" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/60"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              animation: `particle-drift 5s ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className={cn(
        "relative container mx-auto text-center transition-all duration-1000",
        heroVisible ? "opacity-100 blur-0" : "opacity-0 blur-md"
      )}>
        {badge && (
          badge.includes("|") ? (
            <div className="mb-spacing-lg inline-flex items-center gap-2 py-spacing-sm backdrop-blur-sm bg-primary/10 border border-primary/20 rounded-full" style={{ padding: `2px ${showText ? "10px" : "2px"} 2px 2px`, transition: "padding 0.5s ease" }} data-field="header.badge">
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
          )
        )}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-spacing-lg tracking-tight text-foreground max-w-4xl mx-auto" data-field="header.title">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-muted mb-spacing-2xl max-w-2xl mx-auto" data-field="header.subtitle">
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
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
        )}
        {children}
      </div>
    </section>
  );
}
