import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import logger from "./logger.js";

export interface CreatorInput {
  businessName: string;
  industry: string;
  description: string;
  email: string;
  phone?: string;
  address?: string;
  hours?: string;
  services?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  socialLinks?: Record<string, string>;
  stylePreference?: string;
}

let schemaCache: string | null = null;

function getSchema(): string {
  if (schemaCache) return schemaCache;
  const schemaPath = resolve(
    process.cwd(),
    "../../packages/schema/src/business.schema.json"
  );
  schemaCache = readFileSync(schemaPath, "utf-8");
  return schemaCache;
}

const SECTION_VARIANTS = `Available section types and their variants:
- hero: default, split, gradient, cards, video, minimal
- services: grid, list, imageGrid, darkCards, featured
- categories: carousel, featured
- about: story, timeline
- about-summary: default
- mission: default
- contact: centered, split
- shop: default
- gallery: default
- testimonials: default
- process: default, visual
- serviceArea: default
- trustBar: default
- galleryBA: default
- faq: default
- features: default, compact
- ctaBanner: default, ticker
- blog: default
- map: default
- booking: default
- pricing: default
- project: grid, carousel
- comparison: default
- team: default`;

const THEME_PRESETS = `Available theme presets: industrial, wellness, minimal, elegant, modern, classic, bold`;

const SYSTEM_PROMPT = `You are a website configuration generator for a multi-tenant website builder platform.
Your task is to generate a complete, valid JSON configuration (BusinessProfile) for a new business website.

${THEME_PRESETS}

${SECTION_VARIANTS}

Available majorTheme values: specialist (for service businesses), portfolio-tech (for tech/portfolio sites)
Available navbar variants: standard, centered
Available footer variants: simple, multiColumn, minimal, centered, branded, stacked, gradient
Available theme modes: light, dark

For section backgrounds, use: "light", "dark", or "primary" to create visual variety between sections.

Guidelines:
1. Output ONLY raw valid JSON — no markdown fences, no comments, no explanation
2. Generate a homepage with 5-8 sections, plus at minimum: services, about, and contact pages
3. Use Unsplash image URLs relevant to the industry (format: https://images.unsplash.com/photo-XXXX?w=800&h=600&fit=crop)
4. Use real Unsplash photo IDs that match the business industry
5. Choose a theme preset and colors that match the business mood/industry
6. For text content, use the language matching the business location (Polish for Polish businesses)
7. Include realistic, compelling copy — headlines, descriptions, FAQ items, testimonials
8. Generate 3-5 services with descriptions, icons (use emoji), and prices
9. Alternate section backgrounds (light/dark/primary) for visual rhythm
10. Include a privacy page with FAQ-type content
11. Do NOT use "t:" translation keys — use actual text content directly
12. The business.id should be a URL-safe slug derived from the business name
13. Use Google Fonts names for typography (e.g., "Inter", "Poppins", "Montserrat")

Here is the JSON Schema that your output MUST conform to:

<schema>
${getSchema()}
</schema>`;

let _apiKey: string | null = null;

export function setGeminiApiKey(key: string) {
  _apiKey = key;
}

function getClient(): GoogleGenerativeAI {
  const apiKey = _apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateBusinessProfile(
  input: CreatorInput,
  subdomain: string
): Promise<Record<string, unknown>> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const userMessage = buildUserMessage(input, subdomain);

  logger.info({ subdomain, industry: input.industry }, "Generating business profile via Gemini API");

  const result = await model.generateContent(userMessage);
  const text = result.response.text().trim();

  return parseJsonResponse(text);
}

export async function retryGenerateWithErrors(
  input: CreatorInput,
  subdomain: string,
  previousOutput: string,
  validationErrors: string[]
): Promise<Record<string, unknown>> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const retryMessage = `The previously generated JSON had validation errors. Please fix them and return the corrected JSON.

Validation errors:
${validationErrors.map((e) => `- ${e}`).join("\n")}

Previous (invalid) output:
${previousOutput}

Return ONLY the corrected raw JSON, no markdown fences or explanation.`;

  logger.info({ subdomain, errorCount: validationErrors.length }, "Retrying generation with validation errors");

  const result = await model.generateContent(retryMessage);
  const text = result.response.text().trim();

  return parseJsonResponse(text);
}

function parseJsonResponse(text: string): Record<string, unknown> {
  let jsonText = text;

  // Strip markdown fences if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    logger.error({ err, responseLength: jsonText.length, first200: jsonText.slice(0, 200) }, "Failed to parse Gemini response as JSON");
    throw new Error("Generated configuration is not valid JSON");
  }
}

function buildUserMessage(input: CreatorInput, subdomain: string): string {
  const parts: string[] = [
    `Generate a complete BusinessProfile JSON for the following business:`,
    ``,
    `Business Name: ${input.businessName}`,
    `Industry: ${input.industry}`,
    `Business ID (subdomain): ${subdomain}`,
  ];

  if (input.description) {
    parts.push(``, `Business Description:`, input.description);
  }
  if (input.email) {
    parts.push(`Contact Email: ${input.email}`);
  }
  if (input.phone) {
    parts.push(`Phone: ${input.phone}`);
  }
  if (input.address) {
    parts.push(`Address: ${input.address}`);
  }
  if (input.hours) {
    parts.push(`Business Hours: ${input.hours}`);
  }
  if (input.services) {
    parts.push(``, `Services offered:`, input.services);
  }
  if (input.websiteUrl) {
    parts.push(`Current website: ${input.websiteUrl}`);
  }
  if (input.googleMapsUrl) {
    parts.push(`Google Maps: ${input.googleMapsUrl}`);
  }
  if (input.socialLinks && Object.keys(input.socialLinks).length > 0) {
    parts.push(``, `Social media:`);
    for (const [platform, url] of Object.entries(input.socialLinks)) {
      parts.push(`  ${platform}: ${url}`);
    }
  }
  if (input.stylePreference) {
    parts.push(``, `Style preference: ${input.stylePreference}`);
  }

  return parts.join("\n");
}
