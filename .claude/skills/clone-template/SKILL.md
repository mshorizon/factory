---
name: clone-template
description: Create a new business template by cloning the visual design of a website. Takes template name and URL, analyzes the site with Playwright, maps sections to existing engine components (reusing, extending with variants, or creating new), and produces a validated business JSON.
---

## ⚠️ KRYTYCZNA ZASADA — przeczytaj przed pracą

**Każda nazwa template'u MUSI zaczynać się od `template-`** (np. `template-restaurant`, `template-medical`).

Jeśli użytkownik poda nazwę bez prefiksu `template-` (np. `notarialny`, `mojafirma`) — **STOP. Zapytaj o potwierdzenie i zaproponuj nazwę z prefiksem** (np. `template-notarialny`).

Tylko ogólne, wielokrotnego użytku blueprinty trafiają do `templates/`. Konkretne instancje firm (np. `notariuszwgarwolinie`) żyją TYLKO w bazie danych — nie w `templates/`. Zobacz ADR-0018.

---

## Cel

Stwórz nowy **reużywalny** template biznesowy na podstawie strony internetowej. Użytkownik podaje:
1. Nazwę nowego template'u (np. `template-restaurant`, `template-medical`) — **musi zaczynać się od `template-`**
2. URL strony-wzoru (np. `https://example.framer.ai/`)

## Pliki do zrozumienia przed pracą

Przeczytaj te pliki żeby zrozumieć architekturę:
- `/home/dev/factory/packages/schema/src/business.schema.json` — schemat i dostępne typy sekcji
- `/home/dev/factory/packages/ui/src/sections/index.ts` — dostępne warianty sekcji
- `/home/dev/factory/packages/ui/src/themes/majorThemes.ts` — istniejące majorTheme
- `/home/dev/factory/templates/portfolio-tech/portfolio-tech.json` — przykład gotowego template'u
- `/home/dev/factory/apps/engine/src/components/sections/` — lista wszystkich .astro sekcji

## FAZA 1 — ANALIZA STRONY WZORU

Użyj Playwright MCP żeby dokładnie przeanalizować stronę:

```
1. mcp__playwright__browser_navigate → otwórz URL
2. mcp__playwright__browser_take_screenshot (fullPage: false) → screenshot viewportu
3. mcp__playwright__browser_scroll lub page.evaluate → przewiń stronę i zrób kolejne screenshoty każdej sekcji
4. Dla każdej podstrony (About, Services, Contact etc.) — nawiguj i rób screenshoty
```

Na podstawie screenshotów i HTMLa zidentyfikuj:
- **Paleta kolorów**: primary, background (dark/light), text, accent
- **Typografia**: font family, nagłówki (rozmiar/waga), body text
- **Border radius**: zaokrąglenia kart, buttonów
- **Sekcje na stronie**: lista od góry do dołu, dla każdej opisz layout i zawartość
- **Tone of voice**: jaka branża, jakie podstrony istnieją

## FAZA 2 — MAPOWANIE SEKCJI

Dla każdej sekcji ze strony wzoru wykonaj decyzję według tej hierarchii:

### Istniejące typy sekcji w engine:
`hero`, `services`, `categories`, `about`, `about-summary`, `mission`, `contact`, `shop`, `gallery`, `testimonials`, `process`, `serviceArea`, `trustBar`, `galleryBA`, `faq`, `features`, `ctaBanner`, `blog`, `map`, `ref`, `booking`, `pricing`, `project`, `comparison`, `team`

### Istniejące warianty per typ:
- **hero**: `default`, `split`, `gradient`, `cards`, `video`, `minimal`
- **services**: `grid`, `list`, `imageGrid`, `darkCards`, `featured`
- **categories**: `carousel`, `featured`
- **about**: `story`, `timeline`
- **contact**: `centered`, `split`
- **features**: `default`, `compact`
- **ctaBanner**: `default`, `ticker`
- **project**: `grid`, `carousel`
- **process**: `default`, `visual`
- **footer**: `simple`, `multiColumn`, `minimal`, `centered`, `branded`, `stacked`
- **navbar**: `standard`, `centered`
- Pozostałe typy: tylko `default`

