/**
 * Image Path Resolver
 *
 * Resolves image paths that can be either:
 * - Absolute URLs (http:// or https://) - returned as-is
 * - Business-relative paths (e.g., /photos/hero.jpg) - resolved to /data/{businessId}/...
 */

/**
 * Check if a string is an absolute URL
 */
export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Resolve an image path for a specific business
 * - Absolute URLs are returned as-is
 * - Paths starting with /images/ are public folder assets (returned as-is)
 * - Other relative paths are prefixed with /data/{businessId}
 */
export function resolveImagePath(imagePath: string | undefined, businessId: string): string | undefined {
  if (!imagePath) return undefined;

  if (isAbsoluteUrl(imagePath)) {
    return imagePath;
  }

  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Paths starting with /images/ are served from public folder
  if (normalizedPath.startsWith('/images/')) {
    return normalizedPath;
  }

  // Other relative paths are in the data folder
  return `/data/${businessId}${normalizedPath}`;
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
