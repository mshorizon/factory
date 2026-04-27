import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT id, config FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const siteId: number = rows[0].id;
const config = rows[0].config as any;

// 1. Add costs page to config
if (!config.pages) {
  config.pages = {};
}

if (config.pages["costs"]) {
  console.log("Page 'costs' already exists, skipping config update");
} else {
  config.pages["costs"] = {
    title: "Opłaty",
    hideFromNav: false,
    sections: [
      {
        type: "blog-standalone",
        blogSlug: "oplaty",
      },
    ],
  };

  await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;
  console.log(`Updated ${subdomain}: added 'costs' page`);
}

// 2. Insert blog post if not already present
const blogSlug = "oplaty";
const lang = "pl";

const existing = await sql`
  SELECT id FROM blogs WHERE site_id = ${siteId} AND slug = ${blogSlug} AND lang = ${lang}
`;

if (existing.length > 0) {
  console.log(`Blog '${blogSlug}' [${lang}] already exists, skipping`);
} else {
  const content = `<p>Dokonanie czynności notarialnej wiąże się z poniesieniem opłat, do których należą:</p>

<p><strong>Taksa notarialna</strong></p>

<p>Notariuszowi za dokonanie czynności notarialnych przysługuje wynagrodzenie, uzgodnione ze stronami czynności, nie wyższe niż maksymalne stawki taksy notarialnej właściwe dla danej czynności, szczegółowo określone w rozporządzeniu Ministra Sprawiedliwości z dnia 28 czerwca 2004 r. w sprawie maksymalnych stawek taksy notarialnej. Notariusz dolicza do taksy notarialnej 23% VAT.</p>

<p><strong>Podatki</strong><br> Notariusz jest płatnikiem podatku od czynności cywilnoprawnych oraz podatku od spadków i darowizn, pobieranych od czynności notarialnych podlegających opodatkowaniu.</p>

<p><strong>Opłata sądowa</strong><br> Notariusz pobiera opłatę sądową od wniosku o wpis do księgi wieczystej, którą szczegółowo reguluje ustawa o kosztach sądowych w sprawach cywilnych.</p>`;

  await sql`
    INSERT INTO blogs (site_id, slug, lang, title, description, content, status, standalone, published_at)
    VALUES (
      ${siteId},
      ${blogSlug},
      ${lang},
      ${"Opłaty"},
      ${"Informacje o opłatach związanych z dokonaniem czynności notarialnych: taksa notarialna, podatki i opłaty sądowe."},
      ${content},
      ${"published"},
      ${true},
      ${new Date("2026-04-27")}
    )
  `;
  console.log(`Inserted blog '${blogSlug}' [${lang}]`);
}

await sql.end();
console.log("Done.");
