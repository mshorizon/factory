# Strategia Obecności w Internecie (Inbound) — hazelgrouse.pl
**Hazelgrouse Studio / MS Horizon Factory** | Lipiec 2026

> **Cel:** sprawić, żeby potencjalni klienci **sami trafiali** na landing (template-portfolio na
> `hazelgrouse.pl`) — bez zimnego kontaktu. To uzupełnienie `STRATEGIA_MARKETINGOWA.md`, które
> jest oparte na cold SMS. **Cold SMS/e-mail/telefon = ryzyko RODO** (art. 172 Prawa
> telekomunikacyjnego + art. 10 UŚUDE — zgoda wymagana). Tu budujemy kanały, gdzie odbiorca
> sam inicjuje kontakt: SEO, Google, social, reklamy, tablice ogłoszeń.

> **Twoja przewaga (rdzeń całej treści):** potrafisz wygenerować gotowe, spersonalizowane demo
> strony dla dowolnej firmy w kilka minut. To najlepszy materiał na content i reklamy, jakiego
> konkurencja nie ma. Wszystko poniżej opiera się na pokazywaniu tego efektu publicznie.

---

## 0. Fundament — zanim włączysz jakikolwiek ruch

Ruch bez konwersji = spalony budżet. Najpierw domknij te punkty na `hazelgrouse.pl`:

- [ ] **Jedno jasne CTA nad foldem** — „Zobacz cennik" / „Zamów darmowe demo" → formularz lub Calendly.
- [ ] **Sposób na kontakt bez telefonu do Ciebie** — formularz + WhatsApp Business (link `wa.me/48XXXXXXXXX?text=...`) + Calendly (rezerwacja rozmowy 15 min).
- [ ] **Dowód** — 3–5 demo z różnych branż (fryzjer, hydraulik, restauracja, prawnik, mechanik) jako publiczne portfolio. To robi robotę: klient widzi „to samo, co dla mnie".
- [ ] **Analytics + śledzenie** — Umami jest już w repo (`updateSiteUmamiId`); dopilnuj, że landing ma ID i zbiera odsłony + kliknięcia CTA. Dodaj **UTM** do każdego linku (patrz §9).
- [ ] **Szybkość i mobile** — Astro jest szybki; sprawdź w PageSpeed, że LCP < 2,5 s na 4G. 70%+ ruchu lokalnego to telefon.
- [ ] **Zgodność** — polityka prywatności + baner cookie (masz `CookieConsentBanner.astro`). Formularz z checkboxem zgody i informacją o administratorze danych.

**Bez tych 6 punktów nie odpalaj płatnych reklam.** Organikę i GBP możesz budować równolegle.

---

## 1. Google Business Profile (GBP) — najważniejszy darmowy kanał lokalny

Dla usług lokalnych w PL Google to główne źródło. Zakładasz profil **dla własnej firmy**
(Hazelgrouse Studio), nie dla klientów.

