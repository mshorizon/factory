import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import type { NavbarProps } from "./types";
import { getLinkHref, getCTAHref } from "./types";

export function NavbarCentered({
  logo,
  logoIcon,
  links,
  cta,
  variant = "solid",
  sticky = true,
  className,
  resolveTarget,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Desktop Left Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-end">
            {leftLinks.map((link, index) => {
              const href = getLinkHref(link, resolveTarget);
              return (
                <a
                  key={`left-${link.label}-${index}`}
                  href={href}
                  className="relative px-4 py-2 text-sm lg:text-base font-medium text-foreground/80 hover:text-foreground transition-colors group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
                </a>
              );
            })}
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
            {rightLinks.map((link, index) => {
              const href = getLinkHref(link, resolveTarget);
              return (
                <a
                  key={`right-${link.label}-${index}`}
                  href={href}
                  className="relative px-4 py-2 text-sm lg:text-base font-medium text-foreground/80 hover:text-foreground transition-colors group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
                </a>
              );
            })}
            {cta && (
              <Button asChild size="lg" className="ml-4 shadow-lg shadow-primary/25">
                <a href={getCTAHref(cta, resolveTarget)}>
                  {cta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Mobile Cart, CTA & Menu Button - Right */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            {cta && (
              <Button asChild size="sm" className="shadow-lg shadow-primary/25">
                <a href={getCTAHref(cta, resolveTarget)}>
                  {cta.label}
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-96 pb-6" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-4 border-t border-border">
            {links.map((link, index) => {
              const href = getLinkHref(link, resolveTarget);
              return (
                <a
                  key={`mobile-${link.label}-${index}`}
                  href={href}
                  className="px-4 py-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 rounded-radius font-medium transition-colors text-center"
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
