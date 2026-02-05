import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { LanguageSwitcher } from "../../atoms/LanguageSwitcher";
import type { FooterProps, FooterLinkCompat } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterStacked({
  businessName,
  links,
  socialLinks,
  copyright,
  tagline,
  columns,
  currentLanguage,
  availableLanguages,
  className,
  resolveTarget,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-background", className)}>
      {/* Top Section - Brand */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="font-bold text-2xl text-foreground tracking-tight block">
                {businessName}
              </span>
              {tagline && (
                <p className="text-muted mt-2 max-w-md">
                  {tagline}
                </p>
              )}
            </div>

            {/* Social Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <Button
                    key={social.href}
                    asChild
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <a href={social.href} aria-label={social.label}>
                      {social.icon}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section - Column Links */}
      {columns && columns.length > 0 && (
        <div className="border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="text-center">
                  <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {column.links.map((link: FooterLinkCompat, linkIndex: number) => {
                      const href = getFooterLinkHref(link, resolveTarget);
                      return (
                        <li key={`${link.label}-${linkIndex}`}>
                          <a
                            href={href}
                            className="text-muted hover:text-primary text-sm transition-colors"
                          >
                            {link.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section - Copyright & Legal */}
      <div className="border-t border-border bg-primary/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {copyright || `© ${year} ${businessName}. All rights reserved.`}
            </p>
            <div className="flex items-center gap-6">
              {currentLanguage && (
                <LanguageSwitcher
                  currentLanguage={currentLanguage}
                  availableLanguages={availableLanguages}
                  tone="dark"
                />
              )}
              {links && links.length > 0 && (
                <nav className="flex gap-6">
                  {links.map((link, index) => {
                    const href = getFooterLinkHref(link, resolveTarget);
                    return (
                      <a
                        key={`legal-${link.label}-${index}`}
                        href={href}
                        className="text-muted hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
