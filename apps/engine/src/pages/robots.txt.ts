import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const origin = context.url.origin;

  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${origin}/sitemap.xml`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
