import type { ReactNode } from "react";

interface CTAButton {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
}

interface HeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  cta?: CTAButton;
  secondaryCta?: CTAButton;
  backgroundImage?: string;
  overlay?: boolean;
  align?: "left" | "center" | "right";
  fullHeight?: boolean;
  children?: ReactNode;
}

export function Hero({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  backgroundImage,
  overlay = true,
  align = "center",
  fullHeight = false,
  children,
}: HeroProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  const buttonStyles = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-secondary text-white hover:opacity-90",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  };

  return (
    <section
      className={`relative bg-background ${fullHeight ? "min-h-screen" : "py-16 md:py-24"}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {backgroundImage && overlay && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className={`relative container mx-auto px-4 flex flex-col justify-center ${alignmentClasses[align]} ${fullHeight ? "min-h-screen py-16" : ""}`}>
        {badge && (
          <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium mb-4">
            {badge}
          </span>
        )}
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${backgroundImage ? "text-white" : "text-foreground"}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-lg md:text-xl max-w-2xl mb-8 ${backgroundImage ? "text-white/90" : "text-muted"} ${align === "center" ? "mx-auto" : ""}`}>
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
          <div className={`flex flex-wrap gap-4 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`}>
            {cta && (
              <a
                href={cta.href}
                className={`inline-block px-6 py-3 rounded-radius font-medium transition-all ${buttonStyles[cta.variant || "primary"]}`}
              >
                {cta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className={`inline-block px-6 py-3 rounded-radius font-medium transition-all ${buttonStyles[secondaryCta.variant || "outline"]}`}
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
