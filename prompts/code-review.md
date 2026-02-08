# MS Horizon Factory - Comprehensive Code Review

## Project Overview
Multi-tenant "Site Factory" — Astro + React + Turborepo monorepo that generates unique websites for local businesses from JSON configurations stored in PostgreSQL.

---

## CRITICAL Issues (Must Fix Immediately)

### 1. No Authentication on Admin Panel & API Routes
- **Files**: `apps/engine/src/pages/admin/index.astro`, `apps/engine/src/pages/api/admin/draft.ts`, `save.ts`, `save-translations.ts`, `upload-image.ts`
- The entire admin panel is publicly accessible. Anyone can visit `/admin` and modify any business configuration. All API endpoints (`/api/admin/*`) accept requests without any auth check.
- **Fix**: Add authentication middleware (JWT, session-based, or OAuth). Protect all `/admin` routes and `/api/admin/*` endpoints. Validate that the authenticated user has permission to modify the specific `businessId` they're targeting.

### 2. Theme Preset Enum Mismatch (TypeScript vs JSON Schema)
- **File**: `packages/schema/src/types.ts:178` — `ThemeV15.preset` typed as `"industrial" | "wellness" | "minimal"`
- **File**: `packages/schema/src/business-v15.schema.json` — `preset` enum is `["industrial", "elegant", "modern", "classic", "bold"]`
- Only `"industrial"` is shared. The JSON schema rejects what TypeScript allows and vice versa. This means runtime validation and compile-time types are contradicting each other.
- **Fix**: Unify the enum. Pick one source of truth and generate the other.

### 3. SectionType Mismatch (TypeScript vs JSON Schema)
- **File**: `packages/schema/src/types.ts:17` — `SectionType = "hero" | "services" | "categories" | "about" | "contact" | "shop"`
- **File**: `packages/schema/src/business-v15.schema.json` — Section type enum includes `"gallery"`, `"testimonials"` but NOT `"shop"`
- The JSON schema accepts gallery/testimonials (no UI exists for them) and rejects "shop" (which is fully implemented).
- **Fix**: Add `"shop"` to JSON schema. Either implement gallery/testimonials UI or remove from schema.

### 4. Astro Locals Typed as `any`
- **File**: `apps/engine/src/env.d.ts:9-11`
```typescript
businessData: any;
theme: any;
t: Record<string, any>;
```
- This eliminates all type checking for the most critical data flowing through the entire application.
- **Fix**: Type as `BusinessProfileV15`, `ThemeV15`, and `Record<string, Record<string, string>>`.

### 5. Save API Accepts Data Without Schema Validation
- **File**: `apps/engine/src/pages/api/admin/save.ts:17-21`
- Only checks for existence of `schemaVersion`, `business`, and `theme` fields. Does NOT validate against JSON schema before writing to database. Malformed or corrupt data can be persisted.
- **Fix**: Run AJV validation against the v1.5 schema before calling `upsertSiteConfig()`.

### 6. Upload API Path Traversal Risk
- **File**: `apps/engine/src/pages/api/admin/upload-image.ts:50-51`
- `businessId` from form data is used directly in R2 key (`${businessId}/${sanitizedName}`) without sanitization. Could contain `../` path traversal characters.
- **Fix**: Sanitize `businessId` the same way `sanitizedName` is sanitized.

---

## HIGH Severity Issues

### 7. Database Queried Multiple Times Per Request
- **File**: `apps/engine/src/middleware.ts:49` — `getAvailableBusinessIds()` called on every request
- **File**: `apps/engine/src/lib/business.ts:60-61, 71-72` — Called again during hostname resolution
- A single page load can trigger 3+ database queries just for business ID resolution.
- **Fix**: Cache the result of `getAvailableBusinessIds()` with a short TTL (30-60s) or use a single call.

### 8. 404 Handling Uses Redirect Instead of Proper Status
- **File**: `apps/engine/src/pages/[...slug].astro:30`
- `return Astro.redirect("/404")` sends a 302 redirect to `/404`, which doesn't exist — creating a potential redirect loop. Search engines will not properly index this as a 404.
- **Fix**: Return `new Response(null, { status: 404 })` or use Astro's built-in 404 page.

### 9. SectionDispatcher Types v1.0 But Receives v1.5 Data
- **File**: `apps/engine/src/components/SectionDispatcher.astro:12`
- `Props.sections` typed as `Section[]` (v1.0) but receives v1.5 `SectionV15[]` data.
- **Fix**: Update to `SectionV15[]` type.

### 10. HTML Lang Hardcoded Despite i18n Support
- **File**: `apps/engine/src/layouts/BaseLayout.astro:102`
- `<html lang="en">` is hardcoded even though the app has full i18n with language detection.
- **Fix**: Use `<html lang={currentLang}>` from locals.

