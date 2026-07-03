#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I22 (additive-schema check: combinator +
 * additionalProperties/patternProperties/tuple blind spots). Pure — no IO.
 *
 * The hole this closes: `isAdditiveSchemaChange` never descended into
 * oneOf/anyOf/allOf, so an enum removal or type change inside a combinator branch
 * passed as "additive" and could auto-merge unreviewed.
 *
 * Run: pnpm tsx packages/tests/sitc-schema-additive.check.mts
 */
import { isAdditiveSchemaChange } from "../sitc-core/src/delivery/schema-additive.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const additive = (o: unknown, n: unknown) => isAdditiveSchemaChange(o, n).additive;
const firstViolation = (o: unknown, n: unknown) => isAdditiveSchemaChange(o, n).violations[0] ?? "";

// ── A. pre-existing behavior intact ──────────────────────────────────────────
console.log("A. base behavior intact");
{
  ok(additive({ type: "object", properties: { a: { type: "string" } } }, { type: "object", properties: { a: { type: "string" }, b: { type: "number" } } }), "adding an optional property is additive");
  ok(!additive({ properties: { a: {} } }, { properties: {} }), "removing a property is not");
  ok(!additive({ enum: ["x", "y"] }, { enum: ["x"] }), "removing an enum value is not");
  ok(additive({ enum: ["x"] }, { enum: ["x", "y"] }), "adding an enum value is");
  ok(!additive({ required: ["a"] }, { required: ["a", "b"] }), "new required field is not");
}

// ── B. combinators (the I22 hole) ────────────────────────────────────────────
console.log("B. oneOf/anyOf/allOf recursion");
{
  const oldS = { oneOf: [{ type: "object", properties: { variant: { enum: ["grid", "list"] } } }, { type: "string" }] };
  const newEnumRemoved = { oneOf: [{ type: "object", properties: { variant: { enum: ["grid"] } } }, { type: "string" }] };
  ok(!additive(oldS, newEnumRemoved), "enum removal INSIDE a oneOf branch is caught");
  ok(firstViolation(oldS, newEnumRemoved).includes("oneOf/0"), "violation path names the branch");

  const newTypeChanged = { oneOf: [{ type: "object", properties: { variant: { enum: ["grid", "list"] } } }, { type: "number" }] };
  ok(!additive(oldS, newTypeChanged), "type change inside a oneOf branch is caught");

  ok(!additive({ anyOf: [{ type: "string" }, { type: "number" }] }, { anyOf: [{ type: "string" }] }), "removed anyOf branch is caught");
  ok(additive(oldS, { oneOf: [...oldS.oneOf, { type: "number" }] }), "ADDING a oneOf branch is additive");
  ok(additive(oldS, structuredClone(oldS)), "identical combinators pass");
  ok(!additive({ allOf: [{ properties: { a: {} } }] }, { allOf: [{ properties: {} }] }), "property removal inside allOf is caught");
}

// ── C. additionalProperties / patternProperties / tuples ────────────────────
console.log("C. additionalProperties / patternProperties / tuple items");
{
  ok(!additive({ type: "object" }, { type: "object", additionalProperties: false }), "flipping additionalProperties to false narrows → caught");
  ok(additive({ type: "object", additionalProperties: false }, { type: "object", additionalProperties: false }), "already-false stays fine");
  ok(!additive(
    { additionalProperties: { enum: ["a", "b"] } },
    { additionalProperties: { enum: ["a"] } },
  ), "enum removal inside an additionalProperties schema is caught");
  ok(additive({ additionalProperties: { type: "string" } }, {}), "REMOVING the AP schema widens → additive");

  ok(!additive({ patternProperties: { "^x-": { type: "string" } } }, { patternProperties: {} }), "removed patternProperties pattern is caught");
  ok(!additive(
    { patternProperties: { "^x-": { enum: ["a", "b"] } } },
    { patternProperties: { "^x-": { enum: ["a"] } } },
  ), "enum removal inside a pattern schema is caught");

  ok(!additive({ items: [{ type: "string" }, { type: "number" }] }, { items: [{ type: "string" }] }), "removed tuple item is caught");
  ok(!additive({ items: [{ enum: ["a", "b"] }] }, { items: [{ enum: ["a"] }] }), "enum removal inside a tuple item is caught");
  ok(additive({ items: { type: "string" } }, { items: { type: "string" } }), "object-form items unchanged passes");
}

// ── D. the realistic business.schema.json shape ──────────────────────────────
console.log("D. realistic nested shape");
{
  const oldS = {
    $defs: {
      section: {
        oneOf: [
          { type: "object", properties: { type: { enum: ["hero"] }, variant: { enum: ["classic", "split"] } } },
          { type: "object", properties: { type: { enum: ["services"] } } },
        ],
      },
    },
  };
  const removedVariant = structuredClone(oldS) as any;
  removedVariant.$defs.section.oneOf[0].properties.variant.enum = ["classic"];
  const r = isAdditiveSchemaChange(oldS, removedVariant);
  ok(!r.additive, "variant-enum removal nested in $defs→oneOf is caught");
  ok(r.violations[0].includes("$defs/section/oneOf/0"), `violation path is precise (${r.violations[0]})`);

  const addedVariant = structuredClone(oldS) as any;
  addedVariant.$defs.section.oneOf[0].properties.variant.enum.push("stacked");
  ok(isAdditiveSchemaChange(oldS, addedVariant).additive, "variant-enum ADDITION nested in $defs→oneOf passes");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
