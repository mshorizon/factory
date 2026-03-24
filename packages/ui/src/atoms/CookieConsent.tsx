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

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!loadConsent()) setVisible(true);
  }, []);

  function acceptNecessary() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
    setModalOpen(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
    setModalOpen(false);
  }

  function saveCustom() {
    saveConsent({ necessary: true, analytics, marketing });
    setVisible(false);
    setModalOpen(false);
  }

  function openModal() {
    const saved = loadConsent();
    setAnalytics(saved?.analytics ?? false);
    setMarketing(saved?.marketing ?? false);
    setModalOpen(true);
  }

  if (!visible && !modalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setModalOpen(false)}
        />
      )}

      {/* Preferences modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card text-foreground rounded-radius shadow-lg w-full max-w-md flex flex-col gap-spacing-lg p-spacing-2xl">
            <h2 className="text-xl font-bold">Ustawienia plików cookies</h2>

            <div className="flex flex-col gap-spacing-md">
              {/* Necessary */}
              <div className="flex items-start justify-between gap-spacing-md">
                <div>
                  <p className="font-semibold text-sm">Niezbędne</p>
                  <p className="text-xs text-muted mt-0.5">
                    Wymagane do prawidłowego działania strony. Nie można wyłączyć.
                  </p>
                </div>
                <div className="shrink-0 mt-0.5">
                  <div className="w-10 h-6 rounded-radius-full bg-primary flex items-center justify-end px-0.5 cursor-not-allowed opacity-70">
                    <div className="w-5 h-5 rounded-full bg-white shadow" />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-spacing-md">
                <div>
                  <p className="font-semibold text-sm">Analityczne</p>
                  <p className="text-xs text-muted mt-0.5">
                    Pomagają nam zrozumieć, jak odwiedzający korzystają ze strony.
                  </p>
                </div>
                <button
                  onClick={() => setAnalytics((v) => !v)}
                  className={cn(
                    "shrink-0 mt-0.5 w-10 h-6 rounded-radius-full transition-colors flex items-center px-0.5",
                    analytics ? "bg-primary justify-end" : "bg-muted/40 justify-start"
                  )}
                  aria-checked={analytics}
                  role="switch"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-spacing-md">
                <div>
                  <p className="font-semibold text-sm">Marketingowe</p>
                  <p className="text-xs text-muted mt-0.5">
                    Używane do wyświetlania spersonalizowanych reklam.
                  </p>
                </div>
                <button
                  onClick={() => setMarketing((v) => !v)}
                  className={cn(
                    "shrink-0 mt-0.5 w-10 h-6 rounded-radius-full transition-colors flex items-center px-0.5",
                    marketing ? "bg-primary justify-end" : "bg-muted/40 justify-start"
                  )}
                  aria-checked={marketing}
                  role="switch"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-spacing-sm pt-spacing-xs">
              <Button variant="outline" size="sm" className="flex-1" onClick={saveCustom}>
                Zapisz wybór
              </Button>
              <Button size="sm" className="flex-1" onClick={acceptAll}>
                Akceptuj wszystkie
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      {visible && !modalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[9997] section-bg-dark border-t border-white/10">
          <div className="container mx-auto px-spacing-container py-spacing-lg flex flex-col md:flex-row md:items-center gap-spacing-md">
            <p className="text-sm text-foreground flex-1 leading-relaxed">
              Używamy plików cookies, aby zapewnić prawidłowe działanie strony oraz — za Twoją zgodą —
              do celów analitycznych i marketingowych.{" "}
              <button
                onClick={openModal}
                className="underline underline-offset-2 hover:text-primary transition-colors"
              >
                Dowiedz się więcej
              </button>
            </p>
            <div className="flex flex-wrap gap-spacing-sm shrink-0">
              <Button variant="outline" size="sm" onClick={acceptNecessary}>
                Tylko niezbędne
              </Button>
              <Button variant="ghost" size="sm" onClick={openModal}>
                Dostosuj
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Akceptuj wszystkie
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
