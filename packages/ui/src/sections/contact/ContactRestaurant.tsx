"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Clock, Instagram, Facebook, Link2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ContactRestaurantProps, ContactSocialLink } from "./types";

// Polish weekday name → JS getDay() index (Sunday = 0).
const PL_DAYS: Record<string, number> = {
  niedziela: 0,
  poniedziałek: 1,
  wtorek: 2,
  środa: 3,
  czwartek: 4,
  piątek: 5,
  sobota: 6,
};

const DASH = /\s*[–—-]\s*/; // en dash, em dash or hyphen

/** Split an "Day(s) — Hours" string into its label and value parts (em dash separator). */
function splitHoursRow(row: string): { label: string; value: string } {
  const parts = row.split(/\s*—\s*/);
  if (parts.length < 2) return { label: row.trim(), value: "" };
  return { label: parts[0].trim(), value: parts.slice(1).join(" — ").trim() };
}

/** Whether the given weekday index falls within a row label like "Piątek – Sobota". */
function labelMatchesToday(label: string, today: number): boolean {
  const idxs = label
    .split(DASH)
    .map((t) => PL_DAYS[t.trim().toLowerCase()])
    .filter((x): x is number => x !== undefined);
  if (idxs.length === 0) return false;
  if (idxs.length === 1) return idxs[0] === today;
  const [start, end] = idxs;
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

function handleFromUrl(url: string): string {
  return url.replace(/\/+$/, "").split("/").pop() || url;
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "instagram") return <Instagram className="h-6 w-6" />;
  if (p === "facebook") return <Facebook className="h-6 w-6" />;
  return <Link2 className="h-6 w-6" />;
}

export function ContactRestaurant({
  badge,
  title,
  subtitle,
  info,
  socials = [],
  ctaLabel,
  ctaHref,
  labels,
  className,
}: ContactRestaurantProps) {
  // Resolve the highlighted (current) day after mount to avoid SSR/client mismatch.
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    setToday(new Date().getDay());
  }, []);

  // Address: "Restauracja Nostrano, ul. Janusza Korczaka 46, 08-400 Garwolin"
  // → name (bold) + address lines (muted).
  const addressParts = (info?.address || "").split(",").map((s) => s.trim()).filter(Boolean);
  const addressName = addressParts[0] || "";
  const addressLines = addressParts.slice(1);
  // Prefer an explicit Google place query so the embed resolves to the business
  // listing (with reviews/opinions) rather than a plain address pin.
  const mapQuery = info?.googlePlaceQuery
    ? info.googlePlaceQuery
    : addressLines.length
      ? addressLines.join(", ")
      : info?.address || "";
  const mapSrc = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`
    : null;

  const hoursRows = (info?.hoursDetailed ?? []).map(splitHoursRow);

  const socialLabel = (s: ContactSocialLink): string => {
    if (s.label) return s.label;
    const p = s.platform.toLowerCase();
    if (p === "instagram") return `@${handleFromUrl(s.url)}`;
    if (p === "facebook") return addressName || handleFromUrl(s.url);
    return handleFromUrl(s.url);
  };

  const contactHeading = labels?.contactHeading || "Kontakt";
  const socialHeading = labels?.socialHeading || "Social Media";
  const showOnMap = labels?.showOnMap || "Pokaż na mapie";
  const hoursTitle = info?.hours || "Godziny otwarcia";

  return (
    <div className={cn("max-w-6xl mx-auto", className)}>
      {/* Header */}
      {(badge || title || subtitle) && (
        <div className="text-center mb-spacing-3xl">
          {badge && (
            <div className="mb-spacing-md">
              <span
                className="text-sm font-medium uppercase tracking-[0.2em] text-primary"
                data-field="header.badge"
              >
                {badge}
              </span>
            </div>
          )}
          {title && (
            <h2
              className="font-heading text-4xl lg:text-5xl text-foreground leading-tight mb-spacing-md"
              data-field="header.title"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="text-muted text-lg leading-relaxed max-w-xl mx-auto"
              data-field="header.subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Two columns: contact info + opening hours */}
      <div className="grid lg:grid-cols-2 gap-spacing-2xl lg:gap-spacing-3xl items-start mb-spacing-2xl [&>*]:min-w-0">
        {/* Left: contact + social */}
        <ScrollReveal delay={0.1} direction="up" distance={20}>
          <div>
            <h3 className="font-heading text-2xl text-foreground mb-spacing-lg pb-spacing-sm border-b border-border/40">{contactHeading}</h3>

            {/* Address */}
            {info?.address && (
              <div className="flex items-start gap-spacing-sm mb-spacing-lg">
                <span className="flex shrink-0 mt-0.5 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="flex flex-col">
                  {addressName && <span className="text-foreground font-medium">{addressName}</span>}
                  {addressLines.map((line) => (
                    <span key={line} className="text-muted text-sm leading-relaxed">
                      {line}
                    </span>
                  ))}
                  {mapSrc && (
                    <a
                      href="#contact-map"
                      className="mt-spacing-xs text-sm text-primary hover:underline w-fit"
                    >
                      {showOnMap} →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {info?.phone && (
              <div className="flex items-center gap-spacing-sm mb-spacing-2xl">
                <span className="flex shrink-0 text-primary">
                  <Phone className="h-5 w-5" />
                </span>
                <a
                  href={`tel:${info.phone.replace(/\s/g, "")}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {info.phone}
                </a>
              </div>
            )}

            {/* Social media */}
            {socials.length > 0 && (
              <>
                <h3 className="font-heading text-2xl text-foreground mb-spacing-lg pb-spacing-sm border-b border-border/40">{socialHeading}</h3>
                <div className="flex flex-col gap-spacing-md">
                  {socials.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-spacing-sm text-muted hover:text-primary transition-colors w-fit"
                    >
                      <SocialIcon platform={s.platform} />
                      <span className="text-sm">{socialLabel(s)}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollReveal>

        {/* Right: opening hours card */}
        <ScrollReveal delay={0.2} direction="up" distance={20}>
          <div className="relative bg-card p-spacing-xl lg:p-spacing-2xl overflow-hidden">
            {/* Italian-flag top accent (falls back to primary if no flag set) */}
            <span
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: "var(--nav-logo-flag, var(--primary))" }}
            />

            <div className="flex items-center gap-spacing-sm mb-spacing-lg pb-spacing-sm border-b border-border/40">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-xl text-foreground">{hoursTitle}</h3>
            </div>

            {hoursRows.length > 0 && (
              <div className="flex flex-col mb-spacing-xl">
                {hoursRows.map(({ label, value }) => {
                  const isToday = today !== null && labelMatchesToday(label, today);
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between py-spacing-sm border-b border-border/40 last:border-0"
                    >
                      <span className={cn("text-sm", isToday ? "text-primary font-medium" : "text-muted")}>
                        {label}
                      </span>
                      <span className={cn("text-sm", isToday ? "text-primary font-medium" : "text-foreground")}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {ctaLabel && ctaHref && (
              <Button asChild size="lg" className="w-full uppercase [letter-spacing:var(--btn-letter-spacing,0.025em)] whitespace-normal h-auto min-h-12 py-spacing-sm text-center">
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Full-width map */}
      {mapSrc && (
        <ScrollReveal delay={0.1} direction="up" distance={30}>
          <div id="contact-map" className="relative overflow-hidden scroll-mt-24">
            <span
              className="absolute top-0 left-0 right-0 h-1 z-10"
              style={{ background: "var(--nav-logo-flag, var(--primary))" }}
            />
            <iframe
              src={mapSrc}
              width="100%"
              height={460}
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={addressName || "Location"}
            />
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
