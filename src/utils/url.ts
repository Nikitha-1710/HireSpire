/**
 * Helper to ensure URLs have a valid http/https scheme so clicking on them
 * in the browser opens the actual external website/profile rather than a relative path.
 */
export function formatExternalUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
