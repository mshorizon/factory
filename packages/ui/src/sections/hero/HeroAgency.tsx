"use client";

import { ArrowRight, Star, Phone, ShieldCheck, Receipt, Lock, Heart, BadgeCheck, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

interface FloatingCard {
  type: "booking" | "review" | "stats";
  title?: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  metricChange?: string;
  quote?: string;
  author?: string;
}

interface HeroAgencyProps extends HeroProps {
  floatingCards?: FloatingCard[];
  trustSignals?: { icon: string; label: string }[];
  avatarImages?: string[];
  googleRating?: { score: number; count: number; label?: string };
}

const trustIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: ShieldCheck,
  receipt: Receipt,
  lock: Lock,
  heart: Heart,
};

function renderTitle(title: string) {
  const parts = title.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <span key={i} className="text-primary italic font-heading-secondary font-medium">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function BookingCard({ card }: { card: FloatingCard }) {
  return (
    <div className="bg-background/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-foreground/5 border border-white/60 p-4 w-[260px]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-bold text-sm text-foreground">{card.title}</span>
            <span className="text-[10px] text-muted">teraz</span>
          </div>
          <div className="text-xs text-muted leading-snug">
            {card.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ card }: { card: FloatingCard }) {
  return (
    <div className="bg-background/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-foreground/5 border border-white/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white shadow-inner border border-border flex items-center justify-center">
          <span className="text-base font-bold tracking-tighter">
            <span style={{ color: "#4285F4" }}>G</span>
            <span style={{ color: "#EA4335" }}>o</span>
            <span style={{ color: "#FBBC04" }}>o</span>
            <span style={{ color: "#4285F4" }}>g</span>
            <span style={{ color: "#34A853" }}>l</span>
            <span style={{ color: "#EA4335" }}>e</span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>
          <div className="text-[11px] text-muted">
            <span className="font-bold text-foreground">{card.metric}</span> · {card.metricLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ card }: { card: FloatingCard }) {
  return (
    <div className="bg-foreground/95 text-background backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-foreground/30 sm:w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">
            {card.subtitle}
          </span>
        </div>
        {card.metricChange && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/30 text-primary font-bold">
            {card.metricChange}
          </span>
        )}
      </div>
      <div className="font-extrabold text-3xl mb-1">{card.metric}</div>
      <div className="text-xs opacity-70 mb-4">{card.metricLabel}</div>
      {card.quote && (
        <div className="flex items-center gap-2 pt-3 border-t border-background/10">
          {card.author && (
            <div className="w-7 h-7 rounded-full bg-primary/30 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {card.author.split(" ").map(w => w[0]).join("")}
            </div>
          )}
          <p className="text-xs opacity-80 leading-snug">
            &bdquo;{card.quote}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

export function HeroAgency({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  image,
  backgroundImage,
  children,
  className,
  isHomePage = false,
  floatingCards = [],
  trustSignals = [],
  avatarImages = [],
  googleRating,
}: HeroAgencyProps) {
  const heroImage = image || backgroundImage;
  const bookingCard = floatingCards.find(c => c.type === "booking");
  const reviewCard = floatingCards.find(c => c.type === "review");
  const statsCard = floatingCards.find(c => c.type === "stats");

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/30",
        isHomePage ? "pt-40 pb-20 md:pt-48 md:pb-28" : "pt-32 pb-16",
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
        <div className="lg:col-span-7">
          {badge && (
            <ScrollReveal delay={0} direction="up">
              <Badge
                variant="outline"
                className="mb-spacing-lg rounded-full pl-2 pr-4 py-1 border-primary/30 text-primary bg-primary/10 backdrop-blur-sm shadow-sm gap-2"
                data-field="header.badge"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                  PL
                </span>
                <span className="text-xs font-semibold tracking-wide">
                  {badge}
                </span>
              </Badge>
            </ScrollReveal>
          )}

          <ScrollReveal delay={0.1} direction="up">
            <h1
              className="text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold tracking-tight leading-[1.02] mb-spacing-lg text-foreground"
              data-field="header.title"
            >
              {renderTitle(title)}
            </h1>
          </ScrollReveal>

          {subtitle && (
            <ScrollReveal delay={0.2} direction="up">
              <p className="text-lg md:text-xl text-muted mb-spacing-2xl max-w-xl leading-relaxed" data-field="header.subtitle">
                {subtitle}
              </p>
            </ScrollReveal>
          )}

          {(cta || secondaryCta) && (
            <ScrollReveal delay={0.3} direction="up">
              <div className="flex flex-col sm:flex-row gap-3 mb-spacing-lg">
                {cta && (
                  <Button
                    asChild
                    size="lg"
                    variant={cta.variant || "default"}
                    className="!rounded-full h-14 px-7 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                    data-field="cta"
                  >
                    <a
                      href={cta.href}
                      className="flex items-center gap-spacing-sm"
                      onClick={() => (window as any).umami?.track("cta-click", { section: "hero", label: cta.label })}
                    >
                      <span>{cta.label}</span>
                      <ArrowRight className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {secondaryCta && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="!rounded-full h-14 px-7 text-base bg-background/60 backdrop-blur-sm border-foreground/15 hover:bg-foreground/5"
                    data-field="secondaryCta"
                  >
                    <a
                      href={secondaryCta.href}
                      className="flex items-center gap-spacing-sm"
                      onClick={() => (window as any).umami?.track("cta-click", { section: "hero-secondary", label: secondaryCta.label })}
                    >
                      <Phone className="h-4 w-4" />
                      <span>{secondaryCta.label}</span>
                    </a>
                  </Button>
                )}
              </div>
            </ScrollReveal>
          )}

          {trustSignals.length > 0 && (
            <ScrollReveal delay={0.35} direction="up">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted mb-spacing-2xl">
                {trustSignals.map((signal, i) => {
                  const Icon = trustIconMap[signal.icon] || ShieldCheck;
                  return (
                    <span key={i} className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-primary" />
                      {signal.label}
                    </span>
                  );
                })}
              </div>
            </ScrollReveal>
          )}

          {(avatarImages.length > 0 || googleRating) && (
            <ScrollReveal delay={0.4} direction="up">
              <div className="flex items-center gap-6 pt-6 border-t border-border/60">
                {avatarImages.length > 0 && (
                  <div className="flex -space-x-3">
                    {avatarImages.slice(0, 4).map((img, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-full border-[3px] border-background bg-secondary overflow-hidden shadow-sm"
                      >
                        <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {googleRating && googleRating.count > 4 && (
                      <div className="w-11 h-11 rounded-full border-[3px] border-background bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold shadow-sm">
                        +{googleRating.count}
                      </div>
                    )}
                  </div>
                )}
                {googleRating && (
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-primary mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                      <span className="ml-1.5 font-bold text-foreground">{googleRating.score} / 5</span>
                    </div>
                    <p className="text-muted">
                      <span className="font-semibold text-foreground">{googleRating.label || `${googleRating.count} opinii Google`}</span>
                      {" "}od polskich przedsiebiorcow
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          {children}
        </div>

        {heroImage && (
          <ScrollReveal delay={0.2} direction="right" distance={50} className="lg:col-span-5">
            <div className="relative h-[520px] md:h-[620px] lg:h-[720px] w-full">
              <div className="absolute inset-0 z-0 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-foreground/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent z-10 pointer-events-none" />
                <SafeImage
                  src={heroImage}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
              </div>

              {bookingCard && (
                <div className="absolute top-6 left-3 sm:left-6 z-10 animate-fade-in-down">
                  <BookingCard card={bookingCard} />
                </div>
              )}

              {reviewCard && (
                <div className="absolute top-32 right-3 sm:right-6 z-10 animate-fade-in-right">
                  <ReviewCard card={reviewCard} />
                </div>
              )}

              {statsCard && (
                <div className="absolute bottom-6 left-3 sm:left-auto sm:right-6 z-10 animate-fade-in-up">
                  <StatsCard card={statsCard} />
                </div>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
