import type { Product } from "@mshorizon/schema";

interface RawServiceItem {
  id?: string;
  title: string;
  description?: string;
  price?: string;
  image?: string;
  category?: string;
  orderable?: boolean;
  priceValue?: number;
  customizations?: Product["customizations"];
}

interface RawSection {
  type?: string;
  items?: RawServiceItem[];
}

interface RawPage {
  sections?: RawSection[];
}

interface SiteConfig {
  data?: {
    products?: Product[];
  };
  pages?: Record<string, RawPage>;
  sharedSections?: RawSection[];
}

/**
 * Walk the site config and gather every product-like item that can be ordered online.
 *
 * Sources:
 *  1. `data.products[]` (traditional shop products)
 *  2. `pages.*.sections[]` and `sharedSections[]` — any `services`-typed section
 *     whose items have `orderable: true` and a numeric `priceValue`.
 *
 * IDs must be globally unique across the site — later occurrences overwrite earlier ones.
 */
export function collectOrderableProducts(config: SiteConfig): Map<string, Product> {
  const out = new Map<string, Product>();

  for (const p of config?.data?.products ?? []) {
    if (p?.id) out.set(p.id, p);
  }

  const walkSections = (sections?: RawSection[]) => {
    if (!Array.isArray(sections)) return;
    for (const section of sections) {
      if (section?.type !== "services") continue;
      for (const item of section.items ?? []) {
        if (!item?.id || !item.orderable || typeof item.priceValue !== "number") continue;
        out.set(item.id, {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.priceValue,
          image: item.image,
          category: item.category,
          customizations: item.customizations,
        });
      }
    }
  };

  walkSections(config?.sharedSections);
  for (const page of Object.values(config?.pages ?? {})) {
    walkSections(page?.sections);
  }

  return out;
}

export function findOrderableProduct(
  map: Map<string, Product>,
  productId: string,
): Product | undefined {
  return map.get(productId);
}
