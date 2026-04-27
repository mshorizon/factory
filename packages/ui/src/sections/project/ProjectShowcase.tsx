"use client";

import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProjectGridProps } from "./types";

export function ProjectShowcase({ projects, className }: ProjectGridProps) {
  const offsets = ["md:mt-0", "md:mt-12", "md:mt-0"];

  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-3 gap-6 lg:gap-8", className)}
      staggerDelay={0.12}
    >
      {projects.map((project, index) => {
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        const offset = offsets[index % 3];
        const metric = project.metrics?.[0];
        const metricSub = project.metrics?.[1];
        const quote = project.metrics?.[2];
        const category = project.metrics?.[3] || project.date;
        const city = project.metrics?.[4];

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div className={cn("group cursor-pointer", offset)} data-field={`projects.${index}`}>
              <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-5 relative shadow-lg ring-1 ring-foreground/5">
                {project.image && (
                  <SafeImage
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-90 transition-opacity duration-500" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  {category && (
                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm font-bold text-foreground">
                      {category}
                    </span>
                  )}
                  {city && (
                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-foreground/70 backdrop-blur-sm text-background font-semibold flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {city}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-background">
                  {metric && (
                    <div className="text-2xl font-extrabold tracking-tight leading-tight">
                      {metric}
                    </div>
                  )}
                  {metricSub && (
                    <div className="text-xs opacity-80 mt-0.5">{metricSub}</div>
                  )}
                </div>
              </div>

              <div className="px-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="font-bold text-xl text-foreground"
                    data-field={`projects.${index}.title`}
                  >
                    {project.title}
                  </h3>
                  <div className="w-9 h-9 rounded-full bg-secondary text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                {quote && (
                  <p className="text-sm text-muted italic leading-relaxed">{quote}</p>
                )}
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
