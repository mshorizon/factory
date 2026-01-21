interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  businessName: string;
  links?: FooterLink[];
  copyright?: string;
}

export function Footer({ businessName, links, copyright }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">{businessName}</span>
          {links && links.length > 0 && (
            <div className="flex gap-6">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:opacity-80 transition-opacity"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-white/20 text-center text-sm opacity-80">
          {copyright || `© ${year} ${businessName}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
