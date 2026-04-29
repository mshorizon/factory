import { test, expect } from "@playwright/test";

const TEST_HOST = process.env.TEST_HOST || "localhost:4321";
const SUBDOMAIN = "template-law";
const BASE = `http://${SUBDOMAIN}.${TEST_HOST}`;

const PAGES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "files", path: "/files" },
  { name: "contact", path: "/contact" },
  { name: "informations", path: "/informations" },
  { name: "rodo", path: "/rodo" },
] as const;

// ─── Visual regression guard ──────────────────────────────────────────────────

test.describe("portfolio-law — visual regression", () => {
  test("all pages return 200", async ({ page }) => {
    for (const { name, path } of PAGES) {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "load",
        timeout: 30000,
      });
      expect(response?.status(), `${name} (${path}) should return 200`).toBe(200);
    }
  });

  for (const { name, path } of PAGES) {
    test(`${name} — full page`, async ({ page, browserName }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot(`${name}-${browserName}-full.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.03,
        timeout: 15000,
      });
    });

    test(`${name} — above fold`, async ({ page, browserName }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${name}-${browserName}-fold.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.03,
        timeout: 10000,
      });
    });
  }
});

// ─── Navbar ───────────────────────────────────────────────────────────────────

test.describe("portfolio-law — navbar", () => {
  test("logo text is visible on every page", async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await expect(page.locator("nav").getByText(/Marcin Starzec/)).toBeVisible();
    }
  });

  test("navigation links are visible on desktop", async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width < 1024, "desktop only — links hidden behind hamburger on mobile");

    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
    const nav = page.locator("nav");
    for (const label of ["O mnie", "Informacje", "Do pobrania", "Kontakt"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });
});

// ─── Home page ────────────────────────────────────────────────────────────────

test.describe("portfolio-law — home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
  });

  test("hero renders badge, title and CTA", async ({ page }) => {
    await expect(page.getByText(/Komornik Sądowy/)).toBeVisible();
    await expect(page.getByText(/Profesjonalna egzekucja sądowa w Otwocku/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Skontaktuj się/ }).first()).toBeVisible();
  });

  test("services grid shows all 6 services", async ({ page }) => {
    for (const title of [
      "Egzekucja należności pieniężnych",
      "Eksmisje i opróżnienie lokalu",
      "Doręczanie korespondencji",
      "Zabezpieczenie roszczeń",
      "Sporządzanie spisu inwentarza",
      "Licytacje komornicze",
    ]) {
      await expect(page.getByText(title)).toBeVisible();
    }
  });

  test("about summary shows 4 stats", async ({ page }) => {
    for (const stat of ["15+", "5000+", "98%", "2721"]) {
      await expect(page.getByText(stat)).toBeVisible();
    }
  });

  test("features section lists all 6 integrated systems", async ({ page }) => {
    for (const system of ["CEPIK", "EPU", "PUE ZUS", "ePUAP", "OGNIVO", "BMS"]) {
      await expect(page.getByText(system)).toBeVisible();
    }
  });

  test("testimonials show all three reviewers", async ({ page }) => {
    for (const author of ["Marek Wiśniewski", "Anna Kowalska", "Piotr Nowak"]) {
      await expect(page.getByText(author)).toBeVisible();
    }
  });

  test("FAQ shows all 5 questions", async ({ page }) => {
    // Scroll into view to trigger client:visible hydration
    await page.getByText(/Często zadawane pytania/).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    for (const question of [
      "Jak złożyć wniosek egzekucyjny?",
      "Ile trwa postępowanie egzekucyjne?",
      "Jakie koszty wiążą się z egzekucją komorniczą?",
      "Czy mogę śledzić postęp mojej sprawy online?",
      "Jaki jest obszar właściwości kancelarii?",
    ]) {
      await expect(page.getByText(question)).toBeVisible();
    }
  });

  test("FAQ accordion expands answer on click", async ({ page }) => {
    await page.getByText(/Często zadawane pytania/).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const answer = page.getByText(/Wniosek egzekucyjny można złożyć osobiście/);
    await expect(answer).not.toBeVisible();

    await page.getByText("Jak złożyć wniosek egzekucyjny?").click();
    await expect(answer).toBeVisible({ timeout: 2000 });
  });

  test("blog preview shows 3 articles", async ({ page }) => {
    await expect(page.getByText(/Aktualności prawne/)).toBeVisible();
    for (const title of [
      "Czym jest tytuł wykonawczy i jak go uzyskać?",
      "Prawa dłużnika w postępowaniu egzekucyjnym",
      "Elektroniczne Postępowanie Upominawcze (EPU) — przewodnik",
    ]) {
      await expect(page.getByText(title)).toBeVisible();
    }
  });
});

// ─── About page ───────────────────────────────────────────────────────────────

test.describe("portfolio-law — about page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/about`, { waitUntil: "load", timeout: 30000 });
  });

  test("story section has business name as heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Komornik Sądowy Marcin Starzec/ })
    ).toBeVisible();
  });

  test("career timeline shows 3 chronological entries", async ({ page }) => {
    await expect(page.getByText(/Kariera zawodowa/)).toBeVisible();
    for (const year of ["2010", "2006", "2004"]) {
      await expect(page.getByText(new RegExp(year))).toBeVisible();
    }
    await expect(
      page.getByText(/Komornik Sądowy przy Sądzie Rejonowym w Otwocku/)
    ).toBeVisible();
  });

  test("jurisdiction section is present", async ({ page }) => {
    await expect(page.getByText(/Właściwość terytorialna/)).toBeVisible();
  });
});

