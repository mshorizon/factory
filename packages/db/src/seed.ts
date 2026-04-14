import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sites, blogs } from "./schema.js";
import { eq, and } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const dataDir = join(import.meta.dirname, "..", "..", "..", "templates");

function readJson(filePath: string): any {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return null;
}

async function seed() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  const entries = readdirSync(dataDir, { withFileTypes: true });
  const businessDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  console.log(`Found ${businessDirs.length} businesses to seed: ${businessDirs.join(", ")}`);

  for (const subdomain of businessDirs) {
    const configPath = join(dataDir, subdomain, `${subdomain}.json`);
    const config = readJson(configPath);

    if (!config) {
      console.warn(`  Skipping ${subdomain}: no config JSON found`);
      continue;
    }

    // Read translations
    const translations: Record<string, Record<string, unknown>> = {};
    const transDir = join(dataDir, subdomain, "translations");
    if (existsSync(transDir)) {
      for (const lang of ["en", "pl", "de", "uk"]) {
        const langData = readJson(join(transDir, `${lang}.json`));
        if (langData) {
          translations[lang] = langData;
        }
      }
      // Read _settings (primary language etc.)
      const settings = readJson(join(transDir, "_settings.json"));
      if (settings) {
        translations["_settings"] = settings;
      }
    }

    const businessName = config.business?.name || config.name || subdomain;
    const industry = config.business?.industry || config.industry || null;

    // Upsert: update if exists, insert if not
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.subdomain, subdomain))
      .limit(1);

    if (existing) {
      await db
        .update(sites)
        .set({
          businessName,
          industry,
          config,
          translations,
          updatedAt: new Date(),
        })
        .where(eq(sites.subdomain, subdomain));
      console.log(`  Updated: ${subdomain}`);
    } else {
      await db.insert(sites).values({
        subdomain,
        businessName,
        industry,
        config,
        translations,
      });
      console.log(`  Inserted: ${subdomain}`);
    }

    // Seed blogs if they exist
    const blogsDir = join(dataDir, subdomain, "blogs");
    if (existsSync(blogsDir)) {
      const blogFiles = readdirSync(blogsDir).filter((f) => f.endsWith(".json"));

      // Get site ID for blog foreign key
      const [site] = await db
        .select({ id: sites.id })
        .from(sites)
        .where(eq(sites.subdomain, subdomain))
        .limit(1);

      if (site) {
        for (const blogFile of blogFiles) {
          const blogData = readJson(join(blogsDir, blogFile));
          if (!blogData || !blogData.slug) {
            console.warn(`    Skipping invalid blog: ${blogFile}`);
            continue;
          }

          // Detect language from filename: e.g. "my-post.pl.json" → "pl", "my-post.json" → "en"
          const langMatch = blogFile.match(/\.([a-z]{2})\.json$/);
          const lang = langMatch ? langMatch[1] : "en";

          // Check if blog already exists (don't overwrite admin-edited blogs)
          const [existingBlog] = await db
            .select({ id: blogs.id })
            .from(blogs)
            .where(and(eq(blogs.siteId, site.id), eq(blogs.slug, blogData.slug), eq(blogs.lang, lang)))
            .limit(1);

          if (!existingBlog) {
            await db.insert(blogs).values({
              siteId: site.id,
              slug: blogData.slug,
              lang,
              title: blogData.title,
              description: blogData.description || null,
              content: blogData.content,
              image: blogData.image || null,
              author: blogData.author || null,
              category: blogData.category || null,
              tags: blogData.tags || [],
              status: blogData.status || "published",
              standalone: blogData.standalone || false,
              publishedAt: blogData.publishedAt ? new Date(blogData.publishedAt) : new Date(),
              metaTitle: blogData.metaTitle || null,
              metaDescription: blogData.metaDescription || null,
            });
            console.log(`    Seeded blog [${lang}]: ${blogData.slug}`);
          } else {
            console.log(`    Skipped existing blog [${lang}]: ${blogData.slug}`);
          }
        }
      }
    }
  }

  console.log("Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
