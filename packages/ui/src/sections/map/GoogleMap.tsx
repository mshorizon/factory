"use client";

import { ExternalLink, Navigation } from "lucide-react";
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
  badgeVariant = "accent",
  badgeLayout = "row",
  businessName,
  address,
  openInMapsLabel = "Otwórz w Mapach Google",
  directionsLabel = "Trasa do",
}: GoogleMapProps) {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;

  const destinationQuery = address
    ? encodeURIComponent(address)
    : `${latitude},${longitude}`;
  const openMapsHref = `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;

  const showPanel = Boolean(businessName || address);

  return (
    <div className={cn("w-full max-w-6xl mx-auto px-spacing-md", className)}>
      {/* Header section */}
      {(badge || title || subtitle) && (
        <ScrollReveal delay={0.1} direction="up" distance={20}>
          <div className="mb-spacing-2xl text-center">
            {badge && (
              <div className={cn(
                "flex gap-spacing-sm mb-spacing-md",
                badgeLayout === "column"
                  ? "flex-col items-center"
                  : "flex-row items-center justify-center"
              )}>
                {badgeVariant !== "text" && (
                  <span
                    className={badgeLayout === "column" ? "w-8 h-[2px]" : "w-12 h-[2px]"}
                    style={{ backgroundColor: "var(--primary-dark)" }}
                  />
                )}
                <Badge
                  variant={badgeVariant === "text" ? "text" : "accent"}
                  style={{ color: "var(--primary-dark)" }}
                >
                  {badge}
                </Badge>
                {badgeVariant !== "text" && badgeLayout !== "column" && (
                  <span className="w-12 h-[2px]" style={{ backgroundColor: "var(--primary-dark)" }} />
                )}
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
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Business Location"
          />

          {showPanel && (
            <div className="absolute top-spacing-md left-spacing-md max-w-xs sm:max-w-sm bg-white rounded-radius shadow-lg p-spacing-md border border-black/5">
              {businessName && (
                <div className="text-sm font-semibold text-foreground leading-tight mb-spacing-xs">
                  {businessName}
                </div>
              )}
              {address && (
                <div className="text-xs text-muted leading-snug mb-spacing-sm">
                  {address}
                </div>
              )}
              <div className="flex flex-row gap-spacing-xs mt-spacing-xs">
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={directionsLabel}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Navigation className="w-4 h-4" />
                </a>
                <a
                  href={openMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={openInMapsLabel}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:opacity-90 transition-opacity shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
