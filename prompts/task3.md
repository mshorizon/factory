# Prompt: Implement Internationalized Shop Module with Dedicated Cart Page

You are acting as a Principal Frontend Developer. We are expanding our JSON-driven engine to support a multi-language e-commerce module.

## Context & Standards
- **Tech Stack:** Astro, React, Turborepo, Tailwind CSS.
- **i18n Strategy:** All strings starting with `t:` (e.g., `t:pages.shop.title`) must be resolved through our existing translation helper.
- **Data Source:** Business logic resides in `business.json`. Styling follows `theme.json` tokens.

## Objective
Implement a shop system where product data is fully translatable, products support custom attributes, and the cart flow leads to a dedicated checkout page.

## Tasks to Execute:

### 1. State Management (packages/ui)
- Create or update `store/useCart.ts` using **Zustand** with persistence.
- Store should track `items` (Product ID, quantity, and a snapshot of the translated title/price).

### 2. Product Schema & i18n
The system must support the following structure in `business.json`:
- **Attributes:** An array of key-value pairs for technical specs (e.g., Material, Warranty).
- **Translation:** `title`, `description`, `category`, and `attributes` keys/values will use the `t:path` format.

Example Schema:
```json
{
  "type": "shop",
  "products": [
    {
      "id": "p1",
      "title": "t:shop.p1.title",
      "price": 150.00,
      "attributes": [
        { "key": "t:shop.attr.material", "value": "t:shop.attr.brass" },
        { "key": "t:shop.attr.lead_free", "value": "t:shop.attr.yes" }
      ]
    }
  ]
}
3. UI Components (packages/ui - React)
ProductCard.tsx: Must resolve t: keys before rendering. Display attributes in a subtle list/grid.

CartButton.tsx (Navbar): A React "island" displaying the total count of items. Crucial: Clicking this button must navigate the user to the /cart route.

CartPageContent.tsx: A full-page component for the /cart route. It should list items, allow quantity adjustments, show the total price, and feature a "Proceed to Payment" button.

4. Engine Integration (apps/engine)
Routing: Create a new page route at /cart that renders the CartPageContent.

Navbar: Update the navbar layout to include the CartButton island.

Translation Logic: Ensure the engine correctly passes translated or "translation-ready" strings to the React components.

Technical Requirements:
Styling: Strictly use Tailwind classes mapped to our theme variables (e.g., text-main, bg-primary, border-surface-alt).

Performance: Use Astro's client:load for the Navbar cart icon to ensure the count is accurate immediately.

Types: Define ProductAttribute, Product, and CartStore interfaces.