"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ServicesProps } from "./types";

function ImageReveal({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("translate-y-8", "opacity-0");
          el.classList.add("translate-y-0", "opacity-100");
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className="translate-y-8 opacity-0 transition-all duration-700 ease-out relative"
    >
      <SafeImage
        src={src}
        alt={alt}
        className="w-full max-w-[350px] h-[300px] object-cover rounded-md"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </div>
  );
}

export function ServicesAlternating({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <div className={cn("flex flex-col gap-y-[100px]", className)}>
      {items.map((item, index) => {
        const isEven = index % 2 === 1;

        return (
          <ScrollReveal
            key={index}
            delay={0}
            direction="up"
          >
            <div
              className="grid md:grid-cols-2 gap-20 items-center"
              data-field={`items.${index}`}
            >
              {/* Image side */}
              <div className={cn(isEven && "md:order-2")}>
                <div className="bg-[#0A0A0A] p-[30px_30px_0] sm:p-[50px_50px_0] rounded-lg overflow-hidden">
                  {item.image ? (
                    <ImageReveal src={item.image} alt={item.title} />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-muted/20 rounded-md" />
                  )}
                </div>
              </div>

              {/* Text side */}
              <div className={cn(isEven && "md:order-1")}>
                <div className="flex flex-col gap-spacing-md">
                  <span
                    className="inline-flex items-center self-start border border-border/30 rounded-md px-3 py-1.5 text-sm font-medium text-muted"
                    data-field={`items.${index}.badge`}
                  >
                    {item.title}
                  </span>

                  <a href={`/services/${item.slug || item.id}`}>
                    <h3
                      className="text-2xl font-semibold text-foreground"
                      data-field={`items.${index}.title`}
                    >
                      {item.title}
                    </h3>
                  </a>

                  <p
                    className="text-base text-muted leading-relaxed"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-spacing-sm">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex px-3 py-1.5 text-sm border border-border/30 rounded-md text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
