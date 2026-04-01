# Analiza: Dlaczego portfolio-tech nie wygląda jak xtract.framer.ai

**Data:** 2026-04-01
**Porównanie:** https://portfolio-tech.hazelgrouse.pl/ vs https://xtract.framer.ai/

---

## 1. DIAGNOZA — Dlaczego wynik jest daleko od oryginału

### 1.1 Brak narzędzi wizualnej weryfikacji w workflow

**Główny problem:** Claude nie widzi jak wygląda strona. Cały proces generowania opiera się na kodzie i tekście, bez wizualnego feedbacku.

- Playwright MCP jest skonfigurowany w `settings.local.json` (permissions), ale **serwer MCP nie jest podłączony** — narzędzia `mcp__playwright__*` nie są dostępne
- Bez screenshotów Claude generuje "na ślepo" — pisze kod, ale nie wie jak wygląda rezultat
- W task6.md jest instrukcja "use playwright mcp to compare both websites" — ale bez działającego MCP to niemożliwe
- **Efekt:** Zero iteracji wizualnych. Claude pisze raz, nie sprawdza, nie poprawia

### 1.2 CLAUDE.md jest prawie pusty

Główny `CLAUDE.md` zawiera tylko:
```
# Sesja: Factory › client #2
Worktree: client-panel-2 / Branch: worktree-client-2
## Zasady
- Testy: `pnpm test:validate`
- Build: `pnpm build`
## Aktualny cel
```

**Brakuje kompletnie:**
- Opisu architektury sekcji i wariantów (jak dodawać nowe)
- Wzorca dodawania nowej sekcji (checklist plików do zmodyfikowania)
- Opisu systemu majorThemes
- Informacji o designie — jakie style, podejście do CSS, jakie wzorce wizualne stosować
- Jakichkolwiek wytycznych dotyczących jakości wizualnej

### 1.3 Task file jest zbyt ogólnikowy

`ai/task6.md` mówi "website should look like xtract.framer.ai" ale:
- Nie definiuje KTÓRE elementy designu są kluczowe (gradient text? glassmorphism? micro-interactions?)
- Nie rozdziela pracy na etapy (najpierw hero, potem services, itd.)
- Miesza wiele zadań naraz (design + majorTheme feature + admin panel + figma + cloudflare upload)
- Claude próbuje zrobić wszystko naraz zamiast iterować sekcja po sekcji

### 1.4 Istniejące warianty są za mało "polished"

Analiza kodu komponentów portfolio-tech (HeroGradient, ServicesFeatured, ProcessVisual itd.) pokazuje:

| Cecha designu | xtract.framer.ai | portfolio-tech |
|---|---|---|
| Gradient text | Tak, na nagłówkach | Brak |
| Glassmorphism / frosted glass | Tak, na kartach i badge'ach | Minimalny (tylko backdrop-blur-sm na badge) |
| Micro-interactions (hover) | Bogate — scale, shadow, glow | Podstawowe — translate-y-1, opacity |
| Animacje wejścia | Staggered, smooth, z różnych kierunków | Proste fade-in z reveal |
| Shadow hierarchy | Multi-layer shadows z glow | Pojedynczy shadow-lg |
| Neon/glow effects | Tak, na CTA i highlighted elements | Brak |
| Dashboard UI mockups | Tak, wbudowane w sekcje | Brak |
| Code snippets w procesie | Tak (Python code w Step 2) | Brak |
| Card depth / layering | Wielowarstwowy z z-index | Płaski |
| Gradient backgrounds | Subtlne gradienty na sekcjach | Tylko blur circles w hero |
| Typography treatment | Gradient text, varied weights | Prosty bold text |
| Interactive carousel | Drag-to-explore z momentum | Drag ale bez visual feedback |

### 1.5 Architektura ogranicza kreatywność

System wariantów jest dobrze zaprojektowany, ale:
- Claude **preferuje reuse istniejących wariantów** zamiast tworzenia nowych
- Task mówi "check if we have this component already" — co powoduje że Claude za bardzo dopasowuje do istniejących komponentów zamiast tworzyć pixel-perfect nowe
- Brak mechanizmu "jeśli różnica wizualna > 30% → stwórz nowy wariant"
- Jeden wariant musi obsługiwać wiele theme'ów co wymusza kompromisy wizualne

---

## 2. ROZWIĄZANIA

### 2.1 Podłącz Playwright MCP (KRYTYCZNE)

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

