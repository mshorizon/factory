import type { Target, BusinessProfileV15 } from "@mshorizon/schema";

/**
 * Resolves a Target object to a URL string
 */
export function resolveTarget(target: Target | undefined, business?: BusinessProfileV15): string {
  if (!target) {
    return "#";
  }
  switch (target.type) {
    case "page":
      return target.value === "home" ? "/" : `/${target.value}`;
    case "section":
      return `#${target.value}`;
    case "external":
      return target.value || "#";
    case "phone":
      return `tel:${target.value || business?.business?.contact?.phone || ""}`;
    case "email":
      return `mailto:${target.value || business?.business?.contact?.email || ""}`;
    default:
      return "#";
  }
}

/**
 * Converts a legacy href string to a Target object
 * Used by the v1.0 to v1.5 adapter
 */
export function hrefToTarget(href: string): Target {
  // Check for phone links
  if (href.startsWith("tel:")) {
    return { type: "phone", value: href.replace("tel:", "") };
  }

  // Check for email links
  if (href.startsWith("mailto:")) {
    return { type: "email", value: href.replace("mailto:", "") };
  }

  // Check for external links
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return { type: "external", value: href };
  }

  // Check for section anchors
  if (href.startsWith("#")) {
    return { type: "section", value: href.replace("#", "") };
  }

  // Internal page links
  // Strip leading slash and convert "index" to "home"
  const pageName = href.replace(/^\//, "") || "home";
  return { type: "page", value: pageName === "" ? "home" : pageName };
}
