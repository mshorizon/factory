#!/usr/bin/env node
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

const IMAGES = [
  {
    // Gavel / legal enforcement
    url: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1200&h=800&fit=crop&q=85",
    filename: "blog-tytul-wykonawczy.jpg",
  },
  {
    // Legal documents / scales of justice
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=800&fit=crop&q=85",
    filename: "blog-prawa-dluznika.jpg",
  },
  {
    // Digital / tech / EPU
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=85",
    filename: "blog-epu-przewodnik.jpg",
  },
];

const BUSINESS_ID = "portfolio-law-001";

async function downloadImage(url) {
  console.log(`📥 Downloading: ${url}`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HazelgrouseFactory/1.0)",
      "Accept": "image/jpeg,image/*",
    },
  });
  if (!response.ok) throw new Error(`Failed to download (${response.status}): ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`   ${buffer.length} bytes`);
  return buffer;
}

async function uploadToR2(key, buffer, contentType) {
  const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.endpoint,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  });

  await client.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const url = `${R2_CONFIG.publicUrl.replace(/\/+$/, "")}/${key}`;
  console.log(`✅ ${url}`);
  return url;
}

async function main() {
  console.log("🚀 Uploading portfolio-law blog images...\n");
  const results = [];

  for (const img of IMAGES) {
    const key = `${BUSINESS_ID}/${img.filename}`;
    const buffer = await downloadImage(img.url);
    const url = await uploadToR2(key, buffer, "image/jpeg");
    results.push({ filename: img.filename, url });
  }

  console.log("\n📋 Final URLs:");
  for (const r of results) {
    console.log(`  ${r.filename}: ${r.url}`);
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
