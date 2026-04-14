import type { APIRoute } from "astro";
import { getBusinessFileById, deleteBusinessFile } from "@mshorizon/db";
import { deleteFromR2 } from "../../../../lib/r2";
import logger from "../../../../lib/logger";

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "Missing fileId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const file = await getBusinessFileById(Number(fileId));
    if (!file) {
      return new Response(
        JSON.stringify({ error: "File not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete from R2 first, then remove DB record
    await deleteFromR2(file.r2Key);
    await deleteBusinessFile(file.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/files/delete" }, "Error deleting file");
    return new Response(
      JSON.stringify({ error: "Failed to delete file" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
