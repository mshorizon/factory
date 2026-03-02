import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { LanguageSwitcher } from "../../atoms/LanguageSwitcher";
import type { FooterProps, Link } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterBranded({
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
    <footer className={cn("bg-secondary text-white relative overflow-hidden", className)}>
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

      <div className="container mx-auto py-16">
        {/* Top Section - Brand */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">
          <div>
            <span className="font-bold text-4xl tracking-tight block mb-2">
              {businessName}
            </span>
            {tagline && (
              <p className="text-white/70 text-lg max-w-md">
                {tagline}
              </p>
            )}
          </div>

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <Button
                  key={social.href}
                  asChild
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white hover:text-secondary rounded-full"
                >
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Primary accent divider */}
        <div className="h-px bg-gradient-to-r from-primary/50 via-primary to-primary/50 mb-12" />

        {/* Columns */}
        {columns && columns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
            {columns.map((column, colIndex) => (
              <div key={colIndex}>
                <h3 className="font-semibold text-white mb-4 text-lg">{column.title}</h3>
                <ul className="space-y-3">
                  {(column.links || []).map((link: Link, linkIndex: number) => {
                    const href = getFooterLinkHref(link, resolveTarget);
                    return (
                      <li key={`${link.label}-${linkIndex}`}>
                        <a
                          href={href}
                          className="text-white/70 hover:text-primary text-sm transition-colors"
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
        )}

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            {copyright || `© ${year} ${businessName}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-6">
            {currentLanguage && (
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                tone="light"
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
                      className="text-white/60 hover:text-white text-sm transition-colors"
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
    </footer>
  );
}
