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
  // udm=14 — Google Web 탭(지도·AI Overview 패널 최소화) · glossary·행사 검색 SSOT
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=${hl}&udm=14`;
}

/**
 * @param {string} href
 */
export function extractGoogleMapsSearchQuery(href) {
  const raw = String(href || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('query');
    if (fromQuery) return fromQuery.trim();
  } catch {
    // ignore invalid URL
  }
  const match = raw.match(/[?&]query=([^&]+)/i);
  if (!match?.[1]) return '';
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
  } catch {
    return match[1].replace(/\+/g, ' ').trim();
  }
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
