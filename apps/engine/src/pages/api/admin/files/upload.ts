import type { APIRoute } from "astro";
import { uploadToR2 } from "../../../../lib/r2";
import { getSiteBySubdomain, createBusinessFile } from "@mshorizon/db";
import logger from "../../../../lib/logger";

const ALLOWED_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
        JSON.stringify({ message: "File too large (max 50 MB)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(
        JSON.stringify({ message: "Site not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const sanitizedName = sanitizeFilename(file.name);
    const sanitizedBusinessId = sanitizeFilename(businessId);
    const timestamp = Date.now();
    const r2Key = `${sanitizedBusinessId}/files/${timestamp}-${sanitizedName}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const url = await uploadToR2(r2Key, buffer, file.type);

    const record = await createBusinessFile({
      siteId: site.id,
      name: sanitizedName,
      originalName: file.name,
      url,
      r2Key,
      mimeType: file.type,
      size: file.size,
    });

    return new Response(
      JSON.stringify({ success: true, file: record }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/files/upload" }, "Error uploading file");
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Upload failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
