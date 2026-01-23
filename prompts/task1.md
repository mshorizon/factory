Act as a Senior Frontend Architect. Refactor the current business engine to support dynamic routing and multiple layout variants based on the business JSON schema.

### Objective
Modify the JSON schema, the Astro engine, and the UI package to allow full control over pages, routing, and section variants.

### Requirements:
1.  **JSON Schema Update (AJV):**
    * Introduce a `pages` array in the business JSON.
    * Each page object must have: `title`, `slug` (use `index` for home), and a `sections` array.
    * The order in the `pages` array determines the order in the Navbar.
    * Add a `variant` key to `navbar`, `footer`, and each `section`.

2.  **Astro Engine (apps/engine):**
    * Implement dynamic routing using `[...slug].astro` to handle the pages defined in JSON.
    * The engine must globally inject the `navbar` and `footer` for every page.
    * Create a dynamic component dispatcher that renders the correct UI component based on the `type` and `variant` from the JSON.

3.  **UI Package (packages/ui):**
    * Refactor components to provide 2 distinct variants for:
        * **Navbar:** `VariantA` (logo left, links right) and `VariantB` (centered logo).
        * **Footer:** `VariantA` (simple copyright) and `VariantB` (multi-column with links).
        * **Sections:** For all existing sections (Hero, About, etc.), implement `VariantA` and `VariantB` (e.g., Hero with side-by-side image vs. Hero with centered background image).

4.  **Implementation Detail:**
    * Use Tailwind CSS for styling, respecting the `theme.json` tokens.
    * Ensure the "Home" page (first in array) is accessible at the root `/` path.
    * Keep the logic DRY — use a mapping object or a switch statement to resolve variants.

### Example JSON Structure to support:
{
  "pages": [
    {
      "slug": "index",
      "title": "Home",
      "sections": [{ "type": "hero", "variant": "VariantB", "content": { ... } }]
    },
    {
      "slug": "services",
      "title": "Our Services",
      "sections": [{ "type": "features", "variant": "VariantA", "content": { ... } }]
    }
  ],
  "layout": {
    "navbar": { "variant": "VariantA" },
    "footer": { "variant": "VariantB" }
  }
}

Proceed with refactoring the schema files, the Astro routing logic, and the UI components.