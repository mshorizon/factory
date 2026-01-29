import type { APIRoute } from "astro";
import { writeFile } from "fs/promises";
import { join } from "path";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { businessId, data } = await request.json();

    if (!businessId || !data) {
      return new Response(
        JSON.stringify({ message: "Missing businessId or data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic validation
    if (!data.schemaVersion || !data.business || !data.theme) {
      return new Response(
        JSON.stringify({ message: "Invalid data: missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Construct the file path
    // In dev, we're in apps/engine, data is at ../../data
    // In prod, this path may need adjustment based on deployment
    const dataDir = join(process.cwd(), "..", "..", "data", businessId);
    const filePath = join(dataDir, `${businessId}.json`);

    // Write the file with pretty formatting
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    return new Response(
      JSON.stringify({ success: true, message: "Saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving business data:", error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Failed to save"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
