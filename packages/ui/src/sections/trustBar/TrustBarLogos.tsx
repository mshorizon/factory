"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
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
        duration: 25000,
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
    <div className={cn("overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className="flex w-max items-center gap-spacing-3xl"
        style={{ willChange: "transform" }}
      >
        {logos.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex-shrink-0 transition-all duration-300"
            data-field={`clientLogos.${i % clientLogos.length}`}
          >
            <img
              src={logo.image}
              alt={logo.name}
              className="h-8 w-auto opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
