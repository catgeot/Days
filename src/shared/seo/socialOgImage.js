export const DEFAULT_SITE_OG_IMAGE = 'https://www.gateo.kr/og-image.png';

const WIKIMEDIA_HOST_RE = /(^|\.)wikimedia\.org$/i;

export function isWikimediaOgImageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname;
    return WIKIMEDIA_HOST_RE.test(host);
  } catch {
    return /wikimedia\.org/i.test(trimmed);
  }
}

/**
 * Social crawlers (e.g. Facebook) often cannot fetch upload.wikimedia.org; use GATEO-hosted fallback.
 * @param {string | null | undefined} url
 * @param {string} [fallback]
 */
export function resolveSocialShareImageUrl(url, fallback = DEFAULT_SITE_OG_IMAGE) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return fallback;
  if (isWikimediaOgImageUrl(trimmed)) return fallback;
  return trimmed;
}