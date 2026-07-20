"use client";

import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProcessStepsProps } from "./types";

export function ProcessConnected({ steps, className }: ProcessStepsProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Dashed horizontal connector behind the cards (desktop only) */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute top-[54px] left-[9%] right-[9%] h-[2px] z-0"
        style={{
          background: "repeating-linear-gradient(90deg, var(--border) 0 8px, transparent 8px 16px)",
        }}
      />

      <StaggerContainer
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-spacing-lg relative z-10"
        staggerDelay={0.1}
      >
        {steps.map((step, index) => {
          const num = String(step.number ?? index + 1).padStart(2, "0");
          const label = step.badges?.[0] || num;

          return (
            <StaggerItem key={index} direction="up" distance={30}>
              <div
                className="bg-card border border-border/40 rounded-[1.25rem] p-spacing-lg h-full flex flex-col transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10"
                data-field={`steps.${index}`}
              >
                {/* Number tile */}
                <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-extrabold text-[22px] shadow-lg shadow-primary/30 mb-spacing-lg">
                  {step.number ?? index + 1}
                </div>

                <p className="font-mono text-[11px] font-bold tracking-[.14em] uppercase text-primary mb-1.5">
                  {label}
                </p>

                <h3
                  className="text-[17px] font-bold text-foreground leading-snug mb-spacing-xs font-heading"
                  data-field={`steps.${index}.title`}
                >
                  {step.title}
                </h3>

                <p
                  className="text-sm text-muted leading-relaxed"
                  data-field={`steps.${index}.description`}
                >
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
