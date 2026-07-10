import type { APIRoute } from "astro";
import { createBusinessLeads, getBusinessDeduplicationKeys } from "@mshorizon/db";
import type { NewSite } from "@mshorizon/db";

const OVERPASS_INSTANCES = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// OSM tag presets: label → { key, value }
const OSM_PRESETS: Record<string, { key: string; value: string }> = {
  electrician: { key: "craft", value: "electrician" },
  plumber: { key: "craft", value: "plumber" },
  hairdresser: { key: "shop", value: "hairdresser" },
  dentist: { key: "amenity", value: "dentist" },
  restaurant: { key: "amenity", value: "restaurant" },
  cafe: { key: "amenity", value: "cafe" },
  lawyer: { key: "office", value: "lawyer" },
  notary: { key: "office", value: "notary" },
  accountant: { key: "office", value: "accountant" },
  doctor: { key: "amenity", value: "doctors" },
  pharmacy: { key: "amenity", value: "pharmacy" },
  car_repair: { key: "shop", value: "car_repair" },
  beauty: { key: "shop", value: "beauty" },
  gym: { key: "leisure", value: "fitness_centre" },
  florist: { key: "shop", value: "florist" },
  carpenter: { key: "craft", value: "carpenter" },
  painter: { key: "craft", value: "painter" },
  locksmith: { key: "craft", value: "locksmith" },
  hotel: { key: "tourism", value: "hotel" },
  veterinary: { key: "amenity", value: "veterinary" },
};

// Major Polish cities: bbox [south, west, north, east]
const CITY_BBOX: Record<string, [number, number, number, number]> = {
  "Kraków": [49.97, 19.79, 50.13, 20.12],
  "Warszawa": [52.10, 20.85, 52.37, 21.17],
  "Wrocław": [51.05, 16.87, 51.18, 17.13],
  "Poznań": [52.33, 16.82, 52.47, 17.02],
  "Gdańsk": [54.30, 18.52, 54.42, 18.73],
  "Łódź": [51.68, 19.37, 51.83, 19.57],
  "Katowice": [50.22, 18.92, 50.30, 19.07],
  "Lublin": [51.19, 22.47, 51.30, 22.62],
  "Szczecin": [53.38, 14.48, 53.47, 14.62],
  "Bydgoszcz": [53.08, 17.93, 53.17, 18.13],
};

function buildBboxQuery(tagKey: string, tagValue: string, bbox: [number, number, number, number], limit: number): string {
  const [s, w, n, e] = bbox;
  return `[out:json][timeout:60];
(
  node["${tagKey}"="${tagValue}"](${s},${w},${n},${e});
  way["${tagKey}"="${tagValue}"](${s},${w},${n},${e});
);
out center tags ${limit};`;
}

function buildAreaQuery(tagKey: string, tagValue: string, cityName: string, limit: number): string {
  return `[out:json][timeout:60];
area["name"="${cityName}"]["boundary"="administrative"];
(
  node["${tagKey}"="${tagValue}"](area);
  way["${tagKey}"="${tagValue}"](area);
);
out center tags ${limit};`;
}

