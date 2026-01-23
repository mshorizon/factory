import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import type { NavbarProps } from "./types";

export function NavbarCentered({
  logo,
  logoIcon,
  links,
  cta,
  currentLanguage = "pl",
  variant = "solid",
  sticky = true,
  className,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    document.cookie = `lang=${langCode};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  };

  // Split links for centered layout
  const midPoint = Math.ceil(links.length / 2);
  const leftLinks = links.slice(0, midPoint);
  const rightLinks = links.slice(midPoint);

  return (
    <nav
      className={cn(
        "transition-all duration-300",
        sticky && "sticky top-0 z-50",
        variant === "transparent"
          ? "bg-transparent"
          : "bg-background/95 backdrop-blur-md shadow-sm border-b border-border",
        className
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button - Left */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>

          {/* Desktop Left Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-end">
            {leftLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm lg:text-base font-medium text-foreground/80 hover:text-foreground transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </a>
            ))}
          </div>

          {/* Centered Logo */}
          <a href="/" className="flex items-center gap-2 group mx-8">
            {logoIcon && <span className="text-3xl">{logoIcon}</span>}
            <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {logo}
            </span>
          </a>

          {/* Desktop Right Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1">
            {rightLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm lg:text-base font-medium text-foreground/80 hover:text-foreground transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </a>
            ))}
            {/* Language Switcher */}
            <div className="flex items-center ml-2 border border-border rounded-radius overflow-hidden">
              <button
                onClick={() => handleLanguageChange("pl")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  currentLanguage === "pl"
                    ? "bg-primary text-white"
                    : "bg-background text-foreground hover:bg-primary/10"
                )}
              >
                PL
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                  currentLanguage === "en"
                    ? "bg-primary text-white"
                    : "bg-background text-foreground hover:bg-primary/10"
                )}
              >
                EN
              </button>
            </div>
            {cta && (
              <Button asChild size="lg" className="ml-4 shadow-lg shadow-primary/25">
                <a href={cta.href}>
                  {cta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Mobile CTA - Right */}
          {cta && (
            <Button asChild size="sm" className="md:hidden shadow-lg shadow-primary/25">
              <a href={cta.href}>
                {cta.label}
              </a>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-96 pb-6" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-4 border-t border-border">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 rounded-radius font-medium transition-colors text-center"
              >
                {link.label}
              </a>
            ))}
            {/* Mobile Language Switcher */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant={currentLanguage === "pl" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("pl")}
                className="flex-1"
              >
                Polski
              </Button>
              <Button
                variant={currentLanguage === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("en")}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