### 11. Footer Variant Mismatch
- **File**: `packages/schema/src/types.ts:7` — `FooterVariant` has 6 variants (simple, multiColumn, minimal, centered, branded, stacked)
- **File**: `packages/schema/src/business.schema.json` — Footer variant enum only allows `["simple", "multiColumn"]`
- JSON schema rejects 4 valid footer variants.
- **Fix**: Sync the JSON schema with the TypeScript type.

### 12. Missing v1.5 Validator Export
- **File**: `packages/schema/src/validator.ts`
- Exports `validateBusinessProfile` (v1.0) and `validateThemeSchema` but NO v1.5 business profile validator.
- **Fix**: Add `validateBusinessProfileV15()` function using `business-v15.schema.json`.

---

## MEDIUM Severity Issues

### 13. Hardcoded Colors (Theming Violations)

The CLAUDE.md says "NO hardcoded colors". Here are all violations:

| File | Line(s) | Violation |
|------|---------|-----------|
| `packages/ui/src/atoms/Button.tsx` | 14 | `bg-red-500 text-white hover:bg-red-500/90` |
| `packages/ui/src/atoms/Badge.tsx` | 15 | `bg-red-500 text-white` |
| `packages/ui/src/atoms/ScrollToTop.tsx` | ~95 | `text-white` |
| `packages/ui/src/sections/hero/HeroDefault.tsx` | 48,67,79,119 | `text-white`, `bg-black/50` |
| `packages/ui/src/sections/categories/CategoriesFeatured.tsx` | 38,45,49,53 | `text-white`, `from-black/80`, `via-black/40` |
| `packages/ui/src/sections/footer/FooterSimple.tsx` | 20 | `bg-secondary text-white` |
| `packages/ui/src/sections/footer/FooterMultiColumn.tsx` | varies | `text-white` |
| `packages/ui/src/sections/footer/FooterCentered.tsx` | varies | `text-white` |
| `packages/ui/src/sections/footer/FooterBranded.tsx` | varies | `text-white` |
| `packages/ui/src/sections/shop/CartPageContent.tsx` | ~132 | `text-red-500 hover:text-red-600 hover:bg-red-50` |
| `apps/engine/src/components/admin/AdminForm.tsx` | 390-413 | `border-gray-200`, `bg-gray-100`, `text-gray-700`, `text-gray-600`, `border-gray-300`, `focus:border-blue-500`, `focus:ring-blue-500`, `text-gray-500` |
| `apps/engine/src/components/admin/widgets/ColorPickerWidget.tsx` | 44,50 | `bg-white` |
| `apps/engine/src/components/admin/widgets/ImageUrlWidget.tsx` | ~15 | `border-gray-300` |

**Fix**: Replace all hardcoded colors with semantic tokens (`bg-primary`, `text-foreground`, `bg-destructive`, `text-on-primary`, etc.). Add missing tokens to the Tailwind config if needed.

### 14. In-Memory Draft Store Has No Limits
- **File**: `apps/engine/src/lib/draft-store.ts:12`
- `const drafts = new Map<string, DraftData>()` — no max size, no TTL, no eviction policy. Memory grows unbounded.
- **Fix**: Add max size + TTL eviction, or use Redis/database for drafts.

