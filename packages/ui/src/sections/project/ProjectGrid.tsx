"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProjectGridProps } from "./types";

export function ProjectGrid({ projects, className }: ProjectGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-2xl", className)}
      staggerDelay={0.12}
    >
      {projects.map((project, index) => {
        const direction = index % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card
            className="overflow-hidden h-full flex flex-col !rounded-radius-secondary bg-card"
            data-field={`projects.${index}`}
          >
            {project.image && (
              <div className="aspect-[16/10] overflow-hidden">
                <SafeImage
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover rounded-b-radius-secondary"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <div className="p-spacing-lg flex flex-col flex-1">
              {project.date && (
                <div className="flex items-center gap-1.5 mb-spacing-xs">
                  <CalendarDays className="h-5 w-5 shrink-0" style={{ color: 'var(--primary-dark)' }} />
                  <span
                    className="text-xs text-muted"
                    data-field={`projects.${index}.date`}
                  >
                    {project.date}
                  </span>
                </div>
              )}
              <h3
                className="text-lg font-semibold text-foreground mb-spacing-xs"
                data-field={`projects.${index}.title`}
              >
                {project.title}
              </h3>
              <p
                className="text-sm text-muted leading-relaxed flex-1"
                data-field={`projects.${index}.description`}
              >
                {project.description}
              </p>
            </div>
          </Card>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
