/**
 * Migration script: Upload local images to Cloudflare R2 and update DB records.
 *
 * Usage:
 *   DATABASE_URL=... R2_ENDPOINT=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
 *   R2_BUCKET_NAME=... R2_PUBLIC_DOMAIN=... npx tsx scripts/migrate-images-to-r2.ts
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { sites } from "../packages/db/src/schema.js";

// --- ENV ---
const DATABASE_URL = process.env.DATABASE_URL;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

for (const [name, val] of Object.entries({
  DATABASE_URL,
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_DOMAIN,
})) {
  if (!val) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
}

const publicBaseUrl = R2_PUBLIC_DOMAIN!.replace(/\/+$/, "");

// --- MIME ---
const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

function isImageFile(filename: string): boolean {
  return extname(filename).toLowerCase() in mimeTypes;
}

function getMimeType(filename: string): string {
  return mimeTypes[extname(filename).toLowerCase()] || "application/octet-stream";
}

// --- R2 Client ---
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT!,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadFile(key: string, filePath: string): Promise<string> {
  const body = readFileSync(filePath);
  const contentType = getMimeType(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${publicBaseUrl}/${key}`;
}

// --- Collect images ---
interface ImageEntry {
  businessId: string;
  r2Key: string;
  localPath: string;
}

function collectImagesFromDir(baseDir: string, source: "data" | "public"): ImageEntry[] {
  const entries: ImageEntry[] = [];
  if (!existsSync(baseDir)) return entries;

  for (const businessDir of readdirSync(baseDir, { withFileTypes: true })) {
    if (!businessDir.isDirectory()) continue;
    const businessId = businessDir.name;
    const businessPath = join(baseDir, businessId);

    // Walk all files in this business directory
    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (isImageFile(entry.name)) {
          // Build a clean relative path from the business root
          const relativeFromBusiness = fullPath
            .slice(businessPath.length)
            .replace(/^[/\\]+/, "");
          const r2Key = `${businessId}/${relativeFromBusiness}`;
          entries.push({ businessId, r2Key, localPath: fullPath });
        }
      }
    }

    walk(businessPath);
  }

  return entries;
}

// --- Update DB config ---
const IMAGE_FIELDS = new Set(["image", "backgroundImage", "logo", "icon", "favicon", "src"]);

/**
 * Build a map of old relative paths -> new R2 URLs for a given businessId.
 */
function buildReplacementMap(
  businessId: string,
  uploadedEntries: ImageEntry[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const entry of uploadedEntries) {
    if (entry.businessId !== businessId) continue;
    // The filename relative to the business dir
    const relPath = entry.r2Key.slice(businessId.length + 1); // e.g. "hero.jpg" or "photos/hero.png"
    const r2Url = `${publicBaseUrl}/${entry.r2Key}`;

    // Match various ways the path might appear in the config
    // e.g. "/photos/hero.jpg", "photos/hero.jpg", "/hero.jpg", "hero.jpg"
    // Also match "/images/{businessId}/hero.jpg" for public folder images
    map.set(`/${relPath}`, r2Url);
    map.set(relPath, r2Url);
    map.set(`/images/${businessId}/${relPath}`, r2Url);
  }

  return map;
}

/**
 * Deep-walk an object and replace image field values using the replacement map.
 */
function replaceImagePaths(data: any, replacements: Map<string, string>): any {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data.map((item) => replaceImagePaths(item, replacements));
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (IMAGE_FIELDS.has(key) && typeof value === "string") {
        // Check if this value matches any of our replacement patterns
        result[key] = replacements.get(value) ?? value;
      } else {
        result[key] = replaceImagePaths(value, replacements);
      }
    }
    return result;
  }

  return data;
}

// --- Main ---
async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const rootDir = join(__dirname, "..");
  const dataDir = join(rootDir, "data");
  const publicImagesDir = join(rootDir, "apps", "engine", "public", "images");

  // 1. Collect all images
  console.log("Scanning for images...");
  const dataImages = collectImagesFromDir(dataDir, "data");
  const publicImages = collectImagesFromDir(publicImagesDir, "public");
  const allImages = [...dataImages, ...publicImages];

  // De-duplicate by r2Key (same file might exist in both locations)
  const uniqueByKey = new Map<string, ImageEntry>();
  for (const entry of allImages) {
    if (!uniqueByKey.has(entry.r2Key)) {
      uniqueByKey.set(entry.r2Key, entry);
    }
  }
  const images = Array.from(uniqueByKey.values());

  console.log(`Found ${images.length} unique images to upload.`);

  // 2. Upload each image to R2
  let uploaded = 0;
  for (const img of images) {
    try {
      const url = await uploadFile(img.r2Key, img.localPath);
      uploaded++;
      console.log(`  [${uploaded}/${images.length}] ${img.r2Key} -> ${url}`);
    } catch (err) {
      console.error(`  FAILED: ${img.r2Key}`, err);
    }
  }

  console.log(`\nUploaded ${uploaded}/${images.length} images.\n`);

  // 3. Update DB records
  console.log("Updating database records...");
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  const allSites = await db.select().from(sites);
  let dbUpdated = 0;

  for (const site of allSites) {
    const replacements = buildReplacementMap(site.subdomain, images);
    if (replacements.size === 0) continue;

    const updatedConfig = replaceImagePaths(site.config, replacements);

    await db
      .update(sites)
      .set({ config: updatedConfig, updatedAt: new Date() })
      .where(eq(sites.subdomain, site.subdomain));

    dbUpdated++;
    console.log(`  Updated config for: ${site.subdomain}`);
  }

  console.log(`\nUpdated ${dbUpdated} site records.`);
  console.log("Migration complete!");

  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