To jest **absolutnie najważniejsza zmiana**. Bez wizualnego feedbacku nie da się odwzorować designu.

**Workflow z Playwright:**
1. Zrób screenshot xtract.framer.ai (każda sekcja osobno)
2. Implementuj sekcję
3. Zrób screenshot portfolio-tech.hazelgrouse.pl
4. Porównaj wizualnie
5. Iteruj aż będzie podobne
6. Przejdź do następnej sekcji

### 2.2 Zainstaluj dodatkowe MCP servery

#### a) Figma MCP (dla designów z Figma)
```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```
- Pozwala Claude czytać design tokens, komponenty, Auto Layout bezpośrednio z Figma
- Task6 zawiera link do Figma — ale bez MCP Claude go nie może odczytać
- Źródło: [Figma MCP Setup](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)

#### b) Screenshot MCP (szybsze screenshoty)
```bash
claude mcp add screenshot npx mcp-screenshot-website-fast
```
- Optymalizowany pod Claude Vision API
- Automatyczne dzielenie na 1072x1072 chunki
- Źródło: [mcp-screenshot-website-fast](https://lobehub.com/mcp/just-every-mcp-screenshot-website-fast)

#### c) Glance (pełna przeglądarka)
- Open-source MCP z Chromium, 30 narzędzi
- Klikanie, nawigacja, screenshoty, visual regression testing
- Źródło: [Glance on Product Hunt](https://www.producthunt.com/products/glance-give-claude-code-a-real-browser)

### 2.3 Rozbuduj CLAUDE.md

Dodaj do głównego CLAUDE.md sekcje:

```markdown
## Architektura sekcji i wariantów

### Dodawanie nowego wariantu sekcji (checklist)
1. Stwórz `packages/ui/src/sections/{type}/{VariantName}.tsx`
2. Wyeksportuj z `packages/ui/src/sections/{type}/index.ts`
3. Wyeksportuj z `packages/ui/src/sections/index.ts`
4. Dodaj branch w `apps/engine/src/components/sections/{Type}Section.astro`
5. Dodaj variant do `packages/schema/src/business.schema.json` → sectionVariant enum
6. `cd packages/schema && pnpm generate`
7. Opcjonalnie: zaktualizuj `packages/ui/src/themes/majorThemes.ts`

### Dodawanie nowego typu sekcji (checklist)
1-7 jak wyżej, plus:
8. Dodaj typ do sectionType enum w schema
9. Stwórz `apps/engine/src/components/sections/{Type}Section.astro`
10. Zarejestruj w `SectionDispatcher.astro` (componentMap + import)
11. Dodaj do DEFAULT_VARIANTS w `apps/engine/src/lib/pages.ts`

### Zasady wizualne dla portfolio-tech theme
- Używaj gradient text na głównych nagłówkach
- Glassmorphism na kartach: `backdrop-blur-md bg-card/60 border border-white/10`
- Multi-layer shadows: `shadow-lg shadow-primary/20`
- Hover: scale(1.03) + shadow elevation + border glow
- Animacje: staggered reveal z różnych kierunków
- CTA buttons: gradient bg + glow shadow
```

### 2.4 Stwórz skill `/clone-design` (NOWY SKILL)

Opis poniżej w sekcji 3.

### 2.5 Dziel task na micro-taski

Zamiast jednego mega-taska, rozbij na:
```
task6-hero.md      → "Hero section should match xtract hero exactly"
task6-services.md  → "Services section cards layout and hover effects"
task6-process.md   → "Process section with code snippets and dashboard mockups"
...
```

Każdy micro-task:
1. Screenshot oryginału (Playwright)
2. Implementacja
3. Screenshot wyniku
4. Porównanie i iteracja
5. Commit

---

## 3. SKILL: `/clone-design` — Specyfikacja

### Cel
Skill który pozwala wziąć URL strony-wzoru i odtworzyć jej design sekcja po sekcji, tworząc nowe warianty komponentów tam gdzie potrzeba.

### Workflow skilla

```
/clone-design https://example.com portfolio-tech
```

**Krok 1: Analiza źródła**
- Playwright → screenshot pełnej strony i każdej sekcji osobno
- WebFetch → pobranie HTML/CSS
- Identyfikacja sekcji i mapowanie na istniejące typy (hero, services, process, etc.)
- Wyciągnięcie palety kolorów, typografii, spacing

**Krok 2: Audit istniejących wariantów**
- Dla każdej zidentyfikowanej sekcji sprawdź istniejące warianty
- Screenshot każdego wariantu z aktualnymi danymi
- Ocena podobieństwa wizualnego (skala 1-10):
  - 8-10: użyj istniejącego wariantu, drobne CSS tweaki
  - 4-7: stwórz nowy wariant bazujący na istniejącym
  - 1-3: stwórz kompletnie nowy wariant

**Krok 3: Implementacja sekcja po sekcji**
- Dla każdej sekcji (od góry do dołu):
  1. Zaimplementuj wariant
  2. Zaktualizuj schema jeśli potrzeba nowych pól
  3. Screenshot i porównanie z oryginałem
  4. Iteruj (max 3 iteracje per sekcja)
  5. Commit

**Krok 4: Theme integration**
- Zaktualizuj business JSON z nowymi wariantami
- Zaktualizuj majorThemes.ts
- Seed do bazy danych
- Finalne porównanie full-page screenshot

### Plik skilla: `.claude/skills/clone-design.md`

```markdown
---
name: clone-design
description: Clone a website's visual design into a new template using existing or new section variants
---

## Instrukcje

Użytkownik podaje URL strony-wzoru i nazwę template'u docelowego.

### Wymagane narzędzia
- Playwright MCP (screenshoty)
- WebFetch (HTML/CSS analiza)

### Kroki

1. **ANALIZA** — Zrób screenshot każdej sekcji strony-wzoru osobno. Pobierz HTML/CSS.
   Dla każdej sekcji zapisz: typ, layout, kolory, typografia, shadows, animations, unique patterns.

2. **MAPOWANIE** — Zmapuj każdą sekcję na istniejący typ w schemacie.
   Jeśli sekcja nie pasuje do żadnego typu → zaproponuj nowy typ.
   Sprawdź istniejące warianty każdego typu.

3. **DECYZJA** — Dla każdej sekcji zdecyduj:
   - REUSE: istniejący wariant wystarczy (>80% podobieństwa)
   - NEW_VARIANT: potrzebny nowy wariant istniejącego typu
   - NEW_SECTION: potrzebny nowy typ sekcji
   NIE BÓJ SIĘ tworzyć nowych wariantów! Lepszy pixel-perfect nowy wariant niż kompromisowy reuse.

4. **IMPLEMENTACJA** — Sekcja po sekcji, od góry:
   a. Implementuj komponent w packages/ui/src/sections/
   b. Zarejestruj w index.ts, SectionDispatcher, schema
   c. Screenshot wyniku
   d. Porównaj z oryginałem
   e. Iteruj aż różnica < 20%
   f. Commit

5. **FINALIZACJA**
   a. Zaktualizuj business JSON
   b. Zaktualizuj majorThemes.ts
   c. pnpm generate && pnpm build
   d. Seed do bazy
   e. Full-page screenshot comparison

### Checklist nowego wariantu
1. `packages/ui/src/sections/{type}/{VariantName}.tsx`
2. `packages/ui/src/sections/{type}/index.ts` — eksport
3. `packages/ui/src/sections/index.ts` — eksport
4. `apps/engine/src/components/sections/{Type}Section.astro` — branch
5. `packages/schema/src/business.schema.json` — variant enum
6. `cd packages/schema && pnpm generate`
7. `packages/ui/src/themes/majorThemes.ts` — opcjonalnie

### Checklist nowego typu sekcji
Kroki 1-7 jak wyżej, plus:
8. sectionType enum w schema
9. Nowy `apps/engine/src/components/sections/{Type}Section.astro`
10. Rejestracja w `SectionDispatcher.astro`
11. DEFAULT_VARIANTS w `apps/engine/src/lib/pages.ts`

### Zasady
- ZAWSZE rób screenshoty po implementacji i porównuj z oryginałem
- Nie bój się tworzyć nowych wariantów — pixel-perfect > reuse
- Kolory, spacing, typography → wyciągnij z oryginału, wstaw do theme.colors / theme.typography / theme.ui
- Obrazy/wideo → pobierz i wgraj na Cloudflare (R2 lub Images)
- Każda sekcja = osobny commit
- Max 3 iteracje per sekcja, potem idź dalej
```

---

## 4. REKOMENDOWANE MCP I NARZĘDZIA

### Must-have (instaluj natychmiast)

| Narzędzie | Komenda | Po co |
|---|---|---|
| **Playwright MCP** | `claude mcp add playwright npx @playwright/mcp@latest` | Screenshoty, porównywanie stron, iteracja wizualna |
| **Figma MCP** | `claude mcp add --transport http figma https://mcp.figma.com/mcp` | Czytanie designów z Figma, design tokens |

### Nice-to-have

| Narzędzie | Po co |
|---|---|
| [Glance](https://www.producthunt.com/products/glance-give-claude-code-a-real-browser) | Pełna przeglądarka z visual regression testing |
| [mcp-screenshot-website-fast](https://lobehub.com/mcp/just-every-mcp-screenshot-website-fast) | Szybsze screenshoty zoptymalizowane pod Vision API |
| [Image Analyze Skill](https://mcpmarket.com/tools/skills/image-analyze-comparison) | AI-powered porównywanie obrazów (Gemini) + pixel-level diffing |

### Workflow combo

```
Figma MCP → odczytaj design tokens i strukturę
    ↓
/clone-design → implementuj sekcja po sekcji
    ↓
Playwright MCP → screenshot i porównanie
    ↓
Iteracja → aż będzie pixel-perfect
```

---

## 5. ULEPSZONY PROCES GENEROWANIA TEMPLATE'U

### Obecny proces (broken)
```
1. Napisz task "zrób jak ta strona"
2. Claude implementuje na ślepo
3. Wynik daleko od oryginału
4. Frustracja
```

### Proponowany proces

```
FAZA 1: PRZYGOTOWANIE
├── Podłącz Playwright MCP + Figma MCP
├── Screenshot strony-wzoru (full + per-section)
├── WebFetch HTML/CSS
└── Spisz design system: kolory, fonty, spacing, shadows, animations

FAZA 2: MAPOWANIE
├── Lista sekcji strony-wzoru
├── Mapowanie na istniejące typy
├── Decyzja: REUSE / NEW_VARIANT / NEW_SECTION per sekcja
└── Plan implementacji (kolejność sekcji)

FAZA 3: IMPLEMENTACJA (per sekcja)
├── Kod komponentu
├── Schema update (jeśli potrzeba)
├── Screenshot wyniku
├── Porównanie z oryginałem
├── Iteracja (max 3x)
└── Commit

FAZA 4: INTEGRACJA
├── Business JSON z wszystkimi sekcjami
├── majorThemes.ts update
├── pnpm generate && pnpm build
├── db:seed
└── Full-page comparison screenshot

FAZA 5: POLISH
├── Responsywność (mobile screenshot)
├── Animacje i hover states
├── Drobne korekty spacing/typography
└── Final comparison
```

---

## 6. CO ZMIENIĆ W CLAUDE.md

### Rekomendowane sekcje do dodania

1. **Architektura sekcji** — checklist dodawania wariantu/typu (patrz 2.3)
2. **Design guidelines per majorTheme** — zasady wizualne dla portfolio-tech vs specialist
3. **Workflow klonowania designu** — kroki z Playwright MCP
4. **Ważne pliki** — lista kluczowych plików do modyfikacji przy dodawaniu sekcji

### Czego NIE wpisywać w CLAUDE.md
- Szczegóły implementacji konkretnych komponentów (to jest w kodzie)
- Pełne listy wariantów (to jest w `majorThemes.ts` i `index.ts`)
- Dane template'ów (to jest w JSON-ach)

---

## 7. PODSUMOWANIE PRIORYTETÓW

| # | Akcja | Impact | Effort |
|---|---|---|---|
| 1 | **Podłącz Playwright MCP** | 🔴 Krytyczny | 1 min |
| 2 | **Podłącz Figma MCP** | 🟠 Wysoki | 5 min |
| 3 | **Stwórz skill `/clone-design`** | 🟠 Wysoki | 30 min |
| 4 | **Rozbuduj CLAUDE.md** | 🟡 Średni | 15 min |
| 5 | **Podziel task6 na micro-taski** | 🟡 Średni | 10 min |
| 6 | **Zainstaluj dodatkowe MCP** | 🟢 Nice-to-have | 5 min |
| 7 | **Re-implementuj portfolio-tech** z nowym workflow | 🔴 Krytyczny | 2-4h |

**Najważniejsze:** Bez Playwright MCP cały proces jest skazany na porażkę. To jest #1 priorytet.
