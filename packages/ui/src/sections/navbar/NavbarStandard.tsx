import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import type { NavbarProps } from "./types";
import { getLinkHref, getCTAHref } from "./types";

export function NavbarStandard({
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

  return (
    <nav
      className={cn(
        "transition-all duration-300",
        variant === "transparent"
          ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
          : cn(sticky && "sticky top-0 z-50", "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"),
        className
      )}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-spacing-xs group">
            {logoIcon && <span className="text-2xl">{logoIcon}</span>}
            <span className="text-xl lg:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {logo}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-spacing-xs">
            {links.map((link, index) => {
              const href = getLinkHref(link, resolveTarget);
              return (
                <a
                  key={`${link.label}-${index}`}
                  href={href}
                  className="relative px-spacing-md py-spacing-sm text-[length:var(--nav-font-size,16px)] font-medium text-foreground/80 hover:text-foreground transition-colors group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
                </a>
              );
            })}
            {cta && (
              <Button asChild size="default" className="ml-4 !rounded-lg shadow-lg shadow-primary/25">
                <a href={getCTAHref(cta, resolveTarget)}>
                  {cta.label}
                </a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
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
                  className="px-spacing-md py-3 text-[length:var(--nav-font-size,16px)] text-foreground/80 hover:text-foreground hover:bg-primary/5 rounded-radius font-medium transition-colors"
                >
                  {link.label}
                </a>
              );
            })}
            {cta && (
              <Button asChild size="default" className="mt-spacing-md w-full !rounded-lg shadow-lg shadow-primary/25">
                <a href={getCTAHref(cta, resolveTarget)}>
                  {cta.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
