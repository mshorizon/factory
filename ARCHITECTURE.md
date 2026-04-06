# Factory — Architecture

> Multi-tenant SaaS platform for creating and managing business websites.
> Built as a pnpm monorepo with Astro SSR, React, PostgreSQL, and Drizzle ORM.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FACTORY MONOREPO                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    apps/engine (Astro SSR)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  Pages   │  │   API    │  │  Admin   │  │  Middleware  │  │  │
│  │  │ (SSR)    │  │  Routes  │  │  Panel   │  │  (Auth,     │  │  │
│  │  │          │  │  (REST)  │  │  (React) │  │   Routing)  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────┐  │
│  │    db    │  │  schema  │  │    ui    │  │ config │  │ tests │  │
│  │ Drizzle  │  │  JSON    │  │  React   │  │ Shared │  │ E2E + │  │
│  │ + Pg     │  │  Schema  │  │  Comps   │  │ Config │  │ Valid │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  └───────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
factory/
├── apps/
│   └── engine/                 # Astro SSR app (main entry point)
├── packages/
│   ├── db/                     # PostgreSQL + Drizzle ORM
│   ├── schema/                 # JSON Schema + TypeScript types
│   ├── ui/                     # React component library
│   ├── config/                 # Shared Tailwind + TypeScript configs
│   └── tests/                  # Playwright visual + validation tests
├── package.json                # Root — pnpm workspace
├── turbo.json                  # Turborepo task orchestration
└── pnpm-lock.yaml
```

| Package | Purpose | Key Tech |
|---------|---------|----------|
| `@mshorizon/engine` | Full-stack SSR app | Astro 5, React 19, Tailwind |
| `@mshorizon/db` | Database layer | Drizzle ORM, PostgreSQL |
| `@mshorizon/schema` | Business profile validation | JSON Schema, AJV |
| `@mshorizon/ui` | Reusable section components | React, Framer Motion, Zustand |
| `@mshorizon/config` | Shared build configs | Tailwind, TypeScript |
| `@mshorizon/tests` | Testing infrastructure | Playwright |

---

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant BusinessResolver
    participant DB
    participant PageRenderer
    participant APIHandler

    Client->>Middleware: HTTP Request
    Middleware->>Middleware: Init DB, R2, Logger
    Middleware->>BusinessResolver: Resolve businessId from hostname
    BusinessResolver->>DB: getSiteBySubdomain()
    DB-->>BusinessResolver: Site config + translations
    BusinessResolver-->>Middleware: BusinessContext

    alt Page Request (/*.astro)
        Middleware->>PageRenderer: locals = { businessData, theme, ... }
        PageRenderer->>PageRenderer: SSR with SectionDispatcher
        PageRenderer-->>Client: HTML Response
    else API Request (/api/*)
        Middleware->>Middleware: Check auth (JWT cookie)
        Middleware->>APIHandler: Forward with locals
        APIHandler->>DB: Query/Mutate
        APIHandler-->>Client: JSON Response
    end

    Middleware->>Middleware: Log response (pino)
    Middleware->>Middleware: Track 5xx errors
```

---

## Multi-Tenancy Architecture

A single deployment serves multiple businesses. Each business is identified by its **subdomain** and has isolated data in the `sites` table.

```mermaid
graph TD
    subgraph "Domain Resolution"
        A[barber.hazelgrouse.pl] -->|subdomain: barber| D[sites table]
        B[specialist.dev.hazelgrouse.pl] -->|subdomain: specialist| D
        C[custom-domain.pl] -->|DOMAIN_MAP lookup| D
    end

    subgraph "Per-Business Data"
        D --> E[config — JSONB<br/>Full BusinessProfile]
        D --> F[translations — JSONB]
        D --> G[blogs]
        D --> H[projects]
        D --> I[comments]
        D --> J[push subscriptions]
        D --> K[health checks]
    end
```

**Resolution order:**
1. `?business=X` query param (if valid)
2. Exact match in `DOMAIN_MAP` env (JSON)
3. Subdomain extraction from `BASE_DOMAIN`
4. `DEFAULT_BUSINESS` fallback