// Escape a string for safe use inside an Overpass double-quoted literal.
function osmEscape(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Category keys probed for a custom (non-preset) business type.
const GENERIC_KEYS = ["shop", "craft", "amenity", "office", "leisure", "tourism", "healthcare"];

// Build a query for an arbitrary business type with no known OSM preset.
// Probes the sanitized value across common category keys AND does a
// case-insensitive name regex match so free-form terms still return results.
function buildGenericBboxQuery(term: string, bbox: [number, number, number, number], limit: number): string {
  const [s, w, n, e] = bbox;
  const bb = `(${s},${w},${n},${e})`;
  const value = osmEscape(term.toLowerCase().replace(/\s+/g, "_"));
  const nameRe = osmEscape(term);
  const clauses = GENERIC_KEYS.flatMap((k) => [
    `  node["${k}"="${value}"]${bb};`,
    `  way["${k}"="${value}"]${bb};`,
  ]);
  clauses.push(`  node["name"~"${nameRe}",i]${bb};`);
  clauses.push(`  way["name"~"${nameRe}",i]${bb};`);
  return `[out:json][timeout:60];
(
${clauses.join("\n")}
);
out center tags ${limit};`;
}

function buildGenericAreaQuery(term: string, cityName: string, limit: number): string {
  const value = osmEscape(term.toLowerCase().replace(/\s+/g, "_"));
  const nameRe = osmEscape(term);
  const clauses = GENERIC_KEYS.flatMap((k) => [
    `  node["${k}"="${value}"](area);`,
    `  way["${k}"="${value}"](area);`,
  ]);
  clauses.push(`  node["name"~"${nameRe}",i](area);`);
  clauses.push(`  way["name"~"${nameRe}",i](area);`);
  return `[out:json][timeout:60];
area["name"="${osmEscape(cityName)}"]["boundary"="administrative"];
(
${clauses.join("\n")}
);
out center tags ${limit};`;
}

interface OsmElement {
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

function parseElement(el: OsmElement, businessType: string, city: string): Omit<NewSite, "config" | "translations"> | null {
  const tags = el.tags ?? {};
  const name = tags["name"];
  if (!name) return null;

  const street = tags["addr:street"] ?? "";
  const housenumber = tags["addr:housenumber"] ?? "";
  const postcode = tags["addr:postcode"] ?? "";
  const addrCity = tags["addr:city"] ?? city;
  const parts: string[] = [];
  if (street) parts.push(housenumber ? `${street} ${housenumber}` : street);
  if (postcode) parts.push(postcode);
  if (addrCity) parts.push(addrCity);

  return {
    businessName: name,
    industry: businessType,
    city,
    address: parts.join(", "),
    phone: tags["phone"] ?? tags["contact:phone"] ?? "",
    email: tags["email"] ?? tags["contact:email"] ?? "",
    website: tags["website"] ?? tags["contact:website"] ?? tags["url"] ?? "",
    source: "osm",
    status: "lead",
  };
}

type DeduplicationEntry = { name: string; city: string; phone: string; email: string };

function isDuplicate(lead: Omit<NewSite, "config" | "translations">, existing: DeduplicationEntry[]): boolean {
  const nameCity = `${lead.businessName.toLowerCase().trim()}|${(lead.city ?? "").toLowerCase().trim()}`;
  for (const e of existing) {
    if (`${e.name.toLowerCase().trim()}|${e.city.toLowerCase().trim()}` === nameCity) return true;
    if (lead.phone && e.phone && lead.phone.trim() === e.phone.trim()) return true;
    if (lead.email && e.email && lead.email.toLowerCase().trim() === e.email.toLowerCase().trim()) return true;
  }
  return false;
}

const forbidden = () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") return forbidden();

  let body: { count?: number; businessType?: string; city?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { count = 10, businessType, city = "Kraków" } = body;
  if (!businessType) return json({ error: "businessType required" }, 400);

  const preset = OSM_PRESETS[businessType.toLowerCase()];
  const bbox = CITY_BBOX[city];
  let query: string;
  if (preset) {
    query = bbox
      ? buildBboxQuery(preset.key, preset.value, bbox, count * 3)
      : buildAreaQuery(preset.key, preset.value, city, count * 3);
  } else {
    // No known preset — fall back to a generic multi-key + name search
    // so arbitrary/custom business types still return results.
    query = bbox
      ? buildGenericBboxQuery(businessType, bbox, count * 3)
      : buildGenericAreaQuery(businessType, city, count * 3);
  }

  let osmData: { elements: OsmElement[] } | null = null;
  let lastError = "";
  for (const instance of OVERPASS_INSTANCES) {
    try {
      const res = await fetch(`${instance}?data=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "hazelgrouse-factory/1.0" },
      });
      if (!res.ok) { lastError = `HTTP ${res.status} from ${instance}`; continue; }
      osmData = await res.json();
      break;
    } catch (err: any) {
      lastError = err.message;
    }
  }
  if (!osmData) return json({ error: `Overpass API error: ${lastError}` }, 502);

  const existing = await getBusinessDeduplicationKeys();
  const newBusinesses: Omit<NewSite, "config" | "translations">[] = [];

  for (const el of osmData.elements) {
    if (newBusinesses.length >= count) break;
    const biz = parseElement(el, businessType, city);
    if (!biz) continue;
    if (isDuplicate(biz, existing)) continue;
    if (isDuplicate(biz, newBusinesses.map(b => ({ name: b.businessName, city: b.city ?? "", phone: b.phone ?? "", email: b.email ?? "" })))) continue;
    newBusinesses.push(biz);
  }

  if (newBusinesses.length === 0) {
    return json({ saved: 0, businesses: [], message: "No new businesses found (all duplicates or empty results)" });
  }

  const saved = await createBusinessLeads(newBusinesses);
  return json({ saved: saved.length, businesses: saved });
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ presets: Object.keys(OSM_PRESETS), cities: Object.keys(CITY_BBOX) }), {
    headers: { "Content-Type": "application/json" },
  });
};
