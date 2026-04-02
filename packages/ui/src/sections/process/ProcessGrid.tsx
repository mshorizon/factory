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
              className="rounded-lg border border-border/50 p-5 md:p-[20px_30px] bg-card/50 h-full flex flex-col max-w-[440px]"
              data-field={`steps.${index}`}
            >
              <span
                className="inline-flex items-center w-fit border border-border/30 rounded-md px-[9px] py-[6px] text-xs font-medium text-muted"
                data-field={`steps.${index}.number`}
              >
                Step {step.number}
              </span>

              <div className="h-px bg-border/50 my-spacing-sm" />

              <h3
                className="text-xl text-foreground mb-spacing-sm"
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

              {step.image && (
                <div className="mt-spacing-lg">
                  <img src={step.image} alt={step.title} className="w-full max-w-[360px] h-[160px] object-cover rounded-lg" loading="lazy" />
                </div>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
