#!/usr/bin/env tsx
/**
 * Template Validation Script
 *
 * Validates all JSON files in templates/ directory against the AJV schema.
 * Usage:
 *   pnpm run test:validate
 *
 * Exit codes:
 *   0 - All templates valid
 *   1 - One or more templates invalid
 */

import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import { validate, type BusinessProfile } from "@mshorizon/schema";

const TEMPLATES_DIR = resolve(process.cwd(), "../../templates");

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: any[] | null | undefined;
}

async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip translations directories - they contain i18n files, not BusinessProfiles
        if (entry.name === "translations") {
          continue;
        }

        // Recursively search subdirectories
        const subFiles = await findJsonFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch (error: any) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

async function validateTemplate(filePath: string): Promise<ValidationResult> {
  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    const result = validate(data);

    return {
      file: filePath,
      valid: result.valid,
      errors: result.errors,
    };
  } catch (error: any) {
    return {
      file: filePath,
      valid: false,
      errors: [{ message: `Failed to parse JSON: ${error.message}` }],
    };
  }
}

async function main() {
  console.log(`🔍 Scanning for templates in: ${TEMPLATES_DIR}\n`);

  const jsonFiles = await findJsonFiles(TEMPLATES_DIR);

  if (jsonFiles.length === 0) {
    console.log("⚠️  No JSON files found in templates directory");
    process.exit(0);
  }

  console.log(`Found ${jsonFiles.length} JSON file(s):\n`);

  const results: ValidationResult[] = [];

  for (const file of jsonFiles) {
    const relativePath = file.replace(process.cwd(), "").replace("../../", "");
    process.stdout.write(`  Validating ${relativePath}... `);

    const result = await validateTemplate(file);
    results.push(result);

    if (result.valid) {
      console.log("✅");
    } else {
      console.log("❌");
    }
  }

  // Print detailed errors
  const failed = results.filter((r) => !r.valid);

  if (failed.length > 0) {
    console.log("\n❌ Validation Errors:\n");

    for (const result of failed) {
      const relativePath = result.file.replace(process.cwd(), "").replace("../../", "");
      console.log(`  ${relativePath}:`);

      if (result.errors) {
        for (const error of result.errors) {
          console.log(`    - ${error.instancePath || "root"}: ${error.message}`);
          if (error.params) {
            console.log(`      ${JSON.stringify(error.params)}`);
          }
        }
      }
      console.log("");
    }

    console.log(`\n❌ ${failed.length} of ${results.length} template(s) failed validation\n`);
    process.exit(1);
  }

  console.log(`\n✅ All ${results.length} template(s) valid!\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
