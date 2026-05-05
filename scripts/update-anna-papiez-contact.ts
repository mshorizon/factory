#!/usr/bin/env tsx
/**
 * Update contact info for anna-papiez:
 * - Address: ul. Floriańska 12, 31-021 Kraków → ul. Mazowiecka 8, 30-036 Kraków
 * - Email: → anna.papiez@kin.pl
 * - Phone: → 697 233 378
 * - Hours: new per-day schedule
 */

import { initDb, getSiteBySubdomain, upsertSiteConfig, updateSiteTranslations } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const OLD_ADDRESS = "ul. Floriańska 12, 31-021 Kraków";
const NEW_ADDRESS = "ul. Mazowiecka 8, 30-036 Kraków";
const NEW_EMAIL = "anna.papiez@kin.pl";
const NEW_PHONE = "697 233 378";

function replaceAddress(text: string): string {
  return text
    .replace(/ul\. Floriańska 12, 31-021 Kraków/g, NEW_ADDRESS)
    .replace(/ul\. Floriańska 12, 31-021 Krakau/g, "ul. Mazowiecka 8, 30-036 Krakau")
    .replace(/ul\. Floriańska 12, 31-021 Краків/g, "вул. Мазовецька 8, 30-036 Краків")
    .replace(/вул\. Флоріанська 12, 31-021 Краків/g, "вул. Мазовецька 8, 30-036 Краків")
    .replace(/ul\. Floriańska 12/g, "ul. Mazowiecka 8")
    .replace(/ul\. Floriańska\b/g, "ul. Mazowiecka 8");
}

async function main() {
  const site = await getSiteBySubdomain("anna-papiez");
  if (!site) throw new Error("Site anna-papiez not found");

  const config = site.config as any;

  // ── Update business.contact ────────────────────────────────────────────
  config.business.contact.address = NEW_ADDRESS;
  config.business.contact.email = NEW_EMAIL;
  config.business.contact.phone = NEW_PHONE;
  if (config.business.contact.location) {
    config.business.contact.location.googlePlaceQuery =
      "Kancelaria Notarialna Kraków ul. Mazowiecka 8";
  }

  // ── Update contact page section ────────────────────────────────────────
  const contactPage = config.pages?.contact;
  if (contactPage?.sections) {
    for (const section of contactPage.sections) {
      if (section.type === "contact" && section.info) {
        section.info.address = NEW_ADDRESS;
        section.info.email = NEW_EMAIL;
        section.info.phone = NEW_PHONE;
        section.info.hoursDetailed = [
          "poniedziałek- 9:30-17:30",
          "wtorek,środa,czwartek- 8:30-16:30",
          "piątek- 8:00-14:00",
        ];
      }
    }
  }

  await upsertSiteConfig("anna-papiez", config);
  console.log("✓ Config updated");

  // ── Update translations ─────────────────────────────────────────────────
  const translations = site.translations as Record<string, Record<string, string>>;

  const langUpdates: Record<string, Record<string, string>> = {
    pl: {
      "contact.info.hours": "poniedziałek- 9:30-17:30\nwtorek,środa,czwartek- 8:30-16:30\npiątek- 8:00-14:00",
      "contact.info.hours.mon": "poniedziałek 9:30 – 17:30",
      "contact.info.hours.tue": "wtorek 8:30 – 16:30",
      "contact.info.hours.wed": "środa 8:30 – 16:30",
      "contact.info.hours.thu": "czwartek 8:30 – 16:30",
      "contact.info.hours.fri": "piątek 8:00 – 14:00",
      "contact.info.receptionHours": "poniedziałek – piątek (godziny zróżnicowane)",
    },
    en: {
      "contact.info.hours": "Mon: 9:30 AM – 5:30 PM; Tue–Thu: 8:30 AM – 4:30 PM; Fri: 8:00 AM – 2:00 PM",
      "contact.info.hours.mon": "Monday 9:30 AM – 5:30 PM",
      "contact.info.hours.tue": "Tuesday 8:30 AM – 4:30 PM",
      "contact.info.hours.wed": "Wednesday 8:30 AM – 4:30 PM",
      "contact.info.hours.thu": "Thursday 8:30 AM – 4:30 PM",
      "contact.info.hours.fri": "Friday 8:00 AM – 2:00 PM",
      "contact.info.receptionHours": "Monday – Friday (variable hours)",
    },
    de: {
      "contact.info.hours": "Mo: 9:30–17:30 Uhr; Di–Do: 8:30–16:30 Uhr; Fr: 8:00–14:00 Uhr",
      "contact.info.hours.mon": "Montag 9:30 – 17:30 Uhr",
      "contact.info.hours.tue": "Dienstag 8:30 – 16:30 Uhr",
      "contact.info.hours.wed": "Mittwoch 8:30 – 16:30 Uhr",
      "contact.info.hours.thu": "Donnerstag 8:30 – 16:30 Uhr",
      "contact.info.hours.fri": "Freitag 8:00 – 14:00 Uhr",
      "contact.info.receptionHours": "Montag – Freitag (unterschiedliche Zeiten)",
    },
    uk: {
      "contact.info.hours": "Пн: 9:30–17:30; Вт–Чт: 8:30–16:30; Пт: 8:00–14:00",
      "contact.info.hours.mon": "понеділок 9:30 – 17:30",
      "contact.info.hours.tue": "вівторок 8:30 – 16:30",
      "contact.info.hours.wed": "середа 8:30 – 16:30",
      "contact.info.hours.thu": "четвер 8:30 – 16:30",
      "contact.info.hours.fri": "п'ятниця 8:00 – 14:00",
      "contact.info.receptionHours": "понеділок – п'ятниця (різний графік)",
    },
  };

  // Apply address replacements and per-language hour updates
  const updatedTranslations: Record<string, Record<string, string>> = {};

  for (const [lang, langData] of Object.entries(translations)) {
    if (lang === "_settings") continue;
    const updated: Record<string, string> = {};
    for (const [key, value] of Object.entries(langData as Record<string, string>)) {
      if (typeof value === "string") {
        updated[key] = replaceAddress(value);
      } else {
        updated[key] = value;
      }
    }
    // Apply specific hour overrides
    const overrides = langUpdates[lang];
    if (overrides) {
      for (const [key, val] of Object.entries(overrides)) {
        updated[key] = val;
      }
    }
    updatedTranslations[lang] = updated;
  }

  await updateSiteTranslations("anna-papiez", updatedTranslations);
  console.log("✓ Translations updated");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