---

## Database Schema

```mermaid
erDiagram
    sites ||--o{ blogs : "has many"
    sites ||--o{ projects : "has many"
    sites ||--o{ push_subscriptions : "has many"
    sites ||--o{ health_checks : "monitored by"
    sites ||--o{ alerts : "alerts for"
    blogs ||--o{ comments : "has many"

    sites {
        serial id PK
        text subdomain UK
        text business_name
        text industry
        jsonb config
        jsonb translations
        text umami_website_id
        timestamp created_at
        timestamp updated_at
    }

    blogs {
        serial id PK
        int site_id FK
        text slug
        text lang
        text title
        text content
        text status
        timestamp published_at
    }

    projects {
        serial id PK
        int site_id FK
        text slug
        text lang
        text title
        text status
        timestamp published_at
    }

    comments {
        serial id PK
        int blog_id FK
        text author_name
        text author_email
        text content
        text status
        text ip_address
    }

    push_subscriptions {
        serial id PK
        int site_id FK
        text endpoint UK
        text p256dh
        text auth
        boolean active
    }

    health_checks {
        serial id PK
        int site_id FK
        text status
        jsonb checks
        int latency_ms
        timestamp checked_at
    }

    alerts {
        serial id PK
        int site_id FK
        text type
        text channel
        text message
        jsonb metadata
        timestamp sent_at
    }

    users {
        serial id PK
        text email UK
        text password_hash
        text role
        text business_id
        timestamp last_login_at
    }

    login_attempts {
        serial id PK
        text email
        text ip_address
        boolean success
        timestamp attempted_at
    }
```

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login (JWT + HttpOnly cookie) |
| POST | `/api/auth/logout` | Logout (clear cookies) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/reset-password-request` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Admin (auth required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/save` | Save business config (validates against schema) |
| POST | `/api/admin/save-translations` | Save translations |
| POST | `/api/admin/draft` | Store draft for preview |
| POST | `/api/admin/translate` | Translate text (MyMemory API) |
| POST | `/api/admin/upload-image` | Upload image to R2 (max 10MB) |
| GET/POST | `/api/admin/users` | User management (super-admin) |
| GET | `/api/admin/health-checks` | Health check history + stats |
| GET/POST/PUT/DELETE | `/api/admin/blogs/*` | Blog CRUD |
| GET/POST/PUT/DELETE | `/api/admin/projects/*` | Project CRUD |
| GET/POST | `/api/admin/comments/*` | Comment moderation |
| POST | `/api/admin/notifications/test-sms` | Send test SMS |

### Public
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/contact` | Contact form (rate limited, CAPTCHA) |
| POST | `/api/comments/submit` | Submit blog comment |
| GET | `/api/analytics` | Umami analytics data |
| GET | `/api/health` | Health check (DB, R2, business) |
| GET | `/api/manifest.webmanifest` | PWA manifest |
| POST | `/api/notifications/subscribe` | Web push subscribe |
| POST | `/api/notifications/unsubscribe` | Web push unsubscribe |
| GET | `/api/notifications/vapid-public-key` | VAPID public key |
| POST | `/api/creator` | AI website creator (rate limited, CAPTCHA) |

---

## Admin Panel

The admin dashboard is a React SPA mounted in an Astro page at `/admin`. It uses shadcn/ui, Recharts, TanStack Table, and RJSF (React JSON Schema Form).

```mermaid
graph LR
    subgraph "Sidebar Navigation"
        direction TB
        G1["General"]
        G1 --> T1[Business]
        G1 --> T2[Notifications]
        G1 --> T3[Translations]

        G2["Data"]
        G2 --> T4[Products]
        G2 --> T5[Services]
        G2 --> T6[Blog]
        G2 --> T7[Projects]

        G3["Layout"]
        G3 --> T8[Theme]
        G3 --> T9[Navbar]
        G3 --> T10[Footer]

        G4["Insights"]
        G4 --> T11[Analytics]
        G4 --> T12[Status]

        G5["Admin"]
        G5 --> T13[Users]
    end

    subgraph "Content Area"
        T1 --> F1[RJSF Form Editor]
        T6 --> F2[Blog Management<br/>+ Lexical Editor]
        T8 --> F3[Color Picker<br/>+ Typography]
        T11 --> F4[Umami Charts<br/>Recharts]
        T12 --> F5[Health Dashboard<br/>Uptime + Latency]
    end

    subgraph "Preview"
        F1 --> P[Live Preview<br/>iframe ?_preview=1]
    end
