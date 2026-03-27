# Kierunki rozwoju — biznes usługowy (bez sklepu i bookingu)

---

## 1. Analytics dla właścicieli biznesów

- [ ] Zapis zdarzeń do bazy (odsłony stron, kliknięcia CTA, wysłane formularze)
- [x] Dashboard analityczny w panelu admina (wykresy: wizyty, konwersje)
- [x] Filtrowanie po zakresie dat
- [x] Najpopularniejsze strony i sekcje
- [x] Śledzenie źródeł ruchu (UTM params)
- [ ] Opcjonalna integracja z Google Analytics (skrypt w ustawieniach biznesu)
- [ ] Eksport danych do CSV

---

## 2. Autoryzacja / Autentykacja

- [x] Zaprojektować model ról: super-admin, admin biznesu, edytor
- [x] Implementacja logowania do `/admin` (email + hasło)
- [x] Sesje z JWT lub cookie HttpOnly
- [x] Odświeżanie tokenów (refresh token)
- [x] Middleware chroniące endpointy `/admin` i `/api/admin/*`
- [x] Strona logowania (`/admin/login`)
- [x] Zmiana hasła i reset przez email
- [x] Super-admin: zarządzanie wszystkimi biznesami i użytkownikami
- [x] Logowanie nieudanych prób logowania

---

## 3. Nowe typy sekcji

- [ ] **Pricing** — sekcja z planami cenowymi (tiers, highlights, CTA)
- [x] **Portfolio / Realizacje** — siatka projektów z filtrowaniem po kategorii
- [ ] **Multi-step Lead Form** — wieloetapowy formularz zbierający leady
- [ ] **Google Reviews Embed** — wyświetlanie recenzji Google (widget lub API)
- [ ] **Team** — sekcja z prezentacją zespołu (zdjęcie, imię, stanowisko, bio)
- [x] **Video Hero** — sekcja hero z tłem wideo
- [ ] **Sticky Contact Bar** — pasek kontaktowy przyklejony na dole/górze
- [ ] Zarejestrować każdą nową sekcję w schemacie (`business.schema.json`)
- [ ] Dodać komponenty do `packages/ui`
- [ ] Obsłużyć nowe sekcje w edytorze admina

---

## 4. SEO Tooling

- [ ] Edytor meta tagów (title, description, og:image) per strona w panelu admina
- [x] Automatyczne generowanie `sitemap.xml` dla każdego biznesu
- [ ] Structured data Schema.org: `LocalBusiness`, `Product`, `BlogPosting`
- [ ] Canonical URLs
- [x] Robots.txt per biznes (konfigurowalne)
- [ ] Open Graph preview w panelu admina
- [x] Automatyczne wypełnianie meta title/description z treści strony (fallback)

---

## 5. Rozszerzenie i18n

- [x] Dopracować auto-tłumaczenie sekcji przez AI (GPT-4o lub DeepL API)
- [x] UI w panelu admina do zarządzania tłumaczeniami
- [x] Obsługa języka niemieckiego (DE)
- [x] Obsługa języka ukraińskiego (UK)
- [x] Fallback na język bazowy gdy brak tłumaczenia
- [ ] Przetłumaczyć wszystkie klucze systemowe (błędy, toasty, etykiety formularzy)
- [ ] Testy regresji wizualnej dla każdego języka

---

## 6. Powiadomienia push / SMS

- [x] Integracja z Twilio lub SMSAPI
- [x] SMS przy nowym kontakcie / wiadomości od klienta (do właściciela)
- [x] Web Push Notifications (Service Worker + VAPID)
- [x] Panel admina: ustawienia powiadomień (włącz/wyłącz, numer telefonu)
- [x] Szablony wiadomości konfigurowalne per biznes

---

## 7. Monitoring i error tracking

- [x] Integracja Sentry (frontend + backend)
- [x] Alerty przy błędach 5xx na stronach klientów
- [x] Health check endpoint (`/api/health`) dla każdego biznesu
- [x] Logowanie strukturalne (pino lub winston) po stronie serwera
- [x] Dashboard statusu serwisów (uptime per biznes)
- [x] Alerty email/Slack przy niedostępności

---

## 8. Szybkie wygrane

- [x] Rate limiting na endpointach API (ochrona przed DDoS / spam)
- [ ] Image lazy loading z blur placeholder (LQIP)
- [x] PWA support: `manifest.json` + Service Worker + ikona "dodaj do ekranu"
- [ ] Social share buttons na stronach blogowych (X, Facebook, LinkedIn)
- [ ] Przycisk "Kopiuj link" do artykułu
- [x] Breadcrumbs na podstronach (SEO + UX)
- [x] `rel="noopener noreferrer"` na wszystkich zewnętrznych linkach (audit)
- [ ] Lighthouse audit i fix najgorszych wyników (CLS, LCP, FID)
