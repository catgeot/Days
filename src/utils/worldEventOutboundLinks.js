/**
 * External link builders for world-event action chips (D2) and search (D3).
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

/**
 * @param {string} query
 */
export function naverWebSearchUrl(query) {
  const q = String(query || '').trim();
  if (!q) return '';
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
}

/**
 * @param {string} query
 * @param {string} [locale]
 */
export function youtubeWebSearchUrl(query, locale = 'ko') {
  const q = String(query || '').trim();
  if (!q) return '';
  const hl = locale === 'en' ? 'en' : 'ko';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=${hl}`;
}
