import { cn } from "../lib/utils";
import type { LanguageOption } from "../lib/languages";
import { DEFAULT_LANGUAGES } from "../lib/languages";

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages?: LanguageOption[];
  tone?: "light" | "dark";
}

export function LanguageSwitcher({
  currentLanguage,
  availableLanguages = DEFAULT_LANGUAGES,
  tone = "light",
}: LanguageSwitcherProps) {
  const handleLanguageChange = (langCode: string) => {
    document.cookie = `lang=${langCode};path=/;max-age=31536000;SameSite=Lax`;
    window.location.href = window.location.pathname;
  };

  return (
    <div className="flex items-center gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "shrink-0",
          tone === "light" ? "text-white/40" : "text-foreground/40"
        )}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      {availableLanguages.map((lang, i) => (
        <span key={lang.code} className="flex items-center gap-1.5">
          {i > 0 && (
            <span
              className={cn(
                "text-[10px] select-none",
                tone === "light" ? "text-white/20" : "text-foreground/20"
              )}
            >
              /
            </span>
          )}
          <button
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "text-xs transition-colors",
              currentLanguage === lang.code
                ? tone === "light"
                  ? "text-white font-medium"
                  : "text-foreground font-medium"
                : tone === "light"
                  ? "text-white/40 hover:text-white/70"
                  : "text-foreground/40 hover:text-foreground/70"
            )}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
