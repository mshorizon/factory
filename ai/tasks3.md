# Rekomendowane ulepszenia — posortowane wg priorytetu grup

---

## 0.1 hazelgrouse.pl - portfolio firmy
- [ ] **hazelgrouse.pl** dan
- [ ] **klient 0**

---
## 0.2 Dopracowanie strony
- [ ] **specialist** — dopracowanie strony pod kątem wizualnym - eby wszystko było na tip top
- [ ] **prawnie** — skonsultowac z ai czy prawnie moge komus wyslac oferte
- [ ] **klient 0**
- [ ] **beauty** — nowa template businesu - warstwa wizualna dla fryzjerów salonów, piękności, spa

---

## 1. Booking — dokończenie systemu rezerwacji 🔴

- [x] **Email potwierdzający rezerwację** do klienta (z detalami: data, godzina, usługa)
- [x] **SMS potwierdzający rezerwację** (Twilio/SMSAPI)
- [x] **Przypomnienie 24h przed** wizytą (email) — via `/api/booking/reminders` cron endpoint
- [x] **Przypomnienie 1h przed** wizytą (SMS) — via `/api/booking/reminders` cron endpoint
- [x] **UI anulowania** rezerwacji przez klienta (link w emailu → `/api/booking/cancel?token=`)
- [x] **Bufor między wizytami** — `bufferMinutes` w booking config
- [x] **Blokady dat** — `blackoutDates` array w booking config
- [ ] **Przedpłata za rezerwację** — integracja z Stripe (deposit)
- [ ] **Widok kalendarza** w panelu admina (tygodniowy/miesięczny)

---

## 2. Konwersja i pozyskiwanie leadów 🔴

- [ ] **Sekcja Pricing / Cennik** — tabela z planami cenowymi, wariantami, CTA
- [ ] **Sticky Contact Bar** — pasek kontaktowy przyklejony na dole (telefon + CTA)
- [ ] **WhatsApp button** — przycisk "Napisz na WhatsApp" (popularny w usługach)
- [ ] **Newsletter signup section** — sekcja zbierająca emaile + integracja z listą mailingową
- [ ] **Kody rabatowe / kupony** — system zniżek w checkout
- [ ] **Abandoned cart recovery** — email gdy koszyk porzucony
- [ ] **Multi-step Lead Form** — wieloetapowy formularz z kwalifikacją leadów
- [ ] **Live chat widget** — integracja z Intercom/Crisp/Tawk.to
- [ ] **Exit-intent popup** — popup z ofertą przy próbie opuszczenia strony
- [ ] **Social proof notifications** — "Ktoś właśnie zamówił..." (real-time)

---

## 3. SEO & Widoczność w Google 🟠

- [ ] **Schema.org LocalBusiness** — JSON-LD z nazwą, adresem, telefonem, godzinami, oceną Google (kluczowe dla local SEO)
- [ ] **Schema.org FAQPage** — structured data dla sekcji FAQ (rich snippets w Google)
- [ ] **Schema.org Product** — structured data dla produktów w sklepie
- [ ] **Hreflang link tags** — poprawne linkowanie wersji językowych (pl, en, de, uk)
- [ ] **Canonical URLs** — uniknięcie duplikacji treści między subdomenami
- [ ] **Open Graph preview** w panelu admina — podgląd jak strona wygląda na FB/LinkedIn
- [ ] **Blog RSS Feed** — `/blog/feed.xml` endpoint (syndykacja treści, SEO)
- [ ] **Strony kategorii bloga** — `/blog/category/[category]` i `/blog/tag/[tag]` (więcej stron indeksowanych)
- [ ] **Image sitemap** — osobna mapa dla obrazów (Google Images)
- [ ] **Breadcrumb Schema.org** — structured data dla nawigacji okruszkowej

---

## 4. Automation pipeline — rozszerzenie 🟠

- [ ] **Szablony per branża** — osobne business JSON templates (fryzjer, dentysta, mechanik, etc.)
- [ ] **Auto-deploy Coolify** — API call do Coolify dodający subdomenę automatycznie
- [ ] **Więcej źródeł danych** — Yelp Fusion API, Foursquare, Google Maps scraping
- [ ] **Tracking emaili** — pixel śledzący otwarcia + link tracking w outreach emailach
- [ ] **Follow-up automatyczny** — drugi email po X dniach bez odpowiedzi
- [ ] **Dashboard pipeline** — webowy widok statusów leadów (zamiast CSV)
- [ ] **Migracja CSV → SQLite** — przy >1000 leadów

---

## 5. Sekcje zwiększające zaufanie i konwersję 🟠

- [ ] **Google Reviews embed** — wyświetlanie recenzji Google (widget lub Places API)
- [ ] **Stats / Liczniki** — animowane liczniki (np. "500+ klientów", "10 lat doświadczenia")
- [ ] **Team section** — prezentacja zespołu (zdjęcie, imię, stanowisko, bio)
- [ ] **Comparison table** — porównanie planów/pakietów usług
- [ ] **Video section** — sekcja z embedowanym wideo (YouTube/Vimeo)
- [ ] **Before/After slider** — interaktywny slider porównujący efekty (np. remonty)
- [ ] **Partners / Clients logos** — pasek z logotypami partnerów/klientów
- [ ] **Certyfikaty / Nagrody** — sekcja z certyfikatami i wyróżnieniami
- [ ] **Timeline / Historia** — oś czasu firmy (milestones, lata działalności)

