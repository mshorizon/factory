# Kierunki rozwoju — biznes usługowy (bez sklepu i bookingu)

---

## 1. Analytics dla właścicieli biznesów

- [ ] Zapis zdarzeń do bazy (odsłony stron, kliknięcia CTA, wysłane formularze)
- [ ] Dashboard analityczny w panelu admina (wykresy: wizyty, konwersje)
- [ ] Filtrowanie po zakresie dat
- [ ] Najpopularniejsze strony i sekcje
- [ ] Śledzenie źródeł ruchu (UTM params)
- [ ] Opcjonalna integracja z Google Analytics (skrypt w ustawieniach biznesu)
- [ ] Eksport danych do CSV

---

## 2. Autoryzacja / Autentykacja

- [ ] Zaprojektować model ról: super-admin, admin biznesu, edytor
- [ ] Implementacja logowania do `/admin` (email + hasło)
- [ ] Sesje z JWT lub cookie HttpOnly
- [ ] Odświeżanie tokenów (refresh token)
- [ ] Middleware chroniące endpointy `/admin` i `/api/admin/*`
- [ ] Strona logowania (`/admin/login`)
- [ ] Zmiana hasła i reset przez email
- [ ] Super-admin: zarządzanie wszystkimi biznesami i użytkownikami
- [ ] Logowanie nieudanych prób logowania

---

## 3. Nowe typy sekcji

- [ ] **Pricing** — sekcja z planami cenowymi (tiers, highlights, CTA)
- [ ] **Portfolio / Realizacje** — siatka projektów z filtrowaniem po kategorii
- [ ] **Multi-step Lead Form** — wieloetapowy formularz zbierający leady
- [ ] **Google Reviews Embed** — wyświetlanie recenzji Google (widget lub API)
- [ ] **Team** — sekcja z prezentacją zespołu (zdjęcie, imię, stanowisko, bio)
- [ ] **Video Hero** — sekcja hero z tłem wideo
- [ ] **Sticky Contact Bar** — pasek kontaktowy przyklejony na dole/górze
- [ ] Zarejestrować każdą nową sekcję w schemacie (`business.schema.json`)
- [ ] Dodać komponenty do `packages/ui`
- [ ] Obsłużyć nowe sekcje w edytorze admina

---

## 4. SEO Tooling

- [ ] Edytor meta tagów (title, description, og:image) per strona w panelu admina
- [ ] Automatyczne generowanie `sitemap.xml` dla każdego biznesu
- [ ] Structured data Schema.org: `LocalBusiness`, `Product`, `BlogPosting`
- [ ] Canonical URLs
- [ ] Robots.txt per biznes (konfigurowalne)
- [ ] Open Graph preview w panelu admina
- [ ] Automatyczne wypełnianie meta title/description z treści strony (fallback)

---

## 5. Rozszerzenie i18n

- [ ] Dopracować auto-tłumaczenie sekcji przez AI (GPT-4o lub DeepL API)
- [ ] UI w panelu admina do zarządzania tłumaczeniami
- [ ] Obsługa języka niemieckiego (DE)
- [ ] Obsługa języka ukraińskiego (UK)
- [ ] Fallback na język bazowy gdy brak tłumaczenia
- [ ] Przetłumaczyć wszystkie klucze systemowe (błędy, toasty, etykiety formularzy)
- [ ] Testy regresji wizualnej dla każdego języka

---

## 6. Powiadomienia push / SMS

- [ ] Integracja z Twilio lub SMSAPI
- [ ] SMS przy nowym kontakcie / wiadomości od klienta (do właściciela)
- [ ] Web Push Notifications (Service Worker + VAPID)
- [ ] Panel admina: ustawienia powiadomień (włącz/wyłącz, numer telefonu)
- [ ] Szablony wiadomości konfigurowalne per biznes

---

## 7. Monitoring i error tracking

- [ ] Integracja Sentry (frontend + backend)
- [ ] Alerty przy błędach 5xx na stronach klientów
- [ ] Health check endpoint (`/api/health`) dla każdego biznesu
- [ ] Logowanie strukturalne (pino lub winston) po stronie serwera
- [ ] Dashboard statusu serwisów (uptime per biznes)
- [ ] Alerty email/Slack przy niedostępności

---

## 8. Szybkie wygrane

- [ ] Rate limiting na endpointach API (ochrona przed DDoS / spam)
- [ ] Image lazy loading z blur placeholder (LQIP)
- [ ] PWA support: `manifest.json` + Service Worker + ikona "dodaj do ekranu"
- [ ] Social share buttons na stronach blogowych (X, Facebook, LinkedIn)
- [ ] Przycisk "Kopiuj link" do artykułu
- [ ] Breadcrumbs na podstronach (SEO + UX)
- [ ] `rel="noopener noreferrer"` na wszystkich zewnętrznych linkach (audit)
- [ ] Lighthouse audit i fix najgorszych wyników (CLS, LCP, FID)
