"use client";

import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProcessStepsProps } from "./types";

export function ProcessGrid({ steps, className }: ProcessStepsProps) {
  return (
    <StaggerContainer
      className={cn("grid grid-cols-1 md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {steps.map((step, index) => {
        const directions = ["left", "right", "left", "right"] as const;
        const direction = directions[index % 4];

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div
              className="rounded-[1.25rem] border border-border/50 p-spacing-2xl bg-card/50 h-full flex flex-col"
              data-field={`steps.${index}`}
            >
              <span
                className="text-xs font-medium text-muted uppercase tracking-wide"
                data-field={`steps.${index}.number`}
              >
                Step {step.number}
              </span>

              <div className="h-px bg-border/50 my-spacing-md" />

              <h3
                className="text-xl font-semibold text-foreground mb-spacing-sm"
                data-field={`steps.${index}.title`}
              >
                {step.title}
              </h3>

              <p
                className="text-sm text-muted leading-relaxed flex-1"
                data-field={`steps.${index}.description`}
              >
                {step.description}
              </p>

              {step.badges && step.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-spacing-lg">
                  {step.badges.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-muted"
                    >
                      {badge}
                    </span>
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
