import type { APIRoute } from "astro";
import { createLeads, getLeadDeduplicationKeys } from "@mshorizon/db";
import type { NewLead } from "@mshorizon/db";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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

interface OsmElement {
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

function parseElement(el: OsmElement, businessType: string, city: string): NewLead | null {
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
    name,
    businessType,
    city,
    address: parts.join(", "),
    phone: tags["phone"] ?? tags["contact:phone"] ?? "",
    email: tags["email"] ?? tags["contact:email"] ?? "",
    website: tags["website"] ?? tags["contact:website"] ?? tags["url"] ?? "",
    source: "osm",
    status: "new",
  };
}

function isDuplicate(lead: NewLead, existing: { name: string; city: string; phone: string; email: string }[]): boolean {
  const nameCity = `${lead.name.toLowerCase().trim()}|${lead.city.toLowerCase().trim()}`;
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
  if (!preset) return json({ error: `Unknown businessType. Supported: ${Object.keys(OSM_PRESETS).join(", ")}` }, 400);

  const bbox = CITY_BBOX[city];
  const query = bbox
    ? buildBboxQuery(preset.key, preset.value, bbox, count * 3)
    : buildAreaQuery(preset.key, preset.value, city, count * 3);

  let osmData: { elements: OsmElement[] };
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    osmData = await res.json();
  } catch (err: any) {
    return json({ error: `Overpass API error: ${err.message}` }, 502);
  }

  const existing = await getLeadDeduplicationKeys();
  const newLeads: NewLead[] = [];

  for (const el of osmData.elements) {
    if (newLeads.length >= count) break;
    const lead = parseElement(el, businessType, city);
    if (!lead) continue;
    if (isDuplicate(lead, existing)) continue;
    // Also deduplicate within this batch
    if (isDuplicate(lead, newLeads.map(l => ({ name: l.name, city: l.city ?? "", phone: l.phone ?? "", email: l.email ?? "" })))) continue;
    newLeads.push(lead);
  }

  if (newLeads.length === 0) {
    return json({ saved: 0, leads: [], message: "No new leads found (all duplicates or empty results)" });
  }

  const saved = await createLeads(newLeads);
  return json({ saved: saved.length, leads: saved });
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ presets: Object.keys(OSM_PRESETS), cities: Object.keys(CITY_BBOX) }), {
    headers: { "Content-Type": "application/json" },
  });
};
