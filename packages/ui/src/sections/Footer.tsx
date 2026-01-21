import { cn } from "../lib/utils";
import { Button } from "../atoms/Button";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

interface FooterProps {
  businessName: string;
  links?: FooterLink[];
  socialLinks?: SocialLink[];
  copyright?: string;
  className?: string;
}

export function Footer({
  businessName,
  links,
  socialLinks,
  copyright,
  className,
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
              {links.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <a href={link.href}>{link.label}</a>
                </Button>
              ))}
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
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-white/60">
            {copyright || `© ${year} ${businessName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
