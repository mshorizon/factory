import type { APIRoute } from "astro";
import { initDb, getUserByEmail, upsertSiteConfig, createUser } from "@mshorizon/db";
import { validate } from "@mshorizon/schema";
import { verifyTurnstile } from "../../lib/turnstile.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { hashPassword, signAccessToken, signRefreshToken, setAuthCookies } from "../../lib/auth.js";
import { generateBusinessProfile, retryGenerateWithErrors, setGeminiApiKey } from "../../lib/claude.js";
import { generateUniqueSubdomain } from "../../lib/slugify.js";
import logger from "../../lib/logger.js";
import type { CreatorInput } from "../../lib/claude.js";
import type { BusinessProfile } from "@mshorizon/schema";

export const POST: APIRoute = async ({ request, cookies }) => {
  const json = (msg: string | Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(typeof msg === "string" ? { error: msg } : msg), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  try {
    // --- Rate limiting ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { ok, retryAfter } = rateLimit(`creator:${ip}`, 3, 3_600_000); // 3 per hour
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Zbyt wiele prób. Spróbuj ponownie później." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // --- Parse body ---
    const body = await request.json();
    const { description, email, password, stylePreference, turnstileToken } = body;

    // --- Validate required fields ---
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return json("Opis biznesu jest wymagany (minimum 10 znaków)", 400);
    }

    if (!email || !password) {
      return json("Email i hasło są wymagane", 400);
    }

    if (typeof password !== "string" || password.length < 8) {
      return json("Hasło musi mieć minimum 8 znaków", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json("Nieprawidłowy format adresu email", 400);
    }

    // --- Turnstile CAPTCHA ---
    if (import.meta.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return json("Weryfikacja CAPTCHA jest wymagana", 400);
      }
      const valid = await verifyTurnstile(turnstileToken, ip);
      if (!valid) {
        return json("Weryfikacja CAPTCHA nie powiodła się", 403);
      }
    }

    // --- Init Claude API key & DB ---
    if (import.meta.env.ANTHROPIC_API_KEY) {
      setGeminiApiKey(import.meta.env.ANTHROPIC_API_KEY);
    }
    initDb(import.meta.env.DATABASE_URL);

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return json("Konto z tym adresem email już istnieje", 409);
    }

    // --- Generate business profile first (AI extracts business name from description) ---
    const creatorInput: CreatorInput = {
      description: description.trim(),
      email,
      stylePreference,
    };

    // Use placeholder — real subdomain will be derived from AI-extracted business name
    let config = await generateBusinessProfile(creatorInput, "placeholder");

    // --- Validate against schema ---
    let { valid, errors } = validate(config as BusinessProfile);

    if (!valid && errors) {
      logger.warn({ errorCount: errors.length }, "First generation failed validation, retrying");
      const errorMessages = errors.map(
        (e: { instancePath?: string; message?: string }) => `${e.instancePath || "/"}: ${e.message || "unknown"}`
      );

      try {
        config = await retryGenerateWithErrors(
          creatorInput,
          "placeholder",
          JSON.stringify(config),
          errorMessages
        );
        const retryResult = validate(config as BusinessProfile);
        valid = retryResult.valid;
        errors = retryResult.errors;
      } catch (retryErr) {
        logger.error({ err: retryErr }, "Retry generation failed");
      }
    }

    if (!valid) {
      logger.error({ errors }, "Generated config failed schema validation after retry");
      return json("Nie udało się wygenerować poprawnej konfiguracji strony. Spróbuj ponownie.", 500);
    }

    // --- Derive subdomain from AI-extracted business name ---
    const configObj = config as Record<string, unknown>;
    const business = configObj.business as Record<string, unknown>;
    const extractedName = (business.name as string) || "moja-firma";
    const subdomain = await generateUniqueSubdomain(extractedName);

    // --- Ensure business.id and contact.email are correct ---
    business.id = subdomain;
    const contact = (business.contact || {}) as Record<string, unknown>;
    contact.email = email;
    business.contact = contact;

    // --- Save to database ---
    await upsertSiteConfig(subdomain, configObj as unknown as BusinessProfile);
    logger.info({ subdomain }, "Business site created successfully");

    // --- Create admin user ---
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      role: "admin",
      businessId: subdomain,
    });

    // --- Auto-login: set JWT cookies ---
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin",
      businessId: subdomain,
    });
    const refreshToken = await signRefreshToken({ userId: user.id });
    setAuthCookies(cookies, accessToken, refreshToken);

    // --- Build redirect URL (preserve dev/prod environment) ---
    const host = request.headers.get("host") || "";
    const isDev = host.includes(".dev.");
    const baseUrl = isDev
      ? `dev.${import.meta.env.BASE_DOMAIN || "hazelgrouse.pl"}`
      : (import.meta.env.BASE_DOMAIN || "hazelgrouse.pl");
    const redirectUrl = `https://${subdomain}.${baseUrl}/admin`;

    return json({
      success: true,
      subdomain,
      redirectUrl,
      message: "Strona została utworzona pomyślnie!",
    }, 200);
  } catch (error) {
    logger.error({ err: error, endpoint: "/api/creator" }, "Error in creator endpoint");
    return json(
      error instanceof Error ? error.message : "Wystąpił błąd podczas tworzenia strony",
      500
    );
  }
};