### 15. Contact & Categories Sections Access Non-Existent Properties
- **File**: `apps/engine/src/components/sections/ContactSection.astro:24` — `section.labels` (doesn't exist on type)
- **File**: `apps/engine/src/components/sections/CategoriesSection.astro:25` — `section.exploreLabel` (doesn't exist on type)
- These will always be `undefined`, meaning certain UI features silently fail.
- **Fix**: Add `labels` and `exploreLabel` to the `SectionV15` type, or remove usage.

### 16. Footer.astro Massive Code Duplication
- **File**: `apps/engine/src/components/Footer.astro` (~330 lines)
- All 6 footer variants inlined as conditional blocks. Each variant duplicates language switcher code.
- **Fix**: Extract each variant into its own sub-component.

### 17. AdminForm.tsx is a 755-Line Monolith
- **File**: `apps/engine/src/components/admin/AdminForm.tsx`
- Contains sidebar, tab nav, content rendering, draft management, save/revert logic, translations editor, page management in one file.
- **Fix**: Decompose into smaller, focused components (Sidebar, TabContent, DraftManager, TranslationsEditor, etc.).

### 18. Supported Languages Hardcoded to Only "en" and "pl"
- **Files**: `packages/ui/src/lib/languages.ts:6-9`, `apps/engine/src/lib/business.ts:13`, `apps/engine/src/lib/draft-store.ts:7-8`
- No way to add more languages without modifying source code in multiple places.
- **Fix**: Make language list configurable per-business, stored in the business config.

### 19. Hardcoded Polish String
- **File**: `apps/engine/src/components/sections/ShopSection.astro:27` — `"Brak w magazynie"` (Polish for "Out of Stock") hardcoded as default
- **Fix**: Use translation system (`t:` key).

### 20. ShopGrid Default Currency Hardcoded
- **File**: `packages/ui/src/sections/shop/ShopGrid.tsx:11` — default currency is `"zl"` (Polish zloty)
- UI package is supposed to be industry-agnostic and locale-agnostic.
- **Fix**: Require currency as a prop with no default, or derive from business config.

### 21. CheckoutPageContent Hardcoded Strings
- **File**: `packages/ui/src/sections/shop/CheckoutPageContent.tsx:51,53` — `"Your cart is empty"` and `"Continue Shopping"` hardcoded
- **Fix**: Accept as props or use translation keys.

### 22. Three Divergent Theme Schemas
- `theme.schema.json` uses flat color structure (`colors.primary`)
- `business-v15.schema.json` uses nested structure (`colors.light.primary`, `colors.light.surface.base`)
- TypeScript `ThemeV15` type uses yet another variation
- **Fix**: Consolidate into a single source of truth. Generate TypeScript types from JSON schema.

### 23. `DEFAULT_VARIANTS` Missing Entries
- **File**: `apps/engine/src/lib/pages.ts:4-9`
- Typed as `Record<SectionType, string>` but only has entries for `hero`, `services`, `about`, `contact`. Missing: `categories`, `shop`.
- **Fix**: Add entries for all `SectionType` values.

### 24. Adapter Hardcodes Color Fallbacks
- **File**: `apps/engine/src/lib/adapter.ts:122-123`
- `muted: theme.colors.muted || "#64748b"` and `onPrimary: "#ffffff"` are hardcoded.
- **Fix**: Derive fallback colors from the theme or use semantic defaults.

### 25. Brittle Light/Dark Mode Detection
- **File**: `apps/engine/src/lib/adapter.ts:108-109`
- Compares hex color strings lexicographically to determine light vs dark mode. Works by coincidence for some values, unreliable in general.
- **Fix**: Parse hex to RGB and compare luminance values.

---

## LOW Severity Issues

### 26. Dead Code: `containerVariants` in StaggerContainer
- **File**: `packages/ui/src/animations/StaggerContainer.tsx:30-37`
- Module-level `containerVariants` constant defined but never used.
- **Fix**: Delete it.

### 27. `useFieldUpdater` Naming Convention Violation
- **File**: `apps/engine/src/components/admin/SectionEditor.tsx:~50`
- Named like a React hook (`use` prefix) but is a regular function.
- **Fix**: Rename to `createFieldUpdater` or `getFieldUpdater`.

### 28. Duplicate `ThemeV10` Interface Definition
- **Files**: `apps/engine/src/layouts/BaseLayout.astro:8-35` and `apps/engine/src/lib/adapter.ts:16-47`
- Same interface defined in two places.
- **Fix**: Define once in `packages/schema` and import.

### 29. CLAUDE.md References Non-Existent `data/` Directory
- The project has migrated to PostgreSQL but CLAUDE.md still says `data/*.json` is the "Git-based CMS".
- **Fix**: Update documentation.

### 30. Seed Script & Migration Script Reference Non-Existent `data/` Directory
- **Files**: `packages/db/src/seed.ts:14`, `scripts/migrate-images-to-r2.ts:187`
- Both reference `data/` directory that doesn't exist.
- **Fix**: Update or remove these scripts.

### 31. `config` JSONB Column Lacks Type Annotation
- **File**: `packages/db/src/schema.ts:8`
- `config: jsonb("config").notNull()` has no `$type<BusinessProfileV15>()` annotation.
- **Fix**: Add `.$type<BusinessProfileV15>()`.

### 32. No Database Connection Pooling Config
- **File**: `packages/db/src/client.ts`
- `postgres()` client created with no pool configuration (max connections, idle timeout).
- **Fix**: Add pool config for production workloads.

### 33. `updateSiteTranslations` Performs Shallow Merge
- **File**: `packages/db/src/queries.ts:60-63`
- Spread operator does shallow merge — updating one key in a language replaces the entire language object.
- **Fix**: Use deep merge or structure updates differently.

### 34. Dark Mode Defined But Never Used
- `ThemeV15` supports dark colors, all 3 presets define dark mode values, but `BaseLayout.astro` only reads `theme.colors.light`. No dark mode toggle or `prefers-color-scheme` exists.
- Dead data and dead code paths.

### 35. `globalVariant` and `buttonStyle` Defined But Never Used
- `ThemeV15.globalVariant` is defined in types, preserved by resolver, but never read.
- `ui.buttonStyle` is defined in all presets but no component reads it.

### 36. `deepResolveImages` Only Processes Known Field Names
- **File**: `apps/engine/src/lib/images.ts:72`
- Only processes fields named `image`, `backgroundImage`, `logo`, `icon`, `favicon`, `src`. Custom image field names will not be resolved.
- **Fix**: Make the field name list configurable or resolve all string values that look like image paths.

### 37. Checkout Page Has No Form Submission
- **File**: `apps/engine/src/pages/checkout.astro`
- "Place Order" button has no handler. Checkout flow is incomplete.

### 38. MotionComponent Casting May Fail at Runtime
- **File**: `packages/ui/src/animations/StaggerContainer.tsx:99`
- `motion[as as keyof typeof motion]` — if `as` is an unsupported tag, this produces a runtime error.

### 39. `initDb` and `initR2` Called on Every Request
- **File**: `apps/engine/src/middleware.ts:17-26`
- Both are called on every request. While they use lazy init internally, the config objects are recreated each time.

### 40. `domainMap` Evaluated at Module Load Time
- **File**: `apps/engine/src/lib/business.ts:26`
- `const domainMap = getDomainMap()` — changes to `DOMAIN_MAP` env var after startup won't take effect.

### 41. Default Language Hardcoded as Polish
- **File**: `apps/engine/src/lib/business.ts:15` — `defaultLanguage: Language = "pl"`
- Should be configurable per-business.

### 42. Default Business Hardcoded as "barber"
- **File**: `apps/engine/src/lib/business.ts:27` — fallback `|| "barber"` is business-specific.

### 43. Engine Tailwind Config May Diverge From Shared Config
- **Files**: `apps/engine/tailwind.config.mjs` vs `packages/config/tailwind.config.js`
- Both define their own color token mappings independently. If they drift, UI package and engine will have different tokens.

### 44. Shared Tailwind Config Missing Tokens
- **File**: `packages/config/tailwind.config.js`
- Missing: `text-on-primary`, shadow utilities mapped to CSS vars, `radius-sm`/`radius-lg`/`radius-full` border radius variants.

### 45. Gallery & Testimonials Referenced But Not Implemented
- `business-v15.schema.json` includes gallery and testimonials as valid section types
- `SectionEditor.tsx` has variant options for them
- No Astro components, no UI components, no dispatcher entries exist
- Selecting these in admin produces empty/broken sections

### 46. `FooterProps.variant` Type Too Narrow
- **File**: `packages/ui/src/sections/footer/types.ts:56`
- Typed as `"simple" | "multiColumn"` but 5+ footer component variants exist.

### 47. Pervasive `as any` Casts in `[...slug].astro`
- **File**: `apps/engine/src/pages/[...slug].astro:40,55,61,63,70,71`
- Multiple `as any` casts that defeat the purpose of having typed schemas.

---

## Architecture Observations

### What's Working Well
1. **Monorepo structure** is clean — clear workspace separation
2. **Theme resolver** in `packages/ui/src/themes/resolver.ts` is well-designed with deep merging
3. **Zustand cart store** with persistence is a solid choice
4. **R2 integration** for image uploads is well-implemented
5. **i18n system** with `t:` prefix translation keys is elegant
6. **CSS variable-based theming** approach in BaseLayout is correct

### Architecture Concerns
1. **v1.0/v1.5 schema duality** — the database stores v1.5, the adapter converts v1.0 to v1.5, but many components still type as v1.0. Consider completing the v1.5 migration and removing v1.0.
2. **Admin panel lives inside engine** — should be a separate `apps/admin` workspace for better separation of concerns and independent deployment.
3. **No testing** — zero test files found anywhere in the codebase. No unit tests, integration tests, or e2e tests.
4. **No CI/CD config** — no GitHub Actions, no deployment pipeline visible.
5. **No error boundaries** — React components have no error boundaries, so a single component crash can take down the whole page.
6. **No logging** — no structured logging anywhere. Console.log used sporadically in admin components.
7. **No rate limiting** — API endpoints have no rate limiting protection.

---

## Recommended Priority Order

1. Add authentication to admin panel and API routes (security)
2. Unify TypeScript types and JSON schemas (correctness)
3. Type `Astro.locals` properly (type safety)
4. Add schema validation to save API (data integrity)
5. Fix 404 handling (SEO/UX)
6. Cache business ID lookups (performance)
7. Replace all hardcoded colors with semantic tokens (theming)
8. Add at least basic integration tests (reliability)
9. Decompose AdminForm.tsx and Footer.astro (maintainability)
10. Complete v1.5 migration and remove v1.0 code (simplification)
