"use client";

import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";

interface FooterGradientProps {
  businessName: string;
  links?: Array<{ label: string; href: string }>;
  columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
  tagline?: string;
  copyright?: string;
  className?: string;
}

const socialIconMap: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  linkedin: "IN",
  twitter: "X",
  youtube: "YT",
  tiktok: "TK",
};

export function FooterGradient({
  businessName,
  links,
  columns,
  socialLinks,
  tagline,
  copyright,
  className,
}: FooterGradientProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("relative bg-secondary text-white", className)}>
      {/* Purple gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 py-16 px-spacing-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-spacing-2xl">
          {/* Brand Column */}
          <div>
            <span className="text-2xl font-bold mb-spacing-md block">
              {businessName}
            </span>
            {tagline && (
              <p className="text-sm text-white/60 mb-spacing-lg">{tagline}</p>
            )}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-spacing-xs">
                {socialLinks.map((social) => (
                  <Button
                    key={social.url}
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <a href={social.url} aria-label={social.platform}>
                      <span className="text-xs font-bold">
                        {socialIconMap[social.platform.toLowerCase()] || social.platform.slice(0, 2).toUpperCase()}
                      </span>
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns &&
            columns.map((column, colIndex) => (
              <div key={colIndex}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-spacing-md">
                  {column.title}
                </h3>
                <ul className="space-y-spacing-xs">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* Fallback: Simple links if no columns */}
          {(!columns || columns.length === 0) && links && links.length > 0 && (
            <div className="lg:col-span-3">
              <nav className="flex flex-wrap gap-spacing-md">
                {links.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-spacing-3xl pt-8 border-t border-white/10">
          <p className="text-sm text-white/40">
            {copyright || `\u00A9 ${year} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
