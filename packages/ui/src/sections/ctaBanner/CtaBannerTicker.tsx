"use client";

import { cn } from "../../lib/utils";
import type { CtaBannerProps } from "./types";

export function CtaBannerTicker({
  marqueeText,
  className,
}: CtaBannerProps) {
  if (!marqueeText) return null;

  // Repeat text enough times for seamless loop
  const repeated = Array.from({ length: 8 }, () => marqueeText).join(
    " \u2014 "
  );

  return (
    <div className={cn("overflow-hidden py-spacing-lg", className)}>
      <div className="marquee-track flex whitespace-nowrap">
        <span className="marquee-content text-3xl md:text-5xl font-bold font-heading text-foreground">
          {repeated} &mdash;&nbsp;
        </span>
        <span className="marquee-content text-3xl md:text-5xl font-bold font-heading text-foreground">
          {repeated} &mdash;&nbsp;
        </span>
      </div>
      <style>{`
        .marquee-track {
          animation: marquee-scroll 30s linear infinite;
        }
        .marquee-content {
          flex-shrink: 0;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
