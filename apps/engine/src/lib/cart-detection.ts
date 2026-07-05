/**
 * Detect whether the site has any orderable content that should surface the cart button in the navbar.
 *
 * Returns true when the config has:
 *  - a `shop` section anywhere in the pages tree, OR
 *  - any `services` section item with `orderable: true` and a `priceValue` (restaurant menu).
 */
export function siteHasCart(business: any): boolean {
  const pages = business?.pages;
  if (!pages) return false;

  const check = (section: any): boolean => {
    if (!section) return false;
    if (section.type === "shop") return true;
    if (section.type === "services" && Array.isArray(section.items)) {
      return section.items.some(
        (i: any) => i?.orderable === true && typeof i?.priceValue === "number",
      );
    }
    return false;
  };

  for (const page of Object.values(pages) as any[]) {
    if (Array.isArray(page?.sections) && page.sections.some(check)) return true;
  }
  const shared = business?.sharedSections;
  if (shared && typeof shared === "object") {
    for (const section of Object.values(shared) as any[]) {
      if (check(section)) return true;
    }
  }
  return false;
}