---

## 6. E-commerce — rozszerzenie sklepu 🟡

- [ ] **Warianty produktów** — rozmiar, kolor, materiał z osobnymi cenami i stockiem
- [ ] **Kalkulacja kosztów wysyłki** — waga/lokalizacja lub flat rate
- [ ] **Kalkulacja podatku VAT** — stawki per kategoria produktu
- [ ] **Zarządzanie stanem magazynowym** — real-time dekrementacja stocku przy zamówieniu
- [ ] **Obsługa zwrotów** — endpoint zwrotu + Stripe refund API
- [ ] **Śledzenie przesyłki** — numer trackingowy + link do śledzenia
- [ ] **Pola customizacji** — text input, date picker, file upload (nie tylko select)
- [ ] **Subskrypcje** — recurring billing przez Stripe (np. miesięczna usługa)

---

## 7. Performance i Core Web Vitals 🟡

- [ ] **Image optimization** — automatyczna konwersja do WebP/AVIF z srcset
- [ ] **Blur placeholder (LQIP)** — rozmyte placeholder przy lazy loading obrazów
- [ ] **Lighthouse audit** — fix najgorszych wyników CLS, LCP, INP
- [ ] **Critical CSS inlining** — inline CSS above-the-fold dla szybszego FCP
- [ ] **Prefetching** — preload kluczowych zasobów, prefetch linków
- [ ] **Bundle analysis** — analiza wielkości JS bundles, usunięcie dead code

---

## 8. Blog — wzrost organiczny 🟡

- [ ] **Powiązane posty** — "Przeczytaj również" na dole artykułu
- [ ] **Czas czytania** — szacowany czas (np. "5 min czytania")
- [ ] **Spis treści (TOC)** — automatyczny z nagłówków H2/H3
- [ ] **Social share buttons** — udostępnianie na FB, X, LinkedIn, kopiuj link
- [ ] **Komentarze z odpowiedziami** — threading (reply to comment)
- [ ] **Zaplanowane publikacje** — scheduled publishing (publish at future date)
- [ ] **Strony autorów** — `/blog/author/[name]` z listą postów
- [ ] **Filtrowanie antyspamowe** — automatyczne wykrywanie spamu w komentarzach

---

## 9. Analytics i raportowanie 🟡

- [ ] **Custom events tracking** — śledzenie kliknięć CTA, dodań do koszyka, rezerwacji
- [ ] **Goal/conversion tracking** — definiowanie celów (np. wysłanie formularza = konwersja)
- [ ] **Revenue tracking** — powiązanie zamówień z analytics (ROI per źródło ruchu)
- [ ] **Eksport danych do CSV** — raporty do pobrania z panelu admina
- [ ] **Google Analytics integration** — opcjonalny skrypt GA4 (konfigurowany per biznes)
- [ ] **Heatmaps** — integracja z Hotjar lub open-source alternative

---

## 10. Email marketing i komunikacja 🟢

- [ ] **Edytor szablonów email** w panelu admina (nie hardcoded w kodzie)
- [ ] **Email powitalny** dla nowych subskrybentów/klientów
- [ ] **Newsletter** — wysyłka masowa do listy emaili (z unsubscribe)
- [ ] **Sekwencje follow-up** — automatyczne emaile po kontakcie (dzień 1, 3, 7)
- [ ] **Email analytics** — tracking otwarć, kliknięć, dostarczalności
- [ ] **Preferencje emailowe** — klient wybiera jakie emaile chce dostawać

---

## 11. Panel admina — UX i produktywność 🟢

- [ ] **Bulk operations** — masowe usuwanie, publikowanie, zmiana statusu
- [ ] **Audit log** — historia zmian (kto, co, kiedy zmienił w konfiguracji)
- [ ] **Version control** — rollback do poprzedniej wersji konfiguracji biznesu
- [ ] **Edycja per-sekcja** — edycja pojedynczej sekcji zamiast całego JSON
- [ ] **Drag & drop reordering** — zmiana kolejności sekcji przeciąganiem
- [ ] **Media library** — zarządzanie uploadowanymi obrazami (przeglądanie, usuwanie)
- [ ] **Import/Export** — eksport konfiguracji biznesu do JSON, import z pliku
- [ ] **Onboarding wizard** — kreator nowej strony krok po kroku

---

## 12. Bezpieczeństwo 🟢

- [ ] **2FA / MFA** — dwustopniowa autoryzacja dla adminów (TOTP)
- [ ] **CSP headers** — Content Security Policy dla ochrony przed XSS
- [ ] **HSTS headers** — wymuszenie HTTPS
- [ ] **Audit trail** — logowanie wszystkich akcji adminów
- [ ] **Brute force protection** — exponential backoff przy nieudanych logowaniach
- [ ] **API key management** — klucze API per biznes z rotacją
