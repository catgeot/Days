/**
 * External link builders for world-event action chips (D2).
 */

/**
 * @param {string} query
 * @param {string} [locale]
 */
export function googleMapsSearchUrl(query, locale = 'ko') {
  const q = String(query || '').trim();
  if (!q) return '';
  const hl = locale === 'en' ? 'en' : 'ko';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&hl=${hl}`;
}

/**
 * @param {string} query
 * @param {string} [locale]
 */
export function googleWebSearchUrl(query, locale = 'ko') {
  const q = String(query || '').trim();
  if (!q) return '';
  const hl = locale === 'en' ? 'en' : 'ko';
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=${hl}`;
}
