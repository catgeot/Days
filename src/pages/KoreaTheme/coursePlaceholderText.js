import { extractTourAttractionSigungu } from '../Home/lib/koreaTourAttractionLocality.js';

const DASH_WRAPPED_PLACEHOLDER_RE =
  /-{2,}[^\S\n]*(?:지자체|시군구|시군|관광지|코스명|테마)[^\S\n]*-{2,}/gu;

const DASH_ONLY_RE = /^[\s\-–—~._·]+$/u;

export function courseMunicipalityLabel(...addrs) {
  for (const addr of addrs) {
    const label = extractTourAttractionSigungu(addr);
    if (label) return label;
  }
  return '';
}

/**
 * TourAPI leaves dash-wrapped blanks such as «----지자체-----».
 * Swap in the municipality when we have one, otherwise drop the token.
 * @param {unknown} value
 * @param {string} [municipality]
 */
export function replaceDashWrappedPlaceholders(value, municipality = '') {
  const raw = String(value ?? '');
  if (!raw.trim()) return '';
  const muni = String(municipality || '').trim();
  const replaced = raw.replace(DASH_WRAPPED_PLACEHOLDER_RE, muni ? ` ${muni} ` : ' ');
  const collapsed = replaced
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
  if (!collapsed || DASH_ONLY_RE.test(collapsed)) return muni;
  return collapsed;
}
