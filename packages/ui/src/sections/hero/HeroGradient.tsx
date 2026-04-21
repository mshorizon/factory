"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import type { HeroProps } from "./types";

// Calculate --tx and --ty for particles moving toward center (50%, 50%)
function calcParticleVars(top: string, left: string) {
  const t = parseFloat(top);
  const l = parseFloat(left);
  const tx = `${(50 - l) * 0.6}vw`;
  const ty = `${(50 - t) * 0.6}vh`;
  return { "--tx": tx, "--ty": ty } as React.CSSProperties;
}

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
    const timer = setTimeout(() => setShowText(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Split title into words for staggered reveal
  const titleWords = typeof title === "string" ? title.split(" ") : null;

  return (
    <section
      className={cn(
        "relative z-0 bg-background overflow-hidden flex items-center justify-center",
        isHomePage && "min-h-[calc(100vh-100px)]",
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
        @keyframes particle-to-center {
          0% { opacity: 0; transform: translate(0, 0) scale(1); }
          15% { opacity: 0.8; }
          70% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.1); }
        }
        @keyframes hero-word-reveal {
          from { opacity: 0; filter: blur(10px); }
          to { opacity: 1; filter: blur(0); }
        }
      `}} />
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
        {/* Orb container */}
        <div className="relative w-[406px] h-[406px]" style={{ opacity: 0.6 }}>
          {/* Big circle */}
          <div
            className="absolute inset-0 overflow-hidden blur-[8px]"
            style={{
              borderRadius: "363px",
              background: "linear-gradient(229deg, #DF7AFE 13%, rgba(201,110,240,0) 35%, rgba(164,92,219,0) 64%, #814AC8 88%)",
              animation: "orb-rotate 20s linear infinite",
            }}
          />
          {/* Small circle */}
          <div
            className="absolute w-[300px] h-[300px] top-1/2 left-1/2 overflow-hidden blur-[6px]"
            style={{
              borderRadius: "363px",
              background: "linear-gradient(141deg, #DF7AFE 13%, rgba(201,110,240,0) 35%, rgba(164,92,219,0) 64%, #814AC8 88%)",
              animation: "orb-rotate-reverse 15s linear infinite",
            }}
          />
        </div>
        {/* Scattered particles */}
        {[
          { top: "10%", left: "20%", delay: "0s", size: "2px" },
          { top: "65%", left: "60%", delay: "1.2s", size: "2px" },
          { top: "30%", left: "70%", delay: "2.4s", size: "2.5px" },
          { top: "75%", left: "30%", delay: "0.6s", size: "2px" },
          { top: "25%", left: "55%", delay: "1.8s", size: "1.5px" },
          { top: "55%", left: "45%", delay: "3s", size: "2.5px" },
          { top: "40%", left: "75%", delay: "2s", size: "1.5px" },
          { top: "80%", left: "55%", delay: "0.8s", size: "2px" },
          { top: "15%", left: "45%", delay: "3.5s", size: "1.5px" },
          { top: "50%", left: "25%", delay: "1.5s", size: "2.5px" },
          { top: "85%", left: "40%", delay: "0.3s", size: "2px" },
          { top: "35%", left: "15%", delay: "2.8s", size: "1.5px" },
          { top: "70%", left: "80%", delay: "1s", size: "2px" },
          { top: "20%", left: "85%", delay: "2.2s", size: "1.5px" },
          { top: "90%", left: "70%", delay: "0.4s", size: "2px" },
          { top: "45%", left: "10%", delay: "3.2s", size: "2.5px" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/80"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              ...calcParticleVars(p.top, p.left),
              animation: `particle-to-center 4s ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto text-center">
        {badge && (
          <div className={cn(
            "transition-all duration-1000",
            heroVisible ? "opacity-100 blur-0" : "opacity-0 blur-md"
          )}>
            {badge.includes("|") ? (
              <div className="mb-spacing-lg inline-flex items-center gap-2 py-spacing-sm backdrop-blur-sm bg-background border border-border/30 rounded-full" style={{ padding: `2px ${showText ? "10px" : "2px"} 2px 2px`, transition: "padding 0.5s ease" }} data-field="header.badge">
                <span className="bg-primary text-on-primary px-2.5 py-0.5 rounded-lg text-xs font-medium">
                  {badge.split("|")[0]}
                </span>
                <span className={cn(
                  "text-sm text-foreground/90 overflow-hidden transition-all duration-500 whitespace-nowrap",
                  showText ? "max-w-[300px] opacity-100" : "max-w-0 opacity-0"
                )}>{badge.split("|")[1]}</span>
              </div>
            ) : (
              <Badge
                variant="accent"
                className="mb-spacing-lg text-sm px-spacing-md py-spacing-sm backdrop-blur-sm bg-background border border-border/30"
                data-field="header.badge"
              >
                {badge}
              </Badge>
            )}
          </div>
        )}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-[var(--heading-weight,700)] font-heading mb-spacing-lg tracking-tight text-foreground max-w-4xl mx-auto" data-field="header.title">
          {titleWords ? (
            titleWords.map((word, idx) => (
              <span
                key={idx}
                style={{
                  opacity: 0,
                  filter: "blur(10px)",
                  display: "inline-block",
                  animation: "hero-word-reveal 0.5s ease forwards",
                  animationDelay: `${1500 + idx * 100}ms`,
                  marginRight: "0.3em",
                }}
              >
                {word}
              </span>
            ))
          ) : (
            title
          )}
        </h1>
        <div className={cn(
          "transition-all duration-1000",
          heroVisible ? "opacity-100 blur-0" : "opacity-0 blur-md"
        )}>
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
                  size="default"
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
                  size="default"
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
      </div>
    </section>
  );
}