```

**Key features:**
- Live preview via iframe with `?_preview=1` query param
- In-memory draft storage (30-min TTL) for preview before save
- Keyboard shortcut Cmd/Ctrl+S to save
- Dark mode toggle
- Schema validation (AJV) before save

---

## Page Rendering Pipeline

```mermaid
graph TD
    A["Request: /services/haircut"] --> B[Middleware resolves businessId]
    B --> C["Fetch BusinessProfile from DB"]
    C --> D["Apply translations<br/>(deepTranslate)"]
    D --> E["Find page by slug<br/>pages.haircut"]
    E --> F["Iterate page.sections[]"]
    F --> G["SectionDispatcher.astro"]

    G --> H1["type: hero → HeroSection"]
    G --> H2["type: services → ServicesSection"]
    G --> H3["type: contact → ContactSection"]
    G --> H4["type: ref → Shared Section lookup"]

    H1 --> I["Resolve variant<br/>(e.g., hero-split)"]
    I --> J["Render @mshorizon/ui component<br/>(HeroSplit, HeroDefault, ...)"]
    J --> K["Final HTML"]
```

**Section types:** `hero` | `services` | `categories` | `about` | `about-summary` | `mission` | `contact` | `shop` | `gallery` | `testimonials` | `process` | `serviceArea` | `trustBar` | `galleryBA` | `faq` | `features` | `ctaBanner` | `blog` | `map` | `ref`

Each section type supports multiple **variants** (e.g., hero has: default, split, minimal, gradient, cards, video).

---

## External Integrations

```mermaid
graph TB
    subgraph "Factory Engine"
        MW[Middleware]
        API[API Routes]
        CRON[Health Cron]
    end

    subgraph "Data"
        PG[(PostgreSQL)]
        R2[(Cloudflare R2<br/>Object Storage)]
    end

    subgraph "Communication"
        RS[Resend<br/>Email API]
        SMS[SMSAPI / Twilio<br/>SMS]
        WP[Web Push<br/>VAPID]
        SL[Slack<br/>Webhooks]
    end

    subgraph "Security"
        TN[Cloudflare Turnstile<br/>CAPTCHA]
        ST[Sentry<br/>Error Tracking]
    end

    subgraph "Analytics & Translation"
        UM[Umami<br/>Analytics]
        MM[MyMemory<br/>Translation API]
    end

    MW --> PG
    MW --> ST
    API --> PG
    API --> R2
    API --> RS
    API --> SMS
    API --> WP
    API --> TN
    API --> UM
    API --> MM
    CRON --> PG
    CRON --> RS
    CRON --> SL
