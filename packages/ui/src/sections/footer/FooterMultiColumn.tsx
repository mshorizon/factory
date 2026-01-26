import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import type { FooterProps, FooterLinkCompat } from "./types";
import { getFooterLinkHref } from "./types";

export function FooterMultiColumn({
  businessName,
  links,
  socialLinks,
  copyright,
  tagline,
  columns,
  className,
  resolveTarget,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-secondary text-white", className)}>
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <span className="font-bold text-2xl tracking-tight block mb-4">
              {businessName}
            </span>
            {tagline && (
              <p className="text-white/70 text-sm leading-relaxed">
                {tagline}
              </p>
            )}
            {/* Social Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-2 mt-6">
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

          {/* Link Columns */}
          {columns && columns.map((column, colIndex) => (
            <div key={colIndex}>
              <h3 className="font-semibold text-white mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link: FooterLinkCompat, linkIndex: number) => {
                  const href = getFooterLinkHref(link, resolveTarget);
                  return (
                    <li key={`${link.label}-${linkIndex}`}>
                      <a
                        href={href}
                        className="text-white/70 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Fallback: Simple links if no columns defined */}
          {(!columns || columns.length === 0) && links && links.length > 0 && (
            <div className="lg:col-span-3">
              <nav className="flex flex-wrap gap-4">
                {links.map((link, index) => {
                  const href = getFooterLinkHref(link, resolveTarget);
                  return (
                    <a
                      key={`${link.label}-${index}`}
                      href={href}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            {copyright || `© ${year} ${businessName}. All rights reserved.`}
          </p>
          {/* Legal Links */}
          {links && links.length > 0 && columns && columns.length > 0 && (
            <nav className="flex gap-4">
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
    </footer>
  );
}
