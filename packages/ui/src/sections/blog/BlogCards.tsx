"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { BlogGridProps } from "./types";

export function BlogCards({ posts, ctaLabel, className, withCard, columns = 3 }: BlogGridProps) {
  const label = ctaLabel || "Read more";
  const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <StaggerContainer
      className={cn(`grid ${gridCols} gap-spacing-2xl`, className)}
      staggerDelay={0.1}
    >
      {posts.map((post, index) => (
        <StaggerItem key={index} direction="up" distance={24}>
          <a
            href={post.href || "#"}
            className={cn("block group h-full", withCard && "bg-card rounded-radius overflow-hidden")}
            data-field={`blogPosts.${index}`}
          >
            {post.image && (
              <div className={cn("aspect-[4/3] overflow-hidden", withCard ? "mb-0" : "rounded-radius mb-spacing-lg")}>
                <SafeImage
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <div className={cn(withCard && "p-spacing-lg")}>
              <h3
                className="text-base font-semibold font-heading text-foreground mb-spacing-xs leading-snug"
                data-field={`blogPosts.${index}.title`}
              >
                {post.title}
              </h3>
              <p
                className="text-sm text-muted leading-relaxed mb-spacing-md"
                data-field={`blogPosts.${index}.description`}
              >
                {post.description}
              </p>
              <span
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-1.5 transition-all"
              >
                {label}
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
