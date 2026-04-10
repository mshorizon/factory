"use client";

import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { BlogGridProps } from "./types";

export function BlogOverlay({ posts, className }: BlogGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.12}
    >
      {posts.map((post, index) => {
        const direction = index % 2 === 0 ? "left" : "right";
        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <a href={post.href || "#"} className="block h-full group">
              <div
                className="relative overflow-hidden rounded-lg h-full min-h-[360px] md:min-h-[420px] flex flex-col justify-end"
                data-field={`blogPosts.${index}`}
              >
                {post.image && (
                  <SafeImage
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content overlay */}
                <div className="relative z-10 p-spacing-lg flex flex-col gap-spacing-sm">
                  {post.category && (
                    <span
                      className="inline-flex w-fit items-center border border-white/20 rounded-md px-2.5 py-1 text-xs font-medium text-white/80"
                      data-field={`blogPosts.${index}.category`}
                    >
                      {post.category}
                    </span>
                  )}
                  <h3
                    className="text-xl md:text-2xl font-medium text-white leading-tight"
                    data-field={`blogPosts.${index}.title`}
                  >
                    {post.title}
                  </h3>
                </div>
              </div>
            </a>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
