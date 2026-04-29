#!/usr/bin/env node
// Replaces the hero image for notariuszwgarwolinie with a document-signing photo.
// No faces — shows hands signing an official document (notary-specific).
//
// Run: DATABASE_URL="..." node scripts/upload-notariusz-hero-image.mjs

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import postgres from "postgres";

const SUBDOMAIN = "notariuszwgarwolinie";

const IMAGE_URL =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=900&fit=crop&q=85";
const IMAGE_FILENAME = "hero.jpg";
const R2_KEY = `${SUBDOMAIN}/${IMAGE_FILENAME}`;

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey:
    "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function downloadImage(url) {
  console.log(`Downloading image from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${buffer.length} bytes`);
  return buffer;
}

async function uploadToR2(key, buffer) {
  console.log(`Uploading to R2: ${key}`);
  const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.endpoint,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );
  const url = `${R2_CONFIG.publicUrl}/${key}`;
  console.log(`Uploaded: ${url}`);
  return url;
}

async function updateDb(r2Url) {
  const sql = postgres(DATABASE_URL);
  const rows = await sql`SELECT config FROM sites WHERE subdomain = ${SUBDOMAIN}`;
  if (rows.length === 0) {
    await sql.end();
    throw new Error(`Business "${SUBDOMAIN}" not found in DB`);
  }

  const config = rows[0].config;
  const heroSection = config?.pages?.home?.sections?.find(
    (s) => s.type === "hero"
  );
  if (!heroSection) {
    await sql.end();
    throw new Error("Hero section not found in config");
  }

  const oldImage = heroSection.image;
  heroSection.image = r2Url;
  console.log(`  Old image: ${oldImage}`);
  console.log(`  New image: ${r2Url}`);

  await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${SUBDOMAIN}`;
  console.log("DB updated");
  await sql.end();
}

async function main() {
  const buffer = await downloadImage(IMAGE_URL);
  const r2Url = await uploadToR2(R2_KEY, buffer);
  await updateDb(r2Url);
  console.log("\nDone. Restart the dev server: pm2 restart astro-dev");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
