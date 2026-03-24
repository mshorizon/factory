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
        "shrink-0 w-10 h-6 rounded-radius-full transition-colors flex items-center px-0.5",
        checked ? "bg-primary justify-end" : "bg-muted/40 justify-start",
        disabled && "cursor-not-allowed opacity-60"
      )}
      aria-checked={checked}
      role="switch"
    >
      <div className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  );
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!loadConsent()) setVisible(true);
  }, []);

  function acceptNecessary() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
    setExpanded(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
    setExpanded(false);
  }

  function saveCustom() {
    saveConsent({ necessary: true, analytics, marketing });
    setVisible(false);
    setExpanded(false);
  }

  function toggleExpanded() {
    setExpanded((v) => !v);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9997] section-bg-dark border-t border-white/10 overflow-hidden transition-[max-height] duration-500 ease-in-out"
      style={{
        maxHeight: expanded ? "600px" : "var(--spacing-section-sm)",
      }}
    >
      {/* Main bar — fixed height, always visible */}
      <div
        className="flex items-center gap-spacing-md px-spacing-container"
        style={{ height: "var(--spacing-section-sm)" }}
      >
        <p className="text-sm text-foreground flex-1 leading-relaxed hidden md:block">
          Używamy plików cookies, aby zapewnić prawidłowe działanie strony oraz — za Twoją zgodą —
          do celów analitycznych i marketingowych.
        </p>
        <p className="text-sm text-foreground flex-1 leading-relaxed md:hidden">
          Używamy plików cookies.
        </p>
        <div className="flex flex-wrap gap-spacing-sm shrink-0">
          <Button variant="outline" size="sm" onClick={acceptNecessary}>
            Tylko niezbędne
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleExpanded}>
            Dostosuj
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Akceptuj wszystkie
          </Button>
        </div>
      </div>

      {/* Expandable preferences form */}
      <div className="px-spacing-container pb-spacing-xl border-t border-white/10">
        <h3 className="text-sm font-semibold text-foreground pt-spacing-lg pb-spacing-md">
          Ustawienia plików cookies
        </h3>
        <div className="flex flex-col gap-spacing-md">
          {/* Necessary */}
          <div className="flex items-start justify-between gap-spacing-md">
            <div>
              <p className="font-semibold text-sm text-foreground">Niezbędne</p>
              <p className="text-xs text-muted mt-0.5">
                Wymagane do prawidłowego działania strony. Nie można wyłączyć.
              </p>
            </div>
            <Toggle checked disabled />
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between gap-spacing-md">
            <div>
              <p className="font-semibold text-sm text-foreground">Analityczne</p>
              <p className="text-xs text-muted mt-0.5">
                Pomagają nam zrozumieć, jak odwiedzający korzystają ze strony.
              </p>
            </div>
            <Toggle checked={analytics} onChange={() => setAnalytics((v) => !v)} />
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-spacing-md">
            <div>
              <p className="font-semibold text-sm text-foreground">Marketingowe</p>
              <p className="text-xs text-muted mt-0.5">
                Używane do wyświetlania spersonalizowanych reklam.
              </p>
            </div>
            <Toggle checked={marketing} onChange={() => setMarketing((v) => !v)} />
          </div>
        </div>

        <div className="flex gap-spacing-sm mt-spacing-lg">
          <Button variant="outline" size="sm" onClick={saveCustom}>
            Zapisz wybór
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Akceptuj wszystkie
          </Button>
        </div>
      </div>
    </div>
  );
}