### Drzewo decyzyjne dla każdej sekcji:

```
Czy sekcja pasuje do istniejącego TYPU?
├── TAK → Czy istnieje wariant wystarczająco podobny wizualnie (>70%)?
│         ├── TAK → REUSE: użyj istniejącego wariantu
│         └── NIE → NEW_VARIANT: stwórz nowy wariant istniejącego typu
└── NIE → NEW_SECTION: stwórz nowy typ sekcji
```

**WAŻNE — nie bój się:**
- Tworzyć nowych wariantów — każda nowa strona ma swój styl
- Tworzyć nowych typów sekcji — jeśli coś naprawdę nie pasuje
- Pixel-perfect > kompromisy z istniejącymi komponentami

Przykład decyzji:
- "Hero z gwiazdkami i mgławicą w tle" → typ `hero`, nowy wariant `nebula`
- "Siatka klientów z logo" → nowy typ `logos` z wariantem `grid`
- "Timeline firmowy" → typ `about`, wariant `timeline` (REUSE)

## FAZA 3 — IMPLEMENTACJA NOWYCH KOMPONENTÓW

### Dla każdego NEW_VARIANT:

1. Stwórz plik `packages/ui/src/sections/{type}/{VariantName}.tsx`
   - Użyj Tailwind CSS + semantic CSS variables (`bg-background`, `text-foreground`, `text-primary`)
   - Zadbaj o: hover states, animacje wejścia (scroll reveal), responsywność
   - Wzoruj się na istniejących komponentach danego typu

2. Dodaj eksport do `packages/ui/src/sections/{type}/index.ts`

3. Dodaj eksport do `packages/ui/src/sections/index.ts`

4. Dodaj branch w `apps/engine/src/components/sections/{Type}Section.astro`:
   ```astro
   } else if (variant === "newVariantName") {
     const { NewVariantComponent } = await import("@mshorizon/ui/sections");
     // render component
   }
   ```

### Dla każdego NEW_SECTION:

1. Dodaj nowy typ do `packages/schema/src/business.schema.json`:
   - Dopisz do enum `sectionType`: `"newType"`
   - Dodaj pola danych do `definitions.section.properties` jeśli potrzeba

2. Uruchom: `cd /home/dev/factory/packages/schema && pnpm generate`

3. Stwórz `packages/ui/src/sections/{newType}/` z:
   - `{NewType}Default.tsx` — główny komponent
   - `index.ts` — eksporty
   - `types.ts` — opcjonalnie typy props

4. Dodaj eksport do `packages/ui/src/sections/index.ts`

5. Stwórz `apps/engine/src/components/sections/{NewType}Section.astro`:
   ```astro
   ---
   import type { Section, BusinessProfile } from "@mshorizon/schema";
   const { section, business } = Astro.props as { section: Section; business: BusinessProfile };
   const { variant = "default" } = section;
   ---
   {variant === "default" && (
     <!-- render default -->
   )}
   ```

6. Zarejestruj w `apps/engine/src/components/SectionDispatcher.astro`:
   ```astro
   import NewTypeSection from "./sections/NewTypeSection.astro";
   // w componentMap:
   newType: NewTypeSection,
   ```

7. Dodaj do `DEFAULT_VARIANTS` w `apps/engine/src/lib/pages.ts`

### Po każdym komponencie — weryfikacja wizualna:
```
mcp__playwright__browser_navigate → https://portfolio-tech.dev.hazelgrouse.pl/ (lub dev URL)
pm2 restart astro-dev (jeśli potrzeba)
mcp__playwright__browser_take_screenshot → porównaj z oryginałem
```

## FAZA 4 — BUDOWANIE BUSINESS JSON

