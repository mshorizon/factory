import type { APIContext } from 'astro';
import { getBlogsBySiteId } from '@mshorizon/db';
import { getAllSlugs } from '../lib/pages';
import type { BusinessProfile } from '@mshorizon/schema';

export async function GET(context: APIContext) {
  const { locals, url } = context;
  const { businessData, site } = locals as any;
  const origin = url.origin;

  // All page slugs from CMS
  const pageSlugs: string[] = getAllSlugs(businessData as BusinessProfile);

  // All published blog posts
  const blogs = site ? await getBlogsBySiteId(site.id, true) : [];

  // All services
  const services: any[] = (businessData as any).data?.services || [];

  type Entry = { loc: string; changefreq: string; priority: string; lastmod?: string };

  const entries: Entry[] = [
    // CMS pages
    ...pageSlugs.map((slug: string) => ({
      loc: slug === 'home' ? `${origin}/` : `${origin}/${slug}`,
      changefreq: 'weekly',
      priority: slug === 'home' ? '1.0' : '0.8',
    })),
    // Blog index
    { loc: `${origin}/blog`, changefreq: 'daily', priority: '0.8' },
    // Blog posts
    ...blogs.map((b: any) => ({
      loc: `${origin}/blog/${b.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      ...(b.publishedAt && { lastmod: new Date(b.publishedAt).toISOString().split('T')[0] }),
    })),
    // Services
    ...services.map((s: any) => ({
      loc: `${origin}/services/${s.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
