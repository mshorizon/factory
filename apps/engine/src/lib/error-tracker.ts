import logger from "./logger";

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const THRESHOLD = 10;

// Map<businessId, timestamp[]>
const errorWindows = new Map<string, number[]>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, timestamps] of errorWindows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      errorWindows.delete(key);
    } else {
      errorWindows.set(key, filtered);
    }
  }
}, WINDOW_MS);

export function track5xxError(businessId: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const existing = errorWindows.get(businessId) ?? [];
  const filtered = existing.filter((t) => t > cutoff);
  filtered.push(now);
  errorWindows.set(businessId, filtered);

  if (filtered.length >= THRESHOLD) {
    logger.warn(
      { businessId, count: filtered.length, windowMs: WINDOW_MS },
      "5xx error threshold exceeded"
    );
    // Clear window after alert to prevent repeated alerts
    errorWindows.set(businessId, []);
    return true; // threshold exceeded
  }

  return false;
}

export function get5xxCount(businessId: string): number {
  const cutoff = Date.now() - WINDOW_MS;
  const timestamps = errorWindows.get(businessId) ?? [];
  return timestamps.filter((t) => t > cutoff).length;
}
