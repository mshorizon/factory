"use client";

import type { StatItem } from "./types";

export interface AboutSummaryStatsProps {
  stats: StatItem[];
  className?: string;
}

export function AboutSummaryStats({ stats, className }: AboutSummaryStatsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      className={`flex flex-row flex-nowrap justify-center gap-spacing-section-sm md:gap-spacing-section ${className ?? ""}`}
    >
      {stats.map((stat, index) => (
        <div key={index} className="text-center flex-1 min-w-0" data-field={`stats.${index}`}>
          <div
            className="text-[40px] md:text-[64px] font-medium font-heading leading-none"
            data-field={`stats.${index}.value`}
          >
            {stat.value}
          </div>
          <div
            className="text-xs md:text-sm mt-spacing-sm md:mt-spacing-xl font-light"
            style={{ color: "var(--muted)" }}
            data-field={`stats.${index}.label`}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
