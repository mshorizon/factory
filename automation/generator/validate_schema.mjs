#!/usr/bin/env node
/**
 * Schema validator for generated business JSON files.
 * Called from Python via subprocess.
 *
 * Usage: node validate_schema.mjs <path-to-business.json>
 * Exit code 0 = valid, 1 = invalid
 *
 * Runs from project root, uses packages/schema dependencies.
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

// Resolve dependencies from packages/schema/node_modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");
const require = createRequire(join(projectRoot, "packages", "schema", "package.json"));

const Ajv = require("ajv").default;
const addFormats = require("ajv-formats").default;

const schemaPath = join(projectRoot, "packages", "schema", "src", "business.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node validate_schema.mjs <path-to-business.json>");
  process.exit(2);
}

try {
  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const valid = validate(data);

  if (valid) {
    console.log("VALID");
    process.exit(0);
  } else {
    console.error("INVALID — Errors:");
    for (const err of validate.errors) {
      console.error(`  ${err.instancePath || "/"}: ${err.message}`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error(`Error reading/parsing ${jsonPath}: ${err.message}`);
  process.exit(2);
}
