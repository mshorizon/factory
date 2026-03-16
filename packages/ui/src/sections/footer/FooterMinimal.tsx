import { cn } from "../../lib/utils";
import { LanguageSwitcher } from "../../atoms/LanguageSwitcher";
import type { FooterProps } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterMinimal({
  businessName,
  links,
  copyright,
  currentLanguage,
  availableLanguages,
  className,
  resolveTarget,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-background border-t border-border", className)}>
      <div className="container mx-auto py-spacing-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-md">
          {/* Copyright */}
          <p className="text-sm text-muted">
            {copyright || `© ${year} ${businessName}`}
          </p>

          <div className="flex flex-wrap items-center gap-spacing-md">
            {/* Language Switcher */}
            {currentLanguage && (
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                tone="dark"
              />
            )}

            {/* Links */}
            {links && links.length > 0 && (
              <nav className="flex flex-wrap items-center gap-spacing-md">
                {links.map((link, index) => {
                  const href = getFooterLinkHref(link, resolveTarget);
                  return (
                    <a
                      key={`${link.label}-${index}`}
                      href={href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
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
