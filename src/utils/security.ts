/**
 * security.ts — Client-side Defensive Security Utilities
 * Protects against DOM-based XSS, URI scheme injection (javascript:, vbscript:, data:),
 * and validates URL targets for hyperlinks and redirects.
 */

const DANGEROUS_SCHEMES_REGEX = /^(javascript|vbscript|data):/i;
const SAFE_SCHEMES_REGEX = /^(https?:\/\/|\/|#|mailto:|tel:|blob:)/i;

/**
 * Validates and sanitizes a URL before rendering it into an `href` or navigating to it.
 * Neutralizes Stored and DOM XSS vectors via the pseudo-protocol `javascript:`.
 *
 * @param url The raw URL string to be validated.
 * @param fallback The fallback URL if validation fails (defaults to "#").
 * @returns The sanitized safe URL or the fallback.
 */
export function sanitizeHref(url?: string | null, fallback: string = "#"): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Explicitly disallow any javascript:, vbscript:, or data: schemes
  if (DANGEROUS_SCHEMES_REGEX.test(trimmed)) {
    return fallback;
  }

  // Allow standard web protocols, relative paths, anchor fragments, and safe communication links
  if (SAFE_SCHEMES_REGEX.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

/**
 * Returns true if the provided URL is safe from dangerous protocol injection.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (DANGEROUS_SCHEMES_REGEX.test(trimmed)) return false;
  return SAFE_SCHEMES_REGEX.test(trimmed);
}
