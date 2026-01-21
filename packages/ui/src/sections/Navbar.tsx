import { useState } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  logo: string;
  logoIcon?: string;
  links: NavLink[];
  cta?: {
    label: string;
    href: string;
  };
  variant?: "solid" | "transparent";
  sticky?: boolean;
}

export function Navbar({
  logo,
  logoIcon,
  links,
  cta,
  variant = "solid",
  sticky = true,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navBackground = variant === "transparent"
    ? "bg-transparent"
    : "bg-background/95 backdrop-blur-md shadow-sm";

  return (
    <nav className={`${sticky ? "sticky top-0 z-50" : ""} ${navBackground} transition-all duration-300`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            {logoIcon && (
              <span className="text-2xl">{logoIcon}</span>
            )}
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
              <a
                href={cta.href}
                className="ml-4 inline-flex items-center gap-2 bg-primary text-white px-5 lg:px-6 py-2.5 rounded-radius font-semibold text-sm lg:text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                {cta.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 pb-6" : "max-h-0"}`}>
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
              <a
                href={cta.href}
                className="mt-4 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-radius font-semibold shadow-lg shadow-primary/25"
              >
                {cta.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
