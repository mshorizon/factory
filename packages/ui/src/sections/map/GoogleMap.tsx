"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { Badge } from "../../atoms/Badge";
import type { GoogleMapProps } from "./types";

export function GoogleMap({
  latitude,
  longitude,
  width = 1136,
  height = 500,
  zoom = 15,
  badge,
  title,
  subtitle,
  className,
}: GoogleMapProps) {
  // Google Maps Embed URL
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;

  return (
    <div className={cn("w-full max-w-6xl mx-auto px-spacing-md", className)}>
      {/* Header section */}
      {(badge || title || subtitle) && (
        <ScrollReveal delay={0.1} direction="up" distance={20}>
          <div className="mb-spacing-2xl text-center">
            {badge && (
              <div className="flex items-center justify-center gap-spacing-sm mb-spacing-md">
                <span className="w-12 h-[2px]" style={{ backgroundColor: "var(--primary-dark)" }} />
                <Badge variant="accent" style={{ color: "var(--primary-dark)" }}>
                  {badge}
                </Badge>
                <span className="w-12 h-[2px]" style={{ backgroundColor: "var(--primary-dark)" }} />
              </div>
            )}

            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-spacing-md">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="text-muted text-lg max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Map */}
      <ScrollReveal delay={0.2} direction="up" distance={30}>
        <div
          className="relative overflow-hidden rounded-radius-secondary"
          style={{
            width: '100%',
            maxWidth: `${width}px`,
            margin: '0 auto'
          }}
        >
          <iframe
            src={mapUrl}
            width="100%"
            height={height}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Business Location"
          />
        </div>
      </ScrollReveal>
    </div>
  );
}
