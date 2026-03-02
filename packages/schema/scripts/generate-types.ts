import { compileFromFile } from "json-schema-to-typescript";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../src/business.schema.json");
const outputPath = resolve(__dirname, "../src/generated.ts");

async function main() {
  const ts = await compileFromFile(schemaPath, {
    bannerComment: "/* Auto-generated from business.schema.json — DO NOT EDIT */",
    additionalProperties: false,
    style: {
      semi: true,
      singleQuote: false,
    },
  });
  writeFileSync(outputPath, ts);
  console.log("Generated:", outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
