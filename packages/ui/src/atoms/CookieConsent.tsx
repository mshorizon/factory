"use client";

import * as React from "react";
import { Button } from "./Button";
import { cn } from "../lib/utils";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "cookie-consent";

function loadConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "shrink-0 w-10 h-6 rounded-full border transition-colors flex items-center px-0.5",
        checked
          ? "bg-primary border-primary justify-end"
          : "bg-transparent border-white/40 justify-start",
        disabled && "cursor-not-allowed opacity-50"
      )}
      aria-checked={checked}
      role="switch"
    >
      <div className="w-4 h-4 rounded-full bg-white shadow" />
    </button>
  );
}

function CookieRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-spacing-sm">
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      <div>
        <p className="font-semibold text-sm text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [hiding, setHiding] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!loadConsent()) setVisible(true);

    function handleOpen() {
      const saved = loadConsent();
      if (saved) {
        setAnalytics(saved.analytics);
        setMarketing(saved.marketing);
      }
      setHiding(false);
      setExpanded(true);
      setVisible(true);
    }

    window.addEventListener("open-cookie-consent", handleOpen);
    return () => window.removeEventListener("open-cookie-consent", handleOpen);
  }, []);

  function dismiss() {
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      setHiding(false);
      setExpanded(false);
    }, 400);
  }

  function acceptNecessary() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    dismiss();
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    dismiss();
  }

  function saveCustom() {
    saveConsent({ necessary: true, analytics, marketing });
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9997] section-bg-dark border-t border-white/10 overflow-hidden transition-[max-height,transform] duration-500 ease-in-out"
      style={{
        maxHeight: expanded ? "800px" : "200px",
        transform: hiding ? "translateY(100%)" : "translateY(0)",
      }}
    >
      <div className="container mx-auto px-spacing-container">
        {/* Main bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-spacing-md py-4 md:py-0" style={{ minHeight: "var(--spacing-section-sm)" }}>
          <p className="text-sm text-foreground flex-1 leading-relaxed">
            Używamy plików cookies, aby zapewnić prawidłowe działanie strony oraz — za Twoją zgodą — do celów analitycznych i marketingowych.
          </p>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={acceptNecessary}>
              Tylko niezbędne
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              Dostosuj
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Akceptuj wszystkie
            </Button>
          </div>
        </div>

        {/* Expandable preferences */}
        <div className="border-t border-white/10 pb-6 pt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CookieRow
              label="Niezbędne"
              description="Wymagane do prawidłowego działania strony."
              checked
              disabled
            />
            <CookieRow
              label="Analityczne"
              description="Pomagają zrozumieć, jak korzystasz ze strony."
              checked={analytics}
              onChange={() => setAnalytics((v) => !v)}
            />
            <CookieRow
              label="Marketingowe"
              description="Używane do spersonalizowanych reklam."
              checked={marketing}
              onChange={() => setMarketing((v) => !v)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={saveCustom}>
              Zapisz wybór
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Akceptuj wszystkie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
