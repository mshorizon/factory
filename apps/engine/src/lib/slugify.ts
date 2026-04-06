import { getSiteBySubdomain } from "@mshorizon/db";

const POLISH_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n",
  ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n",
  Ó: "o", Ś: "s", Ź: "z", Ż: "z",
};

const RESERVED_WORDS = new Set([
  "admin", "api", "www", "mail", "static", "creator",
  "login", "auth", "app", "dashboard", "panel", "test",
]);

export function slugify(text: string): string {
  return text
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_MAP[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function generateUniqueSubdomain(businessName: string): Promise<string> {
  const base = slugify(businessName);
  if (!base) throw new Error("Cannot generate subdomain from empty business name");

  if (!RESERVED_WORDS.has(base)) {
    const existing = await getSiteBySubdomain(base);
    if (!existing) return base;
  }

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    const existing = await getSiteBySubdomain(candidate);
    if (!existing) return candidate;
  }

  throw new Error("Unable to generate unique subdomain — all variants taken");
}
