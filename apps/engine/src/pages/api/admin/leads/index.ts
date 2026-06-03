import type { APIRoute } from "astro";
import { updateBusinessStatus } from "@mshorizon/db";

const forbidden = () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") return forbidden();
  try {
    const { id, status } = await request.json();
    if (!id || !status) return json({ error: "id and status required" }, 400);
    const row = await updateBusinessStatus(Number(id), status);
    return json({ business: row });
  } catch {
    return json({ error: "Failed to update business status" }, 500);
  }
};
