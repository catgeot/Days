/**
 * Free-search place videos (label-/loc-/search-/city- pins).
 * The YouTube query is derived here from the tapped label. Callers must not
 * pass a client-authored search string.
 *
 * Cache id is `free:<name>[:<country>]`, not the coordinate id. A label tap
 * at 12.57,122.27 and another at 12.58,122.26 are the same place; coordinate
 * keys would miss the cache and each one would be a new per-place cap bucket.
 * The `free:` prefix cannot overwrite a catalog slug such as `paris`.
 */

const FREE_SEARCH_ID_RE = /^(loc|search|city|label)-/i;
const PLACEHOLDER_NAME = /^(?:알 수 없는 지역|알 수 없는 도시|좌표 탐색|위치 탐색 중\.\.\.)$/;
const PLACEHOLDER_COUNTRY = new Set([
  '',
  'Explore',
  'Global',
  'Ocean',
  '바다',
  '대륙',
  'SEARCHING',
]);
const FORBIDDEN_QUERY_RES = [
  /https?:\/\//i,
  /javascript:/i,
  /\b(?:site|cache|related|link|inurl|intitle):/i,
  /\b(?:porn|xxx)\b/i,
  /음란|야동|포르노/,
];
const HTML_TAG_TOKEN = /^(?:\/?(?:a|b|br|div|em|font|i|p|span|strong|u))$/i;

export function isFreeSearchRequestId(value) {
  return FREE_SEARCH_ID_RE.test(String(value ?? '').trim());
}

export function isLatinPlaceLabel(value) {
  const s = String(value || '').trim();
  if (!s || PLACEHOLDER_NAME.test(s)) return false;
  if (/[\uAC00-\uD7A3\u3040-\u30ff\u3400-\u9fff]/.test(s)) return false;
  return /[A-Za-z\u00C0-\u024F]/.test(s);
}

export function normalizePlaceToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()（）]/g, ' ')
    .replace(/[\s_.'’-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Different places. A longer form that contains the other name is the same place. */
export function placeNamesConflict(a, b) {
  const x = normalizePlaceToken(a);
  const y = normalizePlaceToken(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return false;
  return true;
}

function decodeHtmlEntities(input) {
  if (!input) return '';
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const numStr = isHex ? body.slice(2) : body.slice(1);
      const code = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    const lower = body.toLowerCase();
    if (Object.hasOwn(named, body)) return named[body];
    if (Object.hasOwn(named, lower)) return named[lower];
    return match;
  });
}

export function sanitizePlaceLabel(input) {
  const stripTags = (value) => String(value || '').replace(/<\/?[a-zA-Z][^>]*>/g, ' ');
  const textIn = stripTags(decodeHtmlEntities(stripTags(input)));
  let out = '';
  for (const ch of textIn) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '<' || ch === '>' || code < 32 || code === 127) {
      out += ' ';
      continue;
    }
    out += ch;
  }
  const text = out
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token && !HTML_TAG_TOKEN.test(token))
    .join(' ');
  if (!text || PLACEHOLDER_NAME.test(text)) return '';
  return text.length > 180 ? text.slice(0, 180).trim() : text;
}

function labelRejected(q) {
  if (!q) return true;
  return FORBIDDEN_QUERY_RES.some((re) => re.test(q));
}

/**
 * Visible tapped label wins. A Latin label is used as-is, so "Romblon" is not
 * replaced by a reverse-geocoded "San Jose". labelEn is used only when the
 * visible label is not Latin and the two names are not different places.
 */
export function chooseFreeSearchQueryName({ label, labelEn } = {}) {
  const visible = String(label ?? '').trim();
  const english = String(labelEn ?? '').trim();
  const visibleOk = Boolean(visible) && !PLACEHOLDER_NAME.test(visible);
  const englishOk = isLatinPlaceLabel(english);
  if (visibleOk && isLatinPlaceLabel(visible)) return visible;
  if (visibleOk && englishOk && placeNamesConflict(visible, english)) return visible;
  if (visibleOk && englishOk) return english;
  if (visibleOk) return visible;
  if (englishOk) return english;
  return '';
}

export function slugifyPlaceCacheKey(value) {
  let out = '';
  for (const ch of sanitizePlaceLabel(value).normalize('NFC')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += ch;
      continue;
    }
    const latin = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^[a-z0-9]$/.test(latin)) {
      out += latin;
      continue;
    }
    if (out && !out.endsWith('-')) out += '-';
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function freeSearchCacheId(name, country) {
  const nameSlug = slugifyPlaceCacheKey(name);
  if (!nameSlug) return '';
  const countrySlug = slugifyPlaceCacheKey(country);
  if (!countrySlug || countrySlug === nameSlug) return `free:${nameSlug}`;
  return `free:${nameSlug}:${countrySlug}`;
}

export function buildFreeSearchVideo({ label, labelEn, country } = {}) {
  const chosen = chooseFreeSearchQueryName({ label, labelEn });
  const name = sanitizePlaceLabel(chosen);
  if (!name || labelRejected(name)) return null;
  let countryName = sanitizePlaceLabel(country);
  if (!countryName || labelRejected(countryName) || PLACEHOLDER_COUNTRY.has(countryName)) {
    countryName = '';
  }
  const nameToken = normalizePlaceToken(name);
  const countryToken = normalizePlaceToken(countryName);
  if (countryToken && (nameToken === countryToken || nameToken.includes(countryToken))) {
    countryName = '';
  }
  const query = countryName ? sanitizePlaceLabel(`${name} ${countryName}`) : name;
  if (!query || labelRejected(query)) return null;
  const cacheId = freeSearchCacheId(name, countryName);
  if (!cacheId.startsWith('free:')) return null;
  return { cacheId, query, name, country: countryName };
}

export function freeSearchRequestId(location) {
  const candidates = [
    location?.id,
    location?.place_id,
    location?.placeId,
    location?.slug,
    location?.canonical_slug,
  ];
  for (const value of candidates) {
    const id = String(value ?? '').trim();
    if (isFreeSearchRequestId(id)) return id;
  }
  return '';
}

export function freeSearchVideoTarget(location) {
  const label = String(location?.name ?? '').trim();
  const labelEn = String(location?.name_en ?? '').trim();
  const chosen = chooseFreeSearchQueryName({ label, labelEn });
  const country = isLatinPlaceLabel(chosen)
    ? String(location?.country_en || location?.country || '').trim()
    : String(location?.country || location?.country_en || '').trim();
  const built = buildFreeSearchVideo({ label, labelEn, country });
  return {
    requestPlaceId: freeSearchRequestId(location),
    label,
    labelEn,
    country,
    built,
  };
}