// ─── Files page ───────────────────────────────────────────────────────────────

test.describe("portfolio-law — files page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/files`, { waitUntil: "load", timeout: 30000 });
  });

  test("page header renders", async ({ page }) => {
    await expect(page.getByText(/Formularze i dokumenty/)).toBeVisible();
  });

  test("all 4 file groups are listed", async ({ page }) => {
    for (const group of [
      "Wnioski egzekucyjne",
      "Skargi i oświadczenia",
      "Doręczenia i ustalenia",
      "Wykaz majątku",
    ]) {
      await expect(page.getByText(group)).toBeVisible();
    }
  });

  test("all 7 file names are displayed", async ({ page }) => {
    for (const name of [
      "Wniosek o wszczęcie postępowania egzekucyjnego",
      "Wniosek o rozłożenie długu na raty",
      "Skarga na czynności komornika",
      "Oświadczenie o wyborze komornika",
      "Wniosek o dokonanie doręczenia pisma procesowego",
      "Wniosek o ustalenie aktualnego miejsca zamieszkania",
      "Wykaz majątku – formularz",
    ]) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("exactly 7 PDF download links are present", async ({ page }) => {
    const pdfLinks = page.locator("a[download][href$='.pdf']");
    await expect(pdfLinks.first()).toBeVisible();
    expect(await pdfLinks.count()).toBe(7);
  });
});

// ─── Contact page ─────────────────────────────────────────────────────────────

test.describe("portfolio-law — contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/contact`, { waitUntil: "load", timeout: 30000 });
  });

  test("contact details are visible", async ({ page }) => {
    await expect(page.getByText(/\+48 22 180 00 22/)).toBeVisible();
    await expect(page.getByText(/otwock\.starzec@komornik\.pl/)).toBeVisible();
    await expect(page.getByText(/Staszica 27/)).toBeVisible();
  });

  test("bank account number is displayed", async ({ page }) => {
    await expect(
      page.getByText(/93 24900005 0000 4530 4237 7611/)
    ).toBeVisible();
  });

  test("contact form has all fields and submit button", async ({ page }) => {
    await expect(page.getByPlaceholder("Twoje imię i nazwisko")).toBeVisible();
    await expect(page.getByPlaceholder("twoj@email.pl")).toBeVisible();
    await expect(page.getByPlaceholder(/Opisz swoją sprawę/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Wyślij wiadomość/ })
    ).toBeVisible();
  });

  test("map section header is present", async ({ page }) => {
    await expect(page.getByText(/Znajdź nas/)).toBeVisible();
  });
});

// ─── Informations page ────────────────────────────────────────────────────────

test.describe("portfolio-law — informations page", () => {
  test("section header renders correctly", async ({ page }) => {
    await page.goto(`${BASE}/informations`, { waitUntil: "load", timeout: 30000 });
    await expect(
      page.getByText(/Przewodnik po postępowaniu egzekucyjnym/)
    ).toBeVisible();
  });
});

// ─── RODO page ────────────────────────────────────────────────────────────────

test.describe("portfolio-law — RODO page", () => {
  test("RODO content loads", async ({ page }) => {
    await page.goto(`${BASE}/rodo`, { waitUntil: "load", timeout: 30000 });
    await expect(page.getByText(/RODO/)).toBeVisible();
    // Blog standalone renders inside main — verify article area exists
    await expect(page.locator("main")).toBeVisible();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────

test.describe("portfolio-law — footer", () => {
  test("footer shows name and full contact info", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
    const footer = page.locator("footer");
    await expect(footer.getByText(/Marcin Starzec/)).toBeVisible();
    await expect(footer.getByText(/otwock\.starzec@komornik\.pl/)).toBeVisible();
    await expect(footer.getByText(/\+48 22 180 00 22/)).toBeVisible();
  });
});

// ─── SEO: page titles ─────────────────────────────────────────────────────────

test.describe("portfolio-law — SEO", () => {
  const titleChecks = [
    // Home uses business.name directly
    { path: "/", pattern: /Komornik Sądowy Marcin Starzec/ },
    { path: "/about", pattern: /O mnie/ },
    { path: "/files", pattern: /Do pobrania/ },
    { path: "/contact", pattern: /Kontakt/ },
    { path: "/informations", pattern: /Informacje/ },
    { path: "/rodo", pattern: /RODO/ },
  ] as const;

  for (const { path, pattern } of titleChecks) {
    test(`${path} has descriptive <title>`, async ({ page }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await expect(page).toHaveTitle(pattern);
    });
  }
});

// ─── Navigation & routing ─────────────────────────────────────────────────────

test.describe("portfolio-law — routing", () => {
  test("navbar 'O mnie' link navigates to /about", async ({ page }) => {
    const vp = page.viewportSize();
    test.skip(!vp || vp.width < 1024, "desktop only");

    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
    await page.locator("nav").getByRole("link", { name: "O mnie" }).click();
    await page.waitForURL(/\/about/, { timeout: 10000 });
  });

  test("footer 'Kontakt' link navigates to /contact", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
    await page.locator("footer").getByRole("link", { name: "Kontakt" }).first().click();
    await page.waitForURL(/\/contact/, { timeout: 10000 });
  });
});
