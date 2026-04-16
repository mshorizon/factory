"use client";

import { cn } from "../../lib/utils";

interface FooterGradientProps {
  businessName: string;
  links?: Array<{ label: string; href: string }>;
  columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
  tagline?: string;
  copyright?: string;
  className?: string;
}

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
    <footer className={cn("relative bg-secondary text-white border-t border-border/20", className)}>
      {/* Purple gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 pt-16 pb-8 px-spacing-container container mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-spacing-2xl">
          {/* Brand Column */}
          <div className="max-w-md">
            <span className="text-2xl font-bold mb-spacing-md flex items-center gap-2">
              <span aria-hidden="true">&#x1F426;</span>
              {businessName}
            </span>
            {tagline && (
              <p className="text-sm text-white/70 mb-spacing-lg">{tagline}</p>
            )}

            {/* Newsletter */}
            <div className="mt-spacing-lg">
              <p className="text-sm font-medium text-white mb-2">Join our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/5 border border-border/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/60"
                />
                <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Link Columns + Socials */}
          <div className="flex flex-wrap gap-spacing-2xl">
            {columns &&
              columns.filter((col) => !["Pages", "Strony"].includes(col.title)).map((column, colIndex) => (
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

            {/* Social Links as text column */}
            {socialLinks && socialLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-spacing-md">
                  Socials
                </h3>
                <ul className="space-y-spacing-xs">
                  {socialLinks.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        className="text-white/60 hover:text-white text-sm transition-colors"
                      >
                        {social.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fallback: Simple links if no columns */}
            {(!columns || columns.length === 0) && links && links.length > 0 && (
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
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-spacing-3xl pt-8 border-t border-white/10">
          <p className="text-sm text-white/60">
            {copyright || `\u00A9 ${year} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
