"use client";

import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProcessStepsProps } from "./types";

export function ProcessTimeline({ steps, className }: ProcessStepsProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-5", className)}
      staggerDelay={0.1}
    >
      {steps.map((step, index) => {
        const directions = ["left", "right", "left", "right"] as const;
        const direction = directions[index % 4];
        const dayLabel = step.badges?.[0];
        const num = String(step.number).padStart(2, "0");

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div
              className="bg-background rounded-3xl p-spacing-lg lg:p-spacing-2xl border border-border shadow-sm hover:shadow-md transition-shadow relative h-full flex flex-col"
              data-field={`steps.${index}`}
            >
              <div className="flex items-center gap-3 mb-5">
                {dayLabel && (
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide uppercase">
                    {dayLabel}
                  </div>
                )}
                <div className="font-heading-secondary text-2xl italic font-bold text-primary/40">
                  {num}
                </div>
              </div>

              <h3
                className="text-xl font-bold mb-3 text-foreground leading-tight font-heading"
                data-field={`steps.${index}.title`}
              >
                {step.title}
              </h3>

              <p
                className="text-sm text-muted leading-relaxed mb-5"
                data-field={`steps.${index}.description`}
              >
                {step.description}
              </p>

              {step.badges && step.badges.length > 1 && (
                <div className="space-y-2 pt-5 border-t border-border mt-auto">
                  {step.badges.slice(1).map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" strokeWidth={3} />
                      <span className="text-foreground/80">{bullet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
