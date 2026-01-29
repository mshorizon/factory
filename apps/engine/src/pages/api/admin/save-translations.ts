import type { APIRoute } from "astro";
import { writeFile } from "fs/promises";
import { join } from "path";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { businessId, translations } = await request.json();

    if (!businessId || !translations) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or translations" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const dataDir = join(process.cwd(), "..", "..", "data", businessId, "translations");

    // Save EN translations
    if (translations.en) {
      const enPath = join(dataDir, "en.json");
      await writeFile(enPath, JSON.stringify(translations.en, null, 2), "utf-8");
    }

    // Save PL translations
    if (translations.pl) {
      const plPath = join(dataDir, "pl.json");
      await writeFile(plPath, JSON.stringify(translations.pl, null, 2), "utf-8");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Translations saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving translations:", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to save translations"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
