import type { APIRoute } from "astro";
import { Resend } from "resend";
import { getSiteById } from "@mshorizon/db";
import { getAuthFromCookies } from "../../../../../lib/auth";
import logger from "../../../../../lib/logger";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const forbidden = () => json({ error: "Forbidden" }, 403);
const notFound = () => json({ error: "Not found" }, 404);

export type EmailType = "proposal" | "go-live" | "suspension" | "renewal";

export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  const id = parseInt(params.id ?? "", 10);
  if (isNaN(id)) return notFound();

  try {
    const site = await getSiteById(id);
    if (!site) return notFound();

    const body = await request.json();
    const { emailType, subject, html } = body ?? {};

    if (!emailType || !subject || !html) {
      return json({ error: "emailType, subject and html are required" }, 400);
    }

    const config = site.config as any;
    const recipientEmail =
      config?.notifications?.email ||
      config?.business?.contact?.email;

    if (!recipientEmail) {
      return json({ error: "Business has no contact email configured" }, 422);
    }

    const apiKey = (locals as any).env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return json({ error: "Email service not configured" }, 503);
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "Hazelgrouse Studio <noreply@hazelgrouse.pl>",
      to: recipientEmail,
      subject,
      html,
    });

    if (error) {
      (locals.logger ?? logger).error({ err: error, emailType, siteId: id }, "Email send failed");
      return json({ error: "Failed to send email" }, 500);
    }

    return json({ success: true, to: recipientEmail });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "POST /api/admin/businesses/[id]/email failed");
    return json({ error: "Failed to send email" }, 500);
  }
};