```

| Integration | Library / Protocol | Purpose |
|-------------|-------------------|---------|
| **PostgreSQL** | `postgres` + `drizzle-orm` | Primary data store |
| **Cloudflare R2** | `@aws-sdk/client-s3` (S3-compatible) | Image/asset storage |
| **Resend** | `resend` | Contact form emails, alert emails |
| **SMSAPI / Twilio** | HTTP API | SMS notifications on new contacts |
| **Web Push** | `web-push` (VAPID) | Browser push notifications |
| **Cloudflare Turnstile** | HTTP verify API | CAPTCHA for forms |
| **Sentry** | `@sentry/astro` | Error tracking (frontend + backend) |
| **Umami** | HTTP API (self-hosted) | Privacy-focused analytics |
| **MyMemory** | HTTP API (free tier) | AI translation for i18n |
| **Slack** | Incoming Webhooks | Alert notifications |

---

## Monitoring Stack

```mermaid
graph LR
    subgraph "Structured Logging"
        A[pino] --> B[JSON stdout<br/>production]
        A --> C[pino-pretty<br/>development]
    end

    subgraph "Error Tracking"
        D[Sentry] --> E[Server errors<br/>sentry.server.config.ts]
        D --> F[Client errors<br/>sentry.client.config.ts]
        D --> G[React ErrorBoundary]
    end

    subgraph "Health Checks"
        H[GET /api/health] --> I[DB: SELECT 1]
        H --> J[R2: config check]
        H --> K[Business: exists?]
        L[health-cron.ts] -->|every 5 min| I
        L -->|store results| M[(health_checks table)]
    end

    subgraph "Alerting"
        M --> N{status != healthy?}
        N -->|yes| O[Email via Resend]
        N -->|yes| P[Slack webhook]
        Q[5xx error tracker] -->|threshold: 10/5min| O
    end
```

**Health check response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-03-27T10:00:00Z",
  "businessId": "specialist",
  "checks": {
    "database": { "status": "up", "latencyMs": 12 },
    "r2": { "status": "up", "latencyMs": 0 }
  },
  "latencyMs": 15,
  "version": "0.0.1"
}
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthAPI
    participant DB

    User->>LoginPage: Email + Password
    LoginPage->>AuthAPI: POST /api/auth/login

    AuthAPI->>DB: getRecentFailedAttempts(email)
    alt >= 10 failed in 15min
        AuthAPI-->>User: 429 Rate Limited
    end

    AuthAPI->>DB: getUserByEmail(email)
    AuthAPI->>AuthAPI: bcrypt.verify(password, hash)
    AuthAPI->>DB: logLoginAttempt(email, ip, success)

    alt Success
        AuthAPI->>AuthAPI: Sign JWT (access + refresh)
        AuthAPI->>AuthAPI: Set HttpOnly cookies
        AuthAPI-->>User: 200 + user info
    else Failure
        AuthAPI-->>User: 401 Invalid credentials
    end

    Note over User,DB: Subsequent requests
    User->>AuthAPI: Request with cookie
    AuthAPI->>AuthAPI: Middleware verifies JWT
    AuthAPI->>AuthAPI: locals.auth = { userId, email, role, businessId }
```

**Roles:**
- `super-admin` — Full access to all businesses + user management
- `admin` — Scoped to assigned `businessId`
- `editor` — Limited permissions (future)

---

## BusinessProfile Schema

The `config` JSONB column in `sites` stores the full business configuration:

```
BusinessProfile
├── business
│   ├── id, name, industry
│   ├── assets: { favicon, logo, icon }
│   ├── contact: { address, phone, email, hours, location: {lat, lng} }
│   ├── socials: { [platform]: url }
│   ├── serviceArea: string[]
│   ├── googleRating: { score, count }
│   └── trustSignals: [{ icon, text }]
│
├── theme
│   ├── preset: industrial|wellness|minimal|elegant|modern|classic|bold
│   ├── mode: light|dark
│   ├── colors: { light: {...}, dark: {...} }
│   ├── typography: { primary, secondary, baseSize }
│   └── ui: { radius, spacing, buttonStyle }
│
├── layout
│   ├── navbar: { variant, extensions }
│   └── footer: { variant, copyright, tagline, links, columns }
│
├── navigation
│   ├── links: [{ label, target: {type, value} }]
│   └── cta: { label, target }
│
├── pages
│   └── [slug]: { title, hideFromNav, sections: [Section] }
│
├── sharedSections
│   └── [id]: Section
│
├── data
│   ├── services: [Service]
│   └── products: [Product]
│
└── notifications
    ├── sms: { enabled, provider, phoneNumber, apiToken, ... }
    └── push: { enabled }
```

---

## UI Component Library (`@mshorizon/ui`)

