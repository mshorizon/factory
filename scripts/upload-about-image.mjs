#!/usr/bin/env node
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const IMAGE_URL = "https://framerusercontent.com/images/fd463tp8pa8NascmpEQykMMpt4.jpg";
const BUSINESS_ID = "specialist-001";
const IMAGE_FILENAME = "about-electrician.jpg";

// R2 Configuration from .env
const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

async function downloadImage(url) {
  console.log(`📥 Downloading image from: ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`✅ Downloaded ${buffer.length} bytes`);
  return buffer;
}

async function uploadToR2(key, buffer, contentType) {
  console.log(`☁️  Uploading to R2: ${key}`);

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
      ContentType: contentType,
    })
  );

  const baseUrl = R2_CONFIG.publicUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/${key}`;

  console.log(`✅ Uploaded successfully: ${url}`);
  return url;
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  try {
    console.log("🚀 Starting about image upload...\n");

    // Step 1: Download the image
    const imageBuffer = await downloadImage(IMAGE_URL);

    // Step 2: Upload to R2
    const sanitizedBusinessId = sanitizeFilename(BUSINESS_ID);
    const sanitizedFilename = sanitizeFilename(IMAGE_FILENAME);
    const key = `${sanitizedBusinessId}/${sanitizedFilename}`;
    const r2Url = await uploadToR2(key, imageBuffer, "image/jpeg");

    console.log(`\n🌐 New image URL: ${r2Url}`);
    console.log("\nUse this URL in the template for the about section image.");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
