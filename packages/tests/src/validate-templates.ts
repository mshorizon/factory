#!/usr/bin/env tsx
/**
 * Template & Database Validation Script
 *
 * Validates all JSON files in templates/ directory AND all businesses from the database
 * against the AJV schema.
 *
 * Usage:
 *   pnpm run test:validate
 *
 * Exit codes:
 *   0 - All templates and database businesses valid
 *   1 - One or more templates or database businesses invalid
 */

import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import { validate, type BusinessProfile } from "@mshorizon/schema";
import { getDb, initDb } from "@mshorizon/db";
import { sites } from "@mshorizon/db";
import "dotenv/config";

const TEMPLATES_DIR = resolve(process.cwd(), "../../templates");

interface ValidationResult {
  source: string; // file path or "DB: subdomain"
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
      source: filePath,
      valid: result.valid,
      errors: result.errors,
    };
  } catch (error: any) {
    return {
      source: filePath,
      valid: false,
      errors: [{ message: `Failed to parse JSON: ${error.message}` }],
    };
  }
}

async function validateDatabaseBusinesses(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // Initialize database connection
    if (process.env.DATABASE_URL) {
      initDb(process.env.DATABASE_URL);
    }

    const db = getDb();
    const allSites = await db.select().from(sites);

    console.log(`Found ${allSites.length} business(es) in database:\n`);

    for (const site of allSites) {
      process.stdout.write(`  Validating DB: ${site.subdomain}... `);

      try {
        const result = validate(site.config);

        results.push({
          source: `DB: ${site.subdomain}`,
          valid: result.valid,
          errors: result.errors,
        });

        if (result.valid) {
          console.log("✅");
        } else {
          console.log("❌");
        }
      } catch (error: any) {
        results.push({
          source: `DB: ${site.subdomain}`,
          valid: false,
          errors: [{ message: `Validation error: ${error.message}` }],
        });
        console.log("❌");
      }
    }
  } catch (error: any) {
    console.error(`\n⚠️  Database connection failed: ${error.message}`);
    console.log("Skipping database validation...\n");
  }

  return results;
}

async function main() {
  console.log("═".repeat(70));
  console.log("🔍 BUSINESS PROFILE VALIDATION");
  console.log("═".repeat(70));
  console.log("");

  // Validate template files
  console.log(`📁 Scanning for templates in: ${TEMPLATES_DIR}\n`);

  const jsonFiles = await findJsonFiles(TEMPLATES_DIR);
  const templateResults: ValidationResult[] = [];

  if (jsonFiles.length === 0) {
    console.log("⚠️  No JSON files found in templates directory\n");
  } else {
    console.log(`Found ${jsonFiles.length} JSON file(s):\n`);

    for (const file of jsonFiles) {
      const relativePath = file.replace(process.cwd(), "").replace("../../", "");
      process.stdout.write(`  Validating ${relativePath}... `);

      const result = await validateTemplate(file);
      templateResults.push(result);

      if (result.valid) {
        console.log("✅");
      } else {
        console.log("❌");
      }
    }
  }

  console.log("");
  console.log("─".repeat(70));
  console.log("");

  // Validate database businesses
  console.log("🗄️  Validating businesses from database:\n");
  const dbResults = await validateDatabaseBusinesses();

  console.log("");
  console.log("═".repeat(70));

  // Combine all results
  const allResults = [...templateResults, ...dbResults];
  const failed = allResults.filter((r) => !r.valid);

  // Print detailed errors if any
  if (failed.length > 0) {
    console.log("\n❌ VALIDATION ERRORS:\n");

    for (const result of failed) {
      let displaySource = result.source;
      if (!result.source.startsWith("DB:")) {
        displaySource = result.source.replace(process.cwd(), "").replace("../../", "");
      }

      console.log(`  ${displaySource}:`);

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
  }

  // Print summary
  const templateFailed = templateResults.filter((r) => !r.valid).length;
  const dbFailed = dbResults.filter((r) => !r.valid).length;

  console.log("📊 SUMMARY:");
  console.log("─".repeat(70));
  console.log(`  Templates:  ${templateResults.length - templateFailed}/${templateResults.length} valid`);
  console.log(`  Database:   ${dbResults.length - dbFailed}/${dbResults.length} valid`);
  console.log(`  Total:      ${allResults.length - failed.length}/${allResults.length} valid`);
  console.log("═".repeat(70));
  console.log("");

  if (failed.length > 0) {
    console.log(`❌ ${failed.length} of ${allResults.length} business profile(s) failed validation\n`);
    process.exit(1);
  }

  console.log(`✅ All ${allResults.length} business profile(s) valid!\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
