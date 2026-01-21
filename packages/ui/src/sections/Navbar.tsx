import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  logo: string;
  logoIcon?: React.ReactNode;
  links: NavLink[];
  cta?: {
    label: string;
    href: string;
  };
  variant?: "solid" | "transparent";
  sticky?: boolean;
  className?: string;
}

export function Navbar({
  logo,
  logoIcon,
  links,
  cta,
  variant = "solid",
  sticky = true,
  className,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            {logoIcon && <span className="text-2xl">{logoIcon}</span>}
            <span className="text-xl lg:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {logo}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm lg:text-base font-medium text-foreground/80 hover:text-foreground transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </a>
            ))}
            {cta && (
              <Button asChild size="lg" className="ml-4 shadow-lg shadow-primary/25">
                <a href={cta.href}>
                  {cta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
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
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 rounded-radius font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            {cta && (
              <Button asChild size="lg" className="mt-4 w-full shadow-lg shadow-primary/25">
                <a href={cta.href}>
                  {cta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
