import type { APIRoute } from "astro";
import { deepResolveImages } from "../../lib/images";
import { deepTranslate } from "../../lib/i18n";
import type { BusinessProfile } from "@mshorizon/schema";

export const GET: APIRoute = async ({ locals }) => {
  const { businessId, businessData, theme, t: translations } = locals;

  const translatedData = deepTranslate(translations, businessData) as BusinessProfile;
  const business = deepResolveImages(translatedData, businessId);

  const name = business.business?.name || "App";
  const shortName = name.length > 12 ? name.substring(0, 12) : name;
  const icon =
    business.business?.assets?.icon || business.business?.assets?.favicon;
  const colors =
    theme?.mode === "dark" && theme?.colors?.dark
      ? theme.colors.dark
      : theme?.colors?.light;
  const primaryColor = colors?.primary || "#0066CC";

  const manifest = {
    name,
    short_name: shortName,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: primaryColor,
    icons: icon
      ? [
          { src: icon, sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: icon, sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ]
      : [],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
