"use client";

import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import type { CtaBannerProps } from "./types";

export function CtaBannerTicker({
  marqueeText,
  className,
}: CtaBannerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const wrapperRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;

    // Create animation using Web Animations API
    const animation = track.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-50%)" }
      ],
      {
        duration: 60000, // 60s
        iterations: Infinity,
        easing: "linear"
      }
    );

    animationRef.current = animation;

    return () => {
      animation.cancel();
    };
  }, []);

  const handleMouseEnter = () => {
    if (animationRef.current && wrapperRef.current) {
      // Smoothly slow down animation playback rate
      const startRate = animationRef.current.playbackRate;
      const endRate = 0.5; // Half speed (60s -> 120s)
      const startTime = performance.now();
      const duration = 700; // 0.7s transition

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out interpolation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRate = startRate + (endRate - startRate) * easeOut;

        if (animationRef.current) {
          animationRef.current.playbackRate = currentRate;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  };

  const handleMouseLeave = () => {
    if (animationRef.current) {
      // Smoothly speed up animation playback rate
      const startRate = animationRef.current.playbackRate;
      const endRate = 1; // Normal speed
      const startTime = performance.now();
      const duration = 700; // 0.7s transition

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out interpolation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRate = startRate + (endRate - startRate) * easeOut;

        if (animationRef.current) {
          animationRef.current.playbackRate = currentRate;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  };

  // Create separator with 16px gap (0.5rem on each side = 1rem total = 16px)
  const separator = <span className="inline-block px-2">•</span>;

  return (
    <a
      ref={wrapperRef}
      href="/contact"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "block overflow-hidden h-16 cursor-pointer bg-primary",
        "transition-all duration-700 ease-out",
        "hover:brightness-90",
        className
      )}
    >
      <div
        ref={trackRef}
        className="flex items-center h-full whitespace-nowrap"
      >
        <span className="marquee-content text-2xl font-bold font-heading text-foreground flex items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center">
              {marqueeText}
              {separator}
            </span>
          ))}
        </span>
        <span className="marquee-content text-2xl font-bold font-heading text-foreground flex items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center">
              {marqueeText}
              {separator}
            </span>
          ))}
        </span>
      </div>
      <style>{`
        .marquee-content {
          flex-shrink: 0;
        }
      `}</style>
    </a>
  );
}
