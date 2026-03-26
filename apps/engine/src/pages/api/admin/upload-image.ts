import type { APIRoute } from "astro";
import { uploadToR2 } from "../../../lib/r2";
import logger from "../../../lib/logger";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const businessId = formData.get("businessId") as string | null;

    if (!file || !businessId) {
      return new Response(
        JSON.stringify({ message: "Missing file or businessId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({ message: `File type not allowed: ${file.type}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ message: "File too large (max 10 MB)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sanitizedName = sanitizeFilename(file.name);
    const sanitizedBusinessId = sanitizeFilename(businessId);
    const key = `${sanitizedBusinessId}/${sanitizedName}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const url = await uploadToR2(key, buffer, file.type);

    return new Response(
      JSON.stringify({ success: true, url }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/upload-image" }, "Error uploading image");
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Upload failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
