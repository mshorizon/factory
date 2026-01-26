/**
 * i18n Translation Helper
 *
 * Looks up translation keys in the translations object.
 * Falls back to default text if key not found.
 */

export type Translations = Record<string, string>;

/**
 * Get a translated string by key
 * @param translations - The translations object for current language
 * @param key - The translation key to look up
 * @param defaultText - Fallback text if key not found (optional)
 * @returns The translated string or default/key
 */
export function t(
  translations: Translations,
  key: string,
  defaultText?: string
): string {
  // Look up the key in translations
  if (translations && key in translations) {
    return translations[key];
  }
  // Fall back to default text or the key itself
  return defaultText ?? key;
}

/**
 * Create a bound translation function for a specific translations object
 * @param translations - The translations object for current language
 * @returns A function that only needs key and optional default
 */
export function createT(translations: Translations) {
  return (key: string, defaultText?: string) => t(translations, key, defaultText);
}

/**
 * Translate a value that might be a translation key or plain text
 * If the value starts with "t:" it's treated as a translation key
 * Otherwise it's returned as-is
 */
export function translateValue(
  translations: Translations,
  value: string | undefined
): string | undefined {
  if (!value) return value;

  // Check if it's a translation key (starts with "t:")
  if (value.startsWith("t:")) {
    const key = value.slice(2);
    return t(translations, key, key);
  }

  // Plain text - return as-is
  return value;
}

/**
 * Deep translate an object, replacing all "t:" prefixed strings with translations
 * Recursively processes nested objects and arrays
 */
export function deepTranslate<T>(translations: Translations, data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings - translate if starts with "t:"
  if (typeof data === "string") {
    return translateValue(translations, data) as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => deepTranslate(translations, item)) as T;
  }

  // Handle objects
  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = deepTranslate(translations, value);
    }
    return result as T;
  }

  // Return primitives as-is
  return data;
}
