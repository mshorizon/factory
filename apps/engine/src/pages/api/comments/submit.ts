import type { APIRoute } from "astro";
import { createComment } from "@mshorizon/db";
import { verifyTurnstile } from "../../../lib/turnstile";
import { rateLimit } from "../../../lib/rate-limit";
import logger from "../../../lib/logger";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { ok, retryAfter } = rateLimit(`comment:${ip}`, 3, 5 * 60_000);
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
    const { blogId, authorName, authorEmail, content, turnstileToken } = body;

    // Validate required fields
    if (!blogId || !authorName || !authorEmail || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate content length
    if (content.length < 10) {
      return new Response(
        JSON.stringify({ error: "Comment must be at least 10 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (content.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Comment must be less than 5000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (import.meta.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({ error: "CAPTCHA verification required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      const valid = await verifyTurnstile(turnstileToken, ip);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: "CAPTCHA verification failed" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get IP address and user agent for spam detection
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create comment with pending status
    const comment = await createComment({
      blogId: parseInt(blogId),
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim().toLowerCase(),
      content: content.trim(),
      status: "pending",
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comment submitted successfully and is pending moderation",
        commentId: comment.id
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/comments/submit" }, "Error submitting comment");
    return new Response(
      JSON.stringify({ error: "Failed to submit comment" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