```
@mshorizon/ui
├── atoms/
│   ├── Badge, Button, Card, Input, Label, Textarea
│   ├── CookieConsent, LanguageSwitcher, ScrollToTop
│   ├── SectionHeader, StickyMobileCTA, Turnstile
│   └── DottedMap (Poland service area visualization)
│
├── sections/
│   ├── hero/          HeroDefault, HeroSplit, HeroMinimal, HeroGradient, HeroCards, HeroVideo
│   ├── services/      ServicesGrid, ServicesList, ServicesDarkCards, ServicesImageGrid
│   ├── about/         AboutStory, AboutSummary, AboutTimeline
│   ├── contact/       ContactCentered, ContactSplit
│   ├── gallery/       GalleryGrid
│   ├── galleryBA/     GalleryBA (Before/After)
│   ├── testimonials/  TestimonialsGrid
│   ├── faq/           FAQAccordion
│   ├── features/      FeaturesGrid
│   ├── process/       ProcessSteps
│   ├── ctaBanner/     CtaBannerDefault, CtaBannerTicker
│   ├── blog/          BlogGrid
│   ├── project/       ProjectGrid
│   ├── categories/    CategoriesCarousel, CategoriesFeatured
│   ├── map/           GoogleMap
│   ├── serviceArea/   ServiceArea
│   ├── trustBar/      TrustBar
│   ├── shop/          ShopGrid, ProductCard, CartButton, CheckoutPageContent
│   ├── navbar/        NavbarStandard, NavbarCentered
│   └── footer/        FooterSimple, FooterMultiColumn, FooterMinimal, ...
│
├── animations/        ScrollReveal, StaggerContainer
├── themes/            Preset definitions + color resolution
└── store/             useCart (Zustand)
```

---

## i18n Architecture

```mermaid
graph LR
    A[BusinessProfile<br/>primary language] --> B[translations JSONB<br/>per-language overrides]
    B --> C["deepTranslate()<br/>merge base + overrides"]
    C --> D[Rendered page<br/>in target language]

    E["Admin: Translate tab"] --> F["POST /api/admin/translate<br/>MyMemory API"]
    F --> G["Chunks ≤480 chars<br/>respects rate limits"]
    G --> B
```

**Supported languages:** `en` (English), `pl` (Polish), `de` (German), `uk` (Ukrainian)

Translation keys use `t:keyname` prefix syntax. The `deepTranslate()` function recursively walks the BusinessProfile and replaces values with translations from the override map.

---

## Environment Variables

```env
# === Required ===
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret-key

# === Business Routing ===
DOMAIN_MAP='{"domain.pl":"businessId"}'
DEFAULT_BUSINESS=honey-worker
BASE_DOMAIN=hazelgrouse.pl

# === Cloudflare R2 (Object Storage) ===
R2_ENDPOINT=https://account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=factory-assets
R2_PUBLIC_DOMAIN=https://cdn.example.com

# === Email (Resend) ===
RESEND_API_KEY=re_...

# === Analytics (Umami) ===
UMAMI_URL=https://umami.example.com
UMAMI_USERNAME=admin
UMAMI_PASSWORD=...

# === CAPTCHA (Cloudflare Turnstile) ===
TURNSTILE_SECRET_KEY=0x...
TURNSTILE_SITE_KEY=0x...

# === Web Push (VAPID) ===
VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:noreply@hazelgrouse.pl

# === Error Tracking (Sentry — optional) ===
SENTRY_DSN=https://...@sentry.io/...
SENTRY_PROJECT=factory-engine
SENTRY_AUTH_TOKEN=sntrys_...
PUBLIC_SENTRY_DSN=https://...  # client-side

# === Alerting (optional) ===
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL_FROM=noreply@contact.hazelgrouse.pl

# === AI Website Creator (Gemini) ===
GEMINI_API_KEY=AIza...

# === Server ===
PORT=4321
NODE_ENV=production
```

---

## Self-Service Website Creator

The creator allows potential clients to generate a complete business website through a multi-step wizard on the portfolio-tech site.

### Flow

