"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";

interface ProjectHorizontalProps {
  projects: Array<{
    title: string;
    description: string;
    image?: string;
    metrics?: string[];
  }>;
  className?: string;
}

export function ProjectHorizontal({ projects, className }: ProjectHorizontalProps) {
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
          "flex gap-spacing-lg overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{ scrollBehavior: isDragging ? "auto" : "smooth", scrollSnapType: "x mandatory" }}
      >
        {projects.map((project, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0 select-none"
            style={{ scrollSnapAlign: "start" }}
          >
            <div
              className="flex flex-row border-0 rounded-none overflow-hidden h-full gap-[60px]"
              data-field={`projects.${index}`}
            >
              {/* Image Left */}
              {project.image && (
                <div className="flex-shrink-0">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-[450px] h-[450px] object-cover flex-shrink-0 rounded-lg"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                </div>
              )}

              {/* Content Right */}
              <div
                className={cn(
                  "p-spacing-xl flex flex-col justify-center select-none",
                  project.image ? "flex-1" : "w-full"
                )}
              >
                <h3
                  className="text-2xl font-bold text-foreground"
                  data-field={`projects.${index}.title`}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm text-muted mt-spacing-sm leading-relaxed"
                  data-field={`projects.${index}.description`}
                >
                  {project.description}
                </p>

                {/* Metric list */}
                {project.metrics && project.metrics.length > 0 && (
                  <ul className="space-y-1.5 mt-spacing-md">
                    {project.metrics.map((metric, mIdx) => (
                      <li key={mIdx} className="flex items-center gap-2 text-sm text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                        {metric}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drag hint with arrow navigation */}
      <ScrollReveal delay={0.3} direction="up">
        <div className="flex items-center justify-center gap-2 mt-spacing-2xl">
          <button
            type="button"
            aria-label="Previous project"
            onClick={() => {
              if (!scrollRef.current) return;
              const cardWidth = scrollRef.current.offsetWidth;
              scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
            }}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <svg
              className="w-4 h-4 text-muted animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Drag to explore
          </span>
          <button
            type="button"
            aria-label="Next project"
            onClick={() => {
              if (!scrollRef.current) return;
              const cardWidth = scrollRef.current.offsetWidth;
              scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
            }}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <svg
              className="w-4 h-4 text-muted animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
}
