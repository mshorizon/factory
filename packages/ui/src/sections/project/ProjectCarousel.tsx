"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ProjectCarouselProps } from "./types";

export function ProjectCarousel({ projects, className }: ProjectCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Gradient edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-spacing-lg overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
      >
        {projects.map((project, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[85vw] md:w-[440px] lg:w-[480px] snap-center"
          >
            <Card
              className="h-full overflow-hidden !rounded-[1.25rem] border-border/50"
              data-field={`projects.${index}`}
            >
              {project.image && (
                <div className="aspect-[16/10] overflow-hidden">
                  <SafeImage
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-spacing-xl space-y-4">
                <h3
                  className="text-lg font-semibold font-heading text-foreground"
                  data-field={`projects.${index}.title`}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm text-muted leading-relaxed"
                  data-field={`projects.${index}.description`}
                >
                  {project.description}
                </p>

                {/* Metric badges */}
                {project.metrics && project.metrics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.metrics.map((metric, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Drag hint */}
      <ScrollReveal delay={0.3} direction="up">
        <div className="flex items-center justify-center gap-2 mt-spacing-lg">
          <svg className="w-4 h-4 text-muted animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Drag to explore
          </span>
          <svg className="w-4 h-4 text-muted animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </ScrollReveal>
    </div>
  );
}
