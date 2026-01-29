# Task: Build a Schema-Driven Admin Panel for Website Factory

## Context
We are building a website factory using Astro, React, and Turborepo. 
Current state: 
- Business data is stored in JSON files (e.g., `data/plumber/plumber.json`).
- JSONs are validated using AJV based on a strict Schema.
- Components in `packages/ui` render pages based on this JSON.

## Objective
Create a prototype of an Admin Panel (`apps/admin`) that allows non-technical users to edit their business JSON without breaking the structure.

## Technical Requirements
1. **Schema-to-UI**: Use `@rjsf/core` (React JSON Schema Form) to automatically generate the form from the existing AJV schema.
2. **Dynamic Loading**: The app should be able to fetch a specific business JSON (e.g., `plumber.json`) and populate the form.
3. **Validation**: Use the same AJV schema for frontend validation to ensure the output JSON is always 100% compliant with our engine.
4. **Tailwind Styling**: Ensure the form is clean and usable, utilizing Tailwind CSS.
5. **Output**: On submit, the form should return a cleaned, validated JSON object ready to be saved.

## Architecture Guidelines
- Create a reusable `JsonEditor` component in `packages/ui` or a new package.
- The editor should handle nested objects (like `theme.colors`) and arrays (like `pages.services.sections[0].items`).
- For fields like colors, use a color picker widget.
- For image paths, leave a text input for now, but mark it for future Cloudinary integration.

## Deliverables
- A working React page in `apps/admin` that loads `plumber.json` schema and data.
- A submit handler that logs the updated and validated JSON to the console.
- Setup of RJSF with a Tailwind-friendly theme.

Attached is the current `plumber.json` for structure reference.