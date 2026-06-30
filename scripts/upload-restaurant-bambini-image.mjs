#!/usr/bin/env node
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Distinct warm dining-room ambiance shot for the second "about" section (I Bambini /
// "time together"). Differs from about-nostrano.jpeg (kitchen/food) reused from the first
// about section, and matches the restaurant's warm dark palette.
const IMAGE_URL =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=1400&fit=crop&q=80";
const KEY = "template-restaurant/about-bambini.jpg";

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

async function downloadImage(url) {
  console.log(`📥 Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
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
    new PutObjectCommand({ Bucket: R2_CONFIG.bucketName, Key: key, Body: buffer, ContentType: contentType })
  );
  const url = `${R2_CONFIG.publicUrl.replace(/\/+$/, "")}/${key}`;
  console.log(`✅ Uploaded: ${url}`);
  return url;
}

async function main() {
  const buffer = await downloadImage(IMAGE_URL);
  const url = await uploadToR2(KEY, buffer, "image/jpeg");
  console.log(`\n🌐 New image URL: ${url}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
