/**
 * Image Path Resolver
 *
 * After R2 migration, all image URLs in the DB should be absolute R2 URLs.
 * This module provides a safety fallback: any remaining relative paths
 * are resolved to R2 URLs using the configured public base URL.
 */

import { getR2PublicUrl } from "./r2";

/**
 * Check if a string is an absolute URL
 */
export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Resolve an image path for a specific business.
 * - Absolute URLs are returned as-is (including R2 URLs)
 * - Relative paths are resolved to R2: {R2_PUBLIC_URL}/{businessId}/{path}
 */
export function resolveImagePath(imagePath: string | undefined, businessId: string): string | undefined {
  if (!imagePath) return undefined;

  if (isAbsoluteUrl(imagePath)) {
    return imagePath;
  }

  // Strip leading slash and known prefixes for legacy paths
  let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // Remove legacy prefixes like "images/{businessId}/" or "data/{businessId}/"
  const legacyPrefixes = [
    `images/${businessId}/`,
    `data/${businessId}/`,
  ];
  for (const prefix of legacyPrefixes) {
    if (cleanPath.startsWith(prefix)) {
      cleanPath = cleanPath.slice(prefix.length);
      break;
    }
  }

  // Resolve to R2 URL
  const baseUrl = getR2PublicUrl();
  return `${baseUrl}/${businessId}/${cleanPath}`;
}

/**
 * Deep resolve all image paths in an object
 * Looks for common image field names and resolves them
 */
export function deepResolveImages<T>(data: T, businessId: string): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings - check if it looks like an image path
  if (typeof data === 'string') {
    return data as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => deepResolveImages(item, businessId)) as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    const imageFields = ['image', 'backgroundImage', 'logo', 'icon', 'favicon', 'src'];

    for (const [key, value] of Object.entries(data)) {
      if (imageFields.includes(key) && typeof value === 'string') {
        // This is an image field - resolve it
        result[key] = resolveImagePath(value, businessId);
      } else {
        // Recursively process other fields
        result[key] = deepResolveImages(value, businessId);
      }
    }
    return result as T;
  }

  // Return primitives as-is
  return data;
}
