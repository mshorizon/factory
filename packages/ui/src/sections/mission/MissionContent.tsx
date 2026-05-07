"use client";

import { ScrollReveal } from "../../animations/ScrollReveal";

export interface MissionContentProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  items?: Array<{ title?: string; label?: string }>;
  image?: string;
}

export function MissionContent({ badge, title, subtitle, items = [], image }: MissionContentProps) {
  return (
    <div className="grid md:grid-cols-2 gap-spacing-2xl items-center">
      {/* Left: text content */}
      <ScrollReveal direction="left" distance={30} delay={0}>
        <div>
          {badge && (
            <div className="flex items-center gap-spacing-sm mb-spacing-lg">
              <span className="w-10 h-[2px] bg-primary block" />
              <span
                className="text-primary text-base font-medium uppercase tracking-wide"
                data-field="header.badge"
              >
                {badge}
              </span>
            </div>
          )}

          {title && (
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading uppercase leading-tight mb-spacing-lg text-foreground"
              data-field="header.title"
            >
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="text-muted leading-relaxed mb-spacing-xl" data-field="header.subtitle">
              {subtitle}
            </p>
          )}

          {items.length > 0 && (
            <ul className="flex flex-col gap-spacing-md">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-spacing-md" data-field={`items.${i}.title`}>
                  <svg
                    className="w-5 h-5 flex-shrink-0 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold text-foreground">{item.title || item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollReveal>

      {/* Right: image with decorative dots */}
      {image && (
        <ScrollReveal direction="right" distance={30} delay={0.15}>
          <div className="relative w-full h-[448px]">
            <div
              className="absolute top-[26px] -left-[46px] w-[36px] h-[216px] opacity-15 pointer-events-none text-foreground"
              aria-hidden="true"
              style={{
                backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                backgroundSize: "18px 18px",
              }}
            />
            <div
              className="absolute bottom-[26px] -right-[46px] w-[36px] h-[144px] opacity-15 pointer-events-none text-foreground"
              aria-hidden="true"
              style={{
                backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                backgroundSize: "18px 18px",
              }}
            />
            <img
              src={image}
              alt={title || ""}
              className="w-full h-full rounded-2xl object-cover shadow-xl relative z-10"
              loading="lazy"
              decoding="async"
              data-field="image"
            />
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
