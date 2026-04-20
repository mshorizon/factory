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
      className={`grid grid-cols-2 md:grid-cols-4 gap-spacing-xl md:gap-spacing-section-sm ${className ?? ""}`}
    >
      {stats.map((stat, index) => (
        <div key={index} className="text-center" data-field={`stats.${index}`}>
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
