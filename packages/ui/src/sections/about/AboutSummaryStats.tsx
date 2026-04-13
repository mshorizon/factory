"use client";

import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { StatItem } from "./types";

export interface AboutSummaryStatsProps {
  stats: StatItem[];
  className?: string;
}

export function AboutSummaryStats({ stats, className }: AboutSummaryStatsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <ScrollReveal delay={0.2} direction="up">
      <StaggerContainer
        className={`flex flex-row flex-nowrap justify-center gap-spacing-lg md:gap-spacing-xl ${className ?? ""}`}
        staggerDelay={0.1}
      >
        {stats.map((stat, index) => (
          <StaggerItem key={index} direction="up" distance={20}>
            <div className="text-center flex-1 min-w-0" data-field={`stats.${index}`}>
              <div
                className="text-[40px] md:text-[64px] font-medium font-heading leading-none"
                data-field={`stats.${index}.value`}
              >
                {stat.value}
              </div>
              <div
                className="text-sm md:text-xl mt-spacing-sm md:mt-spacing-xl"
                style={{ color: "var(--muted)" }}
                data-field={`stats.${index}.label`}
              >
                {stat.label}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScrollReveal>
  );
}