**Setup:**
- [ ] Kategoria główna: **„Projektant stron internetowych"** (Website designer). Dodatkowe: „Agencja marketingowa", „Usługi informatyczne".
- [ ] Obszar działania: całe województwo / Polska (usługa zdalna — ustaw „service area", bez adresu jeśli pracujesz z domu).
- [ ] Opis (750 znaków) z frazami: *„Tworzenie i prowadzenie stron internetowych dla małych firm — strona gotowa w 24h, panel do samodzielnej edycji, hosting w cenie."*
- [ ] Zdjęcia: screeny gotowych realizacji (min. 10), logo, „przed/po".
- [ ] Link do strony: `hazelgrouse.pl` (z UTM `?utm_source=gbp`).

**Opinie = paliwo (największy czynnik rankingu lokalnego):**
- Po każdym wdrożeniu poproś klienta o opinię — wyślij gotowy link do wystawienia opinii.
- Cel: 5 opinii w pierwszym miesiącu, potem +2–3/mies. Odpowiadaj na każdą.

**Posty GBP (traktuj jak darmowy mini-social):** 1×/tydz. — nowa realizacja, „przed/po",
promocja. Posty pojawiają się w wynikach Map.

---

## 2. SEO — żeby Google przyprowadzał ruch za darmo (długi zwrot, zacznij teraz)

Intencja zakupowa w Polsce jest konkretna: ludzie wpisują **„strona internetowa dla
[branża] [miasto]"**. Zrób pod to strony.

**Struktura „programmatic SEO" (Twój moat — możesz generować podstrony masowo):**
- Podstrony branżowe: `/strona-dla-fryzjera`, `/strona-dla-hydraulika`, `/strona-dla-restauracji`… (masz szablony pod te branże — pokaż demo na każdej).
- Podstrony miasto×branża dla top miast: `/strona-dla-fryzjera-krakow`, `…-warszawa`, `…-wroclaw`. Generuj z jednego szablonu treści — to dokładnie to, w czym jesteś szybki.
- Każda podstrona: H1 z frazą, żywe demo tej branży, cennik, CTA, FAQ, 2–3 opinie.

**Blog (autorytet + długi ogon):** 2–4 wpisy/mies., porady dla właścicieli mikrofirm:
- „Ile kosztuje strona internetowa dla małej firmy w 2026?"
- „Wizytówka Google czy strona — co najpierw dla fryzjera?"
- „Jak zdobyć pierwszych klientów z Google — poradnik dla usług lokalnych"

**Techniczne (Astro to ułatwia):** meta title/description per podstrona, dane strukturalne
`LocalBusiness`/`Service` (schema.org), sitemap, szybkie ładowanie, wewnętrzne linkowanie
podstron branżowych do cennika.

**Realistyczny horyzont:** SEO daje efekty po 2–4 mies. Dlatego równolegle płatne + social.

---

## 3. Content engine — TikTok / Reels / YouTube Shorts (Twój największy nieużywany atut)

Twój pipeline „opis → gotowa strona w 3 minuty" to **gotowy materiał viralowy**. To kanał
o najwyższym potencjalnym zasięgu przy zerowym budżecie — i w 100% zgodny z RODO (to broadcast,
nie zimny kontakt).

**Format = jeden kanał, publikowany na 3 platformy naraz** (TikTok + Instagram Reels + YT Shorts).

**Sprawdzone hooki (pierwsze 2 sekundy decydują):**
| Hook | Format |
|------|--------|
| „Robię stronę dla fryzjera od zera — masz 60 sekund" | screen-record generowania + timelapse |
| „Ta firma nie ma strony. Zobacz, co zrobiłem w 5 minut" | przed (brak/stara strona) → po (demo) |
| „Wpisz w komentarzu nazwę swojej firmy — zrobię Ci stronę" | odpowiadasz filmem-demo dla komentujących (najwyższa wiralność) |
| „Ile bierze agencja za to, co ja robię w 3 minuty" | edukacja + porównanie |
| „3 rzeczy, przez które klienci nie znajdują Twojej firmy w Google" | poradnik, miękka sprzedaż |

**Zasady:**
- **Częstotliwość:** 4–5×/tydz. przez pierwsze 8 tygodni (algorytm nagradza regularność). Batchuj — nagraj 10 filmów w jedno popołudnie.
- **Zawsze** pokaż realny efekt na ekranie (demo), nie gadaj do kamery.
- **CTA w opisie i przypięte:** „Darmowe demo Twojej firmy → link w bio (hazelgrouse.pl)".
- **Format „zrobię na żywo w komentarzach"** zamienia widzów w leady, którzy już widzieli produkt — i sami piszą.

**Dystrybucja jednego filmu:** TikTok → Reels → Shorts → post na FB firmowym → GBP post.
Jeden materiał, 5 miejsc.

---

## 4. Social media — kanały firmowe (obecność + remarketing)

Nie musisz być wszędzie. **Priorytet: 1 kanał wideo (TikTok/IG) + 1 profil firmowy (FB) + 1 B2B (LinkedIn).**

**Facebook (firmowy) — must-have w PL dla lokalnych:**
- Profil firmowy z portfolio, cennikiem, przyciskiem „Wyślij wiadomość".
- Publikuj realizacje i „przed/po".
- **Grupy lokalne** („Przedsiębiorcy [miasto]", „MŚP Polska", grupy branżowe) — **nie spamuj**: odpowiadaj merytorycznie na pytania o strony, buduj autorytet. 1–2 pomocne posty/tydz. Gdy ktoś pyta „gdzie zrobić stronę" — to Twój moment (opt-in, legalne).
- Grupy typu „ogłoszenia [miasto]" / marketplace — patrz §6.

**Instagram:** siostra Reels; feed = portfolio wizualne (screeny stron, karuzele przed/po).

**LinkedIn (kanał B2B — pod branże regulowane i white-label dla agencji):**
- Publikuj case studies i „jak działa pipeline".
- Docieraj do agencji marketingowych (white-label) i firm regulowanych (prawnicy, doradcy).

**TikTok:** patrz §3 — to główny silnik zasięgu, nie „profil dla ozdoby".

---

## 5. Reklamy płatne — szybki ruch, gdy fundament (§0) gotowy

Kolejność wg intencji zakupowej (od najgorętszej):

### 5a. Google Ads — Search (najwyższa intencja, zacznij od tego)
- Kampania na frazy zakupowe: „strona internetowa dla firmy", „tworzenie stron [miasto]", „strona dla [branża]".
- Dopasowania: głównie ścisłe/dopasowane do wyrażenia (unikaj przepalania na szeroki match).
- Wykluczenia: „za darmo", „kurs", „wordpress tutorial", „praca".
- Cel: kliknięcie CTA / rezerwacja Calendly / formularz. Ustaw **konwersje** w Google Ads + połącz z Analytics.
- Budżet startowy: **800–1 500 zł/mies.** Zacznij od 1 miasta/województwa, skaluj to, co konwertuje.

### 5b. Meta Ads (Facebook/Instagram) — popyt utajony + remarketing
- Format: **wideo „przed/po"** albo karuzela z gotowymi stronami (te same materiały co §3).
- Targeting: właściciele małych firm, 30–55, województwo/promień; zainteresowania: „mała firma", „przedsiębiorczość".
- **Remarketing** (najlepszy ROI): pokazuj reklamy osobom, które weszły na landing lub obejrzały 50% filmu. Wymaga Meta Pixel na `hazelgrouse.pl`.
- Budżet: **500–1 000 zł/mies.** testowo.

### 5c. TikTok Ads — gdy organiczny content już działa
- Wzmacniaj (boost/Spark Ads) filmy, które organicznie dowożą — najtańszy zasięg wideo w PL.
- Wejdź tu dopiero, gdy masz 5–10 filmów i wiesz, który hook działa.

> **Zasada budżetu solo:** nie rozlewaj po 5 kanałach. Odpal **1 kanał płatny (Google Search)**,
> naucz się go, dołóż drugi (Meta remarketing) dopiero gdy pierwszy dowozi leady < 50–80 zł.

---

## 6. Tablice ogłoszeń — najtańszy, w 100% legalny kanał lokalny (fizyczny + online)

Ogłoszenie to reklama, na którą odbiorca sam patrzy — **brak problemu RODO**.

**Fizyczne** (świetne pod strategię „w terenie"):
- Tablice w lokalnych sklepach, piekarniach, przychodniach, na osiedlach (spółdzielnia), w urzędach, na targowiskach, w kościołach (ogłoszenia parafialne).
- Karta A5/A6: „Strona dla Twojej firmy — gotowa w 24h. Zobacz przykłady: **[QR → hazelgrouse.pl]**". QR z UTM `?utm_source=tablica&utm_campaign=[miejscowosc]`.
- Zostaw wizytówki z QR w firmach, które odwiedzasz w ramach in-person.

**Online:**
- **OLX / Gumtree** — kategoria usługi/IT: ogłoszenie „Strony internetowe dla firm" z linkiem do portfolio. Odnawiaj co tydzień.
- **Marketplace / grupy ogłoszeniowe FB** dla Twoich miast.
- **Oferteo / Fixly** — profil usługodawcy; klienci sami wysyłają zapytania (to inbound, legalne).

---

## 7. Powiązanie z demo (leady ze scrapera → treść i in-person, nie cold outreach)

Scraper (teraz z filtrem województwa) i `generate-lead-site` służą do:
1. **Materiału na content** — generujesz demo lokalnej firmy → film „zobacz, co zrobiłem dla [branża] z [miasto]" (nie oznaczaj/nie kontaktuj firmy bez zgody).
2. **Wizyt in-person** — wchodzisz do firmy z gotowym demo na tablecie (rozmowa twarzą w twarz ≠ marketing elektroniczny → poza zakazem art. 172).
3. **Portfolio** — anonimizowane demo jako przykład branżowy na podstronie SEO.

> **Czego NIE robisz:** nie wysyłasz zimnego SMS/e-maila/nie dzwonisz do zescrapowanych firm.
> Lista = źródło demo i lista do wizyt, nie baza do zimnej wysyłki.

---

## 8. Ścieżka konwersji (inbound)

```
ZASIĘG        TikTok/Reels · SEO/Google · GBP · reklamy · tablica/QR
                 ↓  (klient sam klika)
LANDING       hazelgrouse.pl — portfolio + cennik + „Darmowe demo Twojej firmy"
                 ↓
MIKROKONWERSJA  formularz / WhatsApp / rezerwacja Calendly (15 min)
                 ↓
DEMO NA ŻYWO   generujesz stronę podczas rozmowy (Twoja przewaga)
                 ↓
SPRZEDAŻ       oferta subskrypcji (patrz STRATEGIA_MARKETINGOWA.md §1)
```

Kluczowe: **każdy kanał kieruje na landing z jednym CTA (darmowe demo)**, a nie do bezpośredniej
sprzedaży. Demo jest haczykiem, który klient sam bierze.

---

## 9. Pomiar — bez tego lejesz budżet na ślepo

- **UTM w każdym linku:** `?utm_source=` (tiktok/gbp/olx/tablica/google/meta) `&utm_medium=` `&utm_campaign=`. Dzięki temu wiesz, który kanał dowozi.
- **Umami** (masz w repo) — odsłony landingu, kliknięcia CTA, źródła.
- **Konwersje:** Google Ads Conversion + Meta Pixel na zdarzeniu „wysłano formularz" / „kliknięto WhatsApp".
- **Cotygodniowy przegląd (10 min):** ile odsłon, z jakiego kanału, ile zapytań, koszt leadu na kanał. Skaluj to, co dowozi < 50–80 zł/lead. Ucinaj resztę.

**KPI miesięczne (inbound):**
| Metryka | Cel M1 | Cel M3 |
|---|---|---|
| Odsłony landingu | 300+ | 2 000+ |
| Zapytania (formularz/WA/Calendly) | 5–10 | 25–40 |
| Koszt leadu (płatne) | ucz się | < 80 zł |
| Filmy opublikowane | 15+ | 50+ |
| Opinie Google | 5 | 15 |

---

## 10. Plan startu dla jednoosobowej firmy (kolejność, nie wszystko naraz)

**Tydzień 1–2 — fundament (§0 + darmowe):**
- [ ] Domknij landing: CTA, formularz+WhatsApp+Calendly, 3–5 demo w portfolio, Umami, UTM, Pixel.
- [ ] Załóż i uzupełnij Google Business Profile; poproś o pierwsze opinie.
- [ ] Nagraj i opublikuj pierwsze 3 filmy (TikTok/Reels/Shorts).
- [ ] Wystaw ogłoszenie na OLX + zawieś 5 kart z QR na lokalnych tablicach.

**Tydzień 3–4 — rozpęd organiczny:**
- [ ] Content: 4–5 filmów/tydz. (batch). Uruchom format „nazwa firmy w komentarzu".
- [ ] SEO: 3 podstrony branżowe + 3 miasto×branża + 2 wpisy blogowe.
- [ ] Pierwsze wizyty in-person z demo na tablecie (lista ze scrapera po województwie).

**Miesiąc 2 — dołóż płatne:**
- [ ] Google Ads Search (1 województwo, 800 zł), konwersje włączone.
- [ ] Meta remarketing na ruch z landingu i widzów filmów.
- [ ] Skaluj format wideo, który dowozi; boostuj najlepszy film (TikTok Ads).

**Miesiąc 3 — optymalizacja:**
- [ ] Podwój budżet najlepszego kanału, utnij najsłabszy.
- [ ] Rozbuduj programmatic SEO (kolejne miasta×branże).
- [ ] Case study wideo z pierwszym klientem, który dostał zapytania z Google.

---

## 11. Powiązanie z Kaizen Growth

Ta strategia to **kontekst dla narzędzia**. Wpisz cel (np. „10 płacących klientów") i do
**Off-limits** w zakładce Goals dodaj:
> *Brak zimnego marketingu elektronicznego (cold SMS/e-mail/telefon) — RODO. Kontakt tylko:
> in-person, tablice ogłoszeń, polecenia, ciepłe wprowadzenia, inbound.*

Wtedy `pnpm goal:next` będzie proponować kolejne małe kroki z tej listy (nagraj film, dodaj
podstronę SEO, załóż GBP, powieś kartę z QR) zamiast krążyć wokół scrapera do zimnej wysyłki.

---

*Dokument: Lipiec 2026 | Hazelgrouse Studio. Uzupełnienie STRATEGIA_MARKETINGOWA.md o kanały inbound zgodne z RODO.*