Stwórz `templates/{templateName}/{templateName}.json` zgodny ze schematem. (Pamiętaj: `templateName` MUSI mieć prefix `template-`, np. `templates/template-restaurant/template-restaurant.json`).

### Struktura obowiązkowa:
```json
{
  "business": {
    "id": "{templateName}-001",
    "name": "...",
    "industry": "...",
    "assets": { "favicon": "...", "icon": "..." },
    "contact": { "address": "...", "phone": "...", "email": "...", "hours": "..." }
  },
  "theme": {
    "preset": "minimal",
    "majorTheme": "{closest: specialist | portfolio-tech | nowy jeśli potrzeba}",
    "mode": "dark",
    "colors": {
      "light": {
        "primary": "#XXXXXX",
        "surface": { "base": "#...", "alt": "#...", "card": "#..." },
        "text": { "main": "#...", "muted": "#...", "onPrimary": "#..." }
      },
      "dark": { ... }
    },
    "typography": {
      "primary": "'Font Name', system-ui, sans-serif",
      "secondary": "'Font Name', system-ui, sans-serif"
    },
    "ui": {
      "radius": "Xpx",
      "spacing": { "xs": "0.5rem", "sm": "0.75rem", "md": "1rem", "lg": "1.5rem", "xl": "2rem", "2xl": "3rem", "3xl": "4rem", "section-sm": "5rem", "section": "7.5rem", "container": "2.5rem" }
    }
  },
  "layout": {
    "navbar": { "variant": "standard" },
    "footer": { "variant": "minimal", "copyright": "...", "tagline": "...", "links": [] }
  },
  "navigation": {
    "cta": { "label": "...", "target": { "type": "page", "value": "contact" } }
  },
  "data": { "services": [...] },
  "pages": {
    "home": { "title": "...", "sections": [...] },
    "about": { "title": "About", "sections": [...] },
    "contact": { "title": "Contact", "sections": [...] }
  },
  "sharedSections": {}
}
```

### Zasady kolorów z oryginału:
- Wyciągnij primary color ze strony (CTA buttons, accents)
- Dopasuj dark/light surface colors do tła strony
- Zachowaj spójność z oryginałem

### Zasady treści:
- Użyj treści z oryginalnej strony lub dostosuj do branży
- Zachowaj liczby i metryki (testimonials, case studies)
- Dla obrazów użyj Unsplash lub zanotuj do zamiany
- Dane kontaktowe: użyj placeholder'ów (miasto, kraj, email@example.com)

## FAZA 5 — WALIDACJA

```bash
cd /home/dev/factory && pnpm test:validate
```

Jeśli błędy walidacji:
1. Sprawdź schemat dla danego pola
2. Napraw JSON
3. Ponownie waliduj
4. Powtarzaj aż 0 błędów

## FAZA 6 — SEED DO BAZY I FINALNY SCREENSHOT

```bash
cd /home/dev/factory/packages/db && DATABASE_URL="postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db" pnpm run db:seed
pm2 restart astro-dev
```

Następnie:
1. Screenshot strony wzoru (full page)
2. Screenshot nowego template'u (full page)
3. Porównaj sekcja po sekcji
4. Jeśli duże różnice → wróć do FAZY 3 i popraw komponenty

## OUTPUT DLA UŻYTKOWNIKA

Po zakończeniu podsumuj:
- Lista nowych komponentów stworzonych (typ: REUSE/NEW_VARIANT/NEW_SECTION)
- URL podglądu template'u
- Screenshoty porównawcze: wzór vs wynik
- Co wymaga ręcznej poprawy (obrazy, treść, etc.)

## Przykład użycia

```
/clone-template restaurant-modern https://somecoolrestaurant.framer.ai/
```

→ Tworzy `templates/restaurant-modern/restaurant-modern.json`
→ Ewentualnie nowe warianty/sekcje w packages/ui i apps/engine
→ Wszystko przechodzi walidację schema
