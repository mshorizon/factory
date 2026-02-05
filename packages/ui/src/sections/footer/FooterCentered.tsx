import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { LanguageSwitcher } from "../../atoms/LanguageSwitcher";
import type { FooterProps } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterCentered({
  businessName,
  links,
  socialLinks,
  copyright,
  tagline,
  currentLanguage,
  availableLanguages,
  className,
  resolveTarget,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-secondary text-white", className)}>
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          {/* Brand */}
          <span className="font-bold text-3xl tracking-tight mb-4">
            {businessName}
          </span>

          {/* Tagline */}
          {tagline && (
            <p className="text-white/70 text-lg max-w-md mb-8">
              {tagline}
            </p>
          )}

          {/* Navigation Links */}
          {links && links.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-2 mb-8">
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
            <div className="flex gap-3 mb-8">
              {socialLinks.map((social) => (
                <Button
                  key={social.href}
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="w-24 h-px bg-white/20 mb-8" />

          {/* Language Switcher */}
          {currentLanguage && (
            <div className="mb-4">
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                tone="light"
              />
            </div>
          )}

          {/* Copyright */}
          <p className="text-sm text-white/60">
            {copyright || `© ${year} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
