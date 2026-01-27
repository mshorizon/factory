import type { APIRoute } from 'astro';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// MIME types for common image formats
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
};

export const GET: APIRoute = async ({ params }) => {
  const { path } = params;

  if (!path) {
    return new Response('Not found', { status: 404 });
  }

  // Security: prevent directory traversal
  if (path.includes('..')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Only allow image files
  const ext = '.' + path.split('.').pop()?.toLowerCase();
  const mimeType = mimeTypes[ext];

  if (!mimeType) {
    return new Response('Not found', { status: 404 });
  }

  // Resolve path to data folder (relative to project root)
  const filePath = join(process.cwd(), '..', '..', 'data', path);

  if (!existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
