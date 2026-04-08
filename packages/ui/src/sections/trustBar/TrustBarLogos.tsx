"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import type { TrustBarLogosProps } from "./types";

export function TrustBarLogos({ clientLogos, className }: TrustBarLogosProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const animation = el.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-50%)" },
      ],
      {
        duration: 50000,
        iterations: Infinity,
        easing: "linear",
      }
    );

    const handleEnter = () => {
      animation.playbackRate = 0.3;
    };
    const handleLeave = () => {
      animation.playbackRate = 1;
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      animation.cancel();
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (!clientLogos?.length) return null;

  // Duplicate logos for seamless infinite scroll
  const logos = [...clientLogos, ...clientLogos];

  return (
    <div className={cn("", className)}>
      <div className="max-w-[750px] mx-auto overflow-hidden relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div
          ref={scrollRef}
          className="flex w-max items-center gap-spacing-xl"
          style={{ willChange: "transform" }}
        >
          {logos.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 transition-all duration-300"
              data-field={`clientLogos.${i % clientLogos.length}`}
            >
              <SafeImage
                src={logo.image}
                alt={logo.name}
                className="h-8 w-auto opacity-80 transition-all duration-300 hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
