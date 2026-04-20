import type { APIRoute } from "astro";
import { Resend } from "resend";
import { getSiteBySubdomain } from "@mshorizon/db";
import { initDb } from "@mshorizon/db";
import { verifyTurnstile } from "../../lib/turnstile";
import { rateLimit } from "../../lib/rate-limit";
import { sendSms, renderSmsTemplate } from "../../lib/sms";
import { sendPushToSiteSubscribers } from "../../lib/push";
import logger from "../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { ok, retryAfter } = rateLimit(`contact:${ip}`, 5, 60_000);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const body = await request.json();
    const { name, email, message, businessId, turnstileToken } = body;

    if (!name || !email || !message || !businessId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (import.meta.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ error: "CAPTCHA verification required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      const valid = await verifyTurnstile(turnstileToken, ip);
      if (!valid) {
        return new Response(JSON.stringify({ error: "CAPTCHA verification failed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Init DB and get business data to find recipient email
    initDb(import.meta.env.DATABASE_URL);
    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const config = site.config as any;
    const recipientEmail = config?.notifications?.email || config?.business?.contact?.email;

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      (locals.logger ?? logger).error({ endpoint: "/api/contact" }, "RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Email service is not configured on this server." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "Formularz kontaktowy <hello@contact.hazelgrouse.pl>",
      to: recipientEmail,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      const errMsg = error.message ?? JSON.stringify(error);
      (locals.logger ?? logger).error({ err: error, endpoint: "/api/contact" }, "Resend error");
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // SMS notification (fire-and-forget, don't block the response)
    const smsConfig = (config as any)?.notifications?.sms;
    if (smsConfig?.enabled && smsConfig?.apiToken && smsConfig?.phoneNumber) {
      const template = smsConfig.template || "New message from {{name}} ({{email}}): {{message}}";
      const smsMessage = renderSmsTemplate(template, {
        name,
        email,
        message: message.substring(0, 100),
        businessId,
      });
      sendSms({
        provider: smsConfig.provider || "smsapi",
        apiToken: smsConfig.apiToken,
        phoneNumber: smsConfig.phoneNumber,
        message: smsMessage,
        senderName: smsConfig.senderName,
      }).catch((err) => (locals.logger ?? logger).error({ err, endpoint: "/api/contact" }, "SMS notification error"));
    }

    // Web Push notification (fire-and-forget)
    const pushConfig = (config as any)?.notifications?.push;
    if (pushConfig?.enabled) {
      sendPushToSiteSubscribers(site.id, {
        title: "Nowa wiadomość",
        body: `${name}: ${message.substring(0, 80)}`,
        url: `/admin`,
      }).catch((err) => (locals.logger ?? logger).error({ err, endpoint: "/api/contact" }, "Push notification error"));
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : (typeof err === "string" ? err : JSON.stringify(err));
    (locals.logger ?? logger).error({ err, message, endpoint: "/api/contact" }, "Contact form error");
    return new Response(JSON.stringify({ error: message || "Failed to send message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