```mermaid
sequenceDiagram
    participant Client
    participant CreatorWizard
    participant CreatorAPI
    participant GeminiAI
    participant DB

    Client->>CreatorWizard: Opens /creator
    CreatorWizard->>CreatorWizard: 5-step form (basics, details, online, style, review)
    Client->>CreatorWizard: Fills form + CAPTCHA
    CreatorWizard->>CreatorAPI: POST /api/creator

    CreatorAPI->>CreatorAPI: Validate fields + rate limit (3/h/IP)
    CreatorAPI->>CreatorAPI: Verify Turnstile CAPTCHA
    CreatorAPI->>DB: Check email uniqueness
    CreatorAPI->>CreatorAPI: Generate subdomain (slugify + collision check)

    CreatorAPI->>GeminiAI: Generate BusinessProfile JSON
    Note over GeminiAI: System prompt includes full JSON Schema,<br/>available section types/variants,<br/>theme presets, and guidelines
    GeminiAI-->>CreatorAPI: Raw JSON

    CreatorAPI->>CreatorAPI: Validate vs business.schema.json (AJV)
    alt Validation fails
        CreatorAPI->>GeminiAI: Retry with error feedback
        GeminiAI-->>CreatorAPI: Corrected JSON
    end

    CreatorAPI->>DB: upsertSiteConfig(subdomain, config)
    CreatorAPI->>DB: createUser(email, hash, role=admin, businessId)
    CreatorAPI->>CreatorAPI: Sign JWT + set auth cookies
    CreatorAPI-->>CreatorWizard: { success, subdomain, redirectUrl }
    CreatorWizard-->>Client: Redirect to admin panel
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/engine/src/pages/creator.astro` | Astro page (portfolio-tech only guard) |
| `apps/engine/src/components/creator/CreatorWizard.tsx` | React wizard (5 steps + progress + success screens) |
| `apps/engine/src/pages/api/creator.ts` | POST endpoint — orchestrates generation, validation, DB insert, user creation, auth |
| `apps/engine/src/lib/claude.ts` | Gemini API integration — prompt engineering, JSON parsing, retry logic |
| `apps/engine/src/lib/slugify.ts` | Subdomain generation — Polish char handling, collision check, reserved words |

### Wizard Steps

1. **Podstawy** — business name, industry (select), email, password, phone
2. **Szczegóły** — description, services/prices, hours, address
3. **Online** — website URL, Google Maps, Facebook, Instagram, LinkedIn, TikTok
4. **Styl** — theme preset selection (modern, bold, elegant, industrial, wellness, classic)
5. **Podsumowanie** — review all data + Turnstile CAPTCHA + submit

### AI Generation

- **Model:** Gemini 2.5 Flash (free tier: 15 RPM, 1M tokens/month)
- **System prompt** contains: full `business.schema.json`, available section types with variants, theme presets, content guidelines
- **Output:** Complete BusinessProfile JSON with pages (home + 4-6 subpages), services, theme, navigation, footer
- **Validation:** AJV against schema, retry once with error feedback if validation fails
- **Post-processing:** Overrides `business.id`, `contact.email`, `contact.phone`, `contact.address` with user-provided values

### Security

- Rate limit: 3 creations per IP per hour
- Cloudflare Turnstile CAPTCHA on submit
- Email uniqueness check
- Password: min 8 characters, bcrypt hashed
- Subdomain: sanitized (Polish chars, non-alphanum stripped), reserved words blacklist

### Environment

```env
GEMINI_API_KEY=AIza...    # Google AI Studio API key (free tier)
```

---

## Deployment

```bash
# Build
pnpm build

# Start (Node.js standalone)
node apps/engine/dist/server/entry.mjs

# Database sync (after schema changes)
pnpm -F @mshorizon/db db:push

# Seed admin user
pnpm -F @mshorizon/db db:seed-admin
```

**Runtime:** Node.js (Astro SSR standalone mode)
**Port:** configurable via `PORT` env, default `4321`
**HMR:** disabled (production-ready config)
**Allowed hosts:** all (`allowedHosts: true`)
