#!/usr/bin/env node
/**
 * Upload notary-specific blog images for notariuszwgarwolinie to R2.
 * Each blog slug gets a unique, relevant image.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import postgres from "postgres";

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

const DATABASE_URL = process.env.DATABASE_URL;
const BUSINESS_ID = "notariuszwgarwolinie";

// Unique, notary-specific Unsplash images per blog slug
const IMAGES = [
  {
    slug: "akt-poswiadczenia-dziedziczenia-przewodnik",
    filename: "blog-akt-poswiadczenia-dziedziczenia.jpg",
    // Elderly person reviewing estate/will documents at desk — inheritance context
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&q=85",
    description: "Person reviewing inheritance documents at desk",
  },
  {
    slug: "dokumenty-do-czynnosci-notarialnej",
    filename: "blog-dokumenty-do-czynnosci-notarialnej.jpg",
    // Stack of official folders and binders — document checklist
    url: "https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=1200&h=800&fit=crop&q=85",
    description: "Business documents and folders",
  },
  {
    slug: "informacje-dla-kupujacych",
    filename: "blog-informacje-dla-kupujacych.jpg",
    // House model and keys — real estate buyers guide
    url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop&q=85",
    description: "House keys and property purchase",
  },
  {
    slug: "informacje-o-oplatach",
    filename: "blog-informacje-o-oplatach.jpg",
    // Financial document with pen, fee calculations
    url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=800&fit=crop&q=85",
    description: "Financial document with calculator — notary fees",
  },
  {
    slug: "service-akty-notarialne",
    filename: "blog-service-akty-notarialne.jpg",
    // Contract/agreement signing — notarial deeds (real estate, gifts, exchanges)
    url: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&h=800&fit=crop&q=85",
    description: "Signing notarial deed at office",
  },
  {
    slug: "service-depozyt-notarialny",
    filename: "blog-service-depozyt-notarialny.jpg",
    // Safe/vault concept — notarial deposit security
    url: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=1200&h=800&fit=crop&q=85",
    description: "Security vault — notarial deposit",
  },
  {
    slug: "service-pelnomocnictwa-testamenty",
    filename: "blog-service-pelnomocnictwa-testamenty.jpg",
    // Professional handshake — power of attorney agreement
    url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&h=800&fit=crop&q=85",
    description: "Professional handshake — power of attorney",
  },
  {
    slug: "service-poswiadczenia",
    filename: "blog-service-poswiadczenia.jpg",
    // Scales of justice / official legal certification
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=800&fit=crop&q=85",
    description: "Scales of justice — official certifications",
  },
  {
    slug: "service-poswiadczenie-dziedziczenia",
    filename: "blog-service-poswiadczenie-dziedziczenia.jpg",
    // Formal office meeting — inheritance certification at notary
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop&q=85",
    description: "Formal meeting at notary office — inheritance certificate",
  },
  {
    slug: "service-umowy-spolek",
    filename: "blog-service-umowy-spolek.jpg",
    // Business people around table signing company agreement
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&q=85",
    description: "Business meeting — company agreements",
  },
  {
    slug: "zakup-nieruchomosci-u-notariusza",
    filename: "blog-zakup-nieruchomosci-u-notariusza.jpg",
    // House exterior / property purchase at notary
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&q=85",
    description: "House exterior — property purchase at notary",
  },
];

async function downloadImage(url) {
  console.log(`  📥 ${url}`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HazelgrouseFactory/1.0)",
      Accept: "image/jpeg,image/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`     ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

async function uploadToR2(client, key, buffer) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );
  return `${R2_CONFIG.publicUrl}/${key}`;
}

async function main() {
  console.log(`🚀 Uploading notary-specific blog images for ${BUSINESS_ID}\n`);

  const r2 = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.endpoint,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  });

  const results = [];

  for (const img of IMAGES) {
    console.log(`\n📷 ${img.slug}`);
    console.log(`   ${img.description}`);
    try {
      const buffer = await downloadImage(img.url);
      const key = `${BUSINESS_ID}/${img.filename}`;
      const url = await uploadToR2(r2, key, buffer);
      console.log(`   ✅ ${url}`);
      results.push({ slug: img.slug, filename: img.filename, url, ok: true });
    } catch (err) {
      console.error(`   ❌ ${err.message}`);
      results.push({ slug: img.slug, filename: img.filename, url: null, ok: false, error: err.message });
    }
  }

  console.log("\n\n📋 Upload summary:");
  const successful = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  console.log(`   ✅ ${successful.length} uploaded`);
  if (failed.length) {
    console.log(`   ❌ ${failed.length} failed:`);
    failed.forEach((r) => console.log(`      - ${r.slug}: ${r.error}`));
  }

  if (!successful.length) {
    console.error("\n❌ No images uploaded. Skipping DB update.");
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.warn("\n⚠️  DATABASE_URL not set — skipping DB update.");
    console.log("Set DATABASE_URL and re-run, or update the DB manually with these URLs:");
    successful.forEach((r) => console.log(`  ${r.slug}: ${r.url}`));
    process.exit(0);
  }

  console.log("\n🗄️  Updating database...");
  const sql = postgres(DATABASE_URL);

  try {
    // Get the site id for this business
    const [site] = await sql`SELECT id FROM sites WHERE subdomain = ${BUSINESS_ID}`;
    if (!site) {
      throw new Error(`Site '${BUSINESS_ID}' not found in database`);
    }
    const siteId = site.id;
    console.log(`   Site ID: ${siteId}`);

    let updated = 0;
    for (const r of successful) {
      const result = await sql`
        UPDATE blogs
        SET image = ${r.url}
        WHERE site_id = ${siteId}
          AND slug = ${r.slug}
      `;
      const count = result.count ?? 0;
      console.log(`   ${count > 0 ? "✅" : "⚠️ "} ${r.slug} (${count} rows updated)`);
      updated += count;
    }

    console.log(`\n✅ Database updated: ${updated} blog rows now use R2 images.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
