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

// 1. Add notarial-activities page to config
if (!config.pages) {
  config.pages = {};
}

if (config.pages["notarial-activities"]) {
  console.log("Page 'notarial-activities' already exists, skipping config update");
} else {
  config.pages["notarial-activities"] = {
    title: "Czynności notarialne",
    hideFromNav: false,
    sections: [
      {
        type: "blog-standalone",
        blogSlug: "czynnosci-notarialne",
      },
    ],
  };

  await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;
  console.log(`Updated ${subdomain}: added 'notarial-activities' page`);
}

// 2. Insert blog post if not already present
const blogSlug = "czynnosci-notarialne";
const lang = "pl";

const existing = await sql`
  SELECT id FROM blogs WHERE site_id = ${siteId} AND slug = ${blogSlug} AND lang = ${lang}
`;

if (existing.length > 0) {
  console.log(`Blog '${blogSlug}' [${lang}] already exists, skipping`);
} else {
  const content = `<p>Notariusz, jako funkcjonariusz publiczny, dokonuje czynności notarialnych w oparciu o obowiązujące przepisy prawa, w szczególności ustawę Prawo o notariacie. Czynności notarialnych notariusz dokonuje w kancelarii notarialnej lub w razie szczególnych okoliczności poza nią (np. w przypadku gdy osoba biorąca udział w czynności notarialnej nie może stawić się osobiście w kancelarii z powodu stanu zdrowia).</p>

<p>Zgodnie z art. 79 ustawy z dnia 14 lutego 1991 roku Prawo o notariacie, notariusz dokonuje następujących czynności:</p>

<ol>
<li>sporządza akty notarialne;</li>
<li>sporządza akty poświadczenia dziedziczenia;</li>
<li>podejmuje czynności dotyczące europejskiego poświadczenia spadkowego;</li>
<li>sporządza poświadczenia;</li>
<li>doręcza oświadczenia;</li>
<li>spisuje protokoły;</li>
<li>sporządza protesty weksli i czeków;</li>
<li>przyjmuje na przechowanie pieniądze, papiery wartościowe, dokumenty, dane na informatycznym nośniku danych, o którym mowa w przepisach o informatyzacji działalności podmiotów realizujących zadania publiczne;</li>
<li>sporządza wypisy, odpisy i wyciągi dokumentów;</li>
<li>sporządza, na żądanie stron, projekty aktów, oświadczeń i innych dokumentów;</li>
<li>składa wnioski o wpis w księdze wieczystej wraz z dokumentami stanowiącymi podstawę wpisu w księdze wieczystej;</li>
<li>sporządza inne czynności wynikające z odrębnych przepisów.</li>
</ol>`;

  await sql`
    INSERT INTO blogs (site_id, slug, lang, title, description, content, status, standalone, published_at)
    VALUES (
      ${siteId},
      ${blogSlug},
      ${lang},
      ${"Czynności notarialne"},
      ${"Zakres czynności notarialnych wykonywanych przez notariusza zgodnie z ustawą Prawo o notariacie."},
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
