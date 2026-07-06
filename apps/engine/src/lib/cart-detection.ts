/**
 * Detect whether the site has any orderable content that should surface the cart button in the navbar.
 *
 * Returns true when the config has:
 *  - a `shop` section anywhere in the pages tree, OR
 *  - any `services` section item with `orderable: true` and a `priceValue` (restaurant menu).
 */
function isOrderableSection(section: any): boolean {
  if (!section) return false;
  if (section.type === "shop") return true;
  if (section.type === "services" && Array.isArray(section.items)) {
    return section.items.some(
      (i: any) => i?.orderable === true && typeof i?.priceValue === "number",
    );
  }
  return false;
}

/**
 * Href of the first orderable section on the home page (e.g. "/#services-2",
 * matching SectionDispatcher's auto ids) — where "browse the menu" links
 * should land. Falls back to "/" when there is none.
 */
export function menuSectionHref(business: any): string {
  const sections = business?.pages?.home?.sections;
  if (Array.isArray(sections)) {
    const idx = sections.findIndex(isOrderableSection);
    if (idx !== -1) return `/#${sections[idx].type}-${idx}`;
  }
  return "/";
}

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
