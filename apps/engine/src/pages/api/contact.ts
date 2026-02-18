import type { APIRoute } from "astro";
import { Resend } from "resend";
import { getSiteBySubdomain } from "@mshorizon/db";
import { initDb } from "@mshorizon/db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, message, businessId } = body;

    if (!name || !email || !message || !businessId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
    const recipientEmail = config?.business?.contact?.email;

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(import.meta.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "noreply@contact.hazelgrouse.pl",
      to: recipientEmail,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return new Response(JSON.stringify({ error: "Failed to send message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
