"use client";

import { CalendarDays, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProjectGridProps } from "./types";

export function ProjectGrid({ projects, className, columns = 2, footerCta }: ProjectGridProps) {
  return (
    <>
    <StaggerContainer
      className={cn("grid gap-spacing-2xl", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2", className)}
      staggerDelay={0.12}
    >
      {projects.map((project, index) => {
        const direction = index % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card
            className="overflow-hidden h-full flex flex-col !rounded-radius-secondary bg-card group"
            data-field={`projects.${index}`}
          >
            {project.image && (
              <div className="aspect-[16/10] overflow-hidden">
                <SafeImage
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover rounded-b-radius-secondary group-hover:scale-110 transition-transform duration-500"
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
              {project.category && (
                <span
                  className="self-start inline-flex items-center px-2.5 py-0.5 mb-spacing-xs text-[10px] font-semibold uppercase tracking-wider rounded-radius bg-primary/10 text-primary"
                  data-field={`projects.${index}.category`}
                >
                  {project.category}
                </span>
              )}
              <h3
                className="text-lg font-semibold font-heading text-foreground mb-spacing-xs"
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
              {project.readMore && (
                <a
                  href={project.readMore.href}
                  className="inline-flex items-center gap-1.5 mt-spacing-md text-sm font-semibold text-primary no-underline hover:underline"
                >
                  {project.readMore.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </Card>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
    {footerCta && (
      <div className="flex justify-center mt-spacing-2xl">
        <Button asChild variant="outline" className="uppercase tracking-wider">
          <a href={footerCta.href}>
            {footerCta.label}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    )}
    </>
  );
}
