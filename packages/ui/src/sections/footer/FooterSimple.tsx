import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { LanguageSwitcher } from "../../atoms/LanguageSwitcher";
import type { FooterProps } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterSimple({
  businessName,
  links,
  socialLinks,
  copyright,
  currentLanguage,
  availableLanguages,
  className,
  resolveTarget,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-secondary text-white", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-xl tracking-tight">{businessName}</span>
          </div>

          {/* Navigation Links */}
          {links && links.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-2">
              {links.map((link, index) => {
                const href = getFooterLinkHref(link, resolveTarget);
                return (
                  <Button
                    key={`${link.label}-${index}`}
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <a href={href}>{link.label}</a>
                  </Button>
                );
              })}
            </nav>
          )}

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.href}
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Divider & Copyright */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            {copyright || `© ${year} ${businessName}. All rights reserved.`}
          </p>
          {currentLanguage && (
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              availableLanguages={availableLanguages}
              tone="light"
            />
          )}
        </div>
      </div>
    </footer>
  );
}
