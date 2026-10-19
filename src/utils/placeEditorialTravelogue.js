import { isEditorialLogbookPublished, publicLogbookDetailPath } from './logbookEditorial.js';

export const PLACE_EDITORIAL_TRAVELOGUE_MAX = 2;

export function placeSlugFromLocation(location) {
  const idStr = location?.id != null ? String(location.id) : '';
  if (idStr.startsWith('search-') || idStr.startsWith('loc-')) return idStr;
  return location?.slug || idStr || '';
}

export function travelogueRowKey(row) {
  if (!row) return '';
  const slug = String(row.slug || '').trim();
  if (slug) return `slug:${slug}`;
  if (row.id != null) return `id:${row.id}`;
  return '';
}

export function mergePlaceEditorialTravelogues(slugFirstRows, locationRows, max = PLACE_EDITORIAL_TRAVELOGUE_MAX) {
  const seen = new Set();
  const out = [];
  const sources = [...(slugFirstRows || []), ...(locationRows || [])];
  for (const row of sources) {
    if (!isEditorialLogbookPublished(row)) continue;
    const key = travelogueRowKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= max) break;
  }
  return out;
}

export function dedupeTraveloguesAgainstVisitStories(items, visitStories) {
  const hrefs = new Set();
  const ids = new Set();
  for (const story of visitStories || []) {
    const href = String(story?.href || '').trim();
    if (href) hrefs.add(href);
    if (story?.id != null) ids.add(String(story.id));
  }
  return (items || []).filter((row) => {
    const href = publicLogbookDetailPath(row);
    if (href && hrefs.has(href)) return false;
    if (row?.id != null && ids.has(String(row.id))) return false;
    return true;
  });
}

export function selectPlaceEditorialTravelogueCards(items, visitStories, max = PLACE_EDITORIAL_TRAVELOGUE_MAX) {
  const deduped = dedupeTraveloguesAgainstVisitStories(items, visitStories);
  return deduped.slice(0, max);
}

const KO_ADMIN_SUFFIXES = ['특별자치도', '특별자치시', '특별시', '광역시', '자치도', '도', '시', '군', '구'];
const EN_ADMIN_SUFFIXES = new Set(['island', 'city']);

export function placeNameCandidates(location) {
  const out = [];
  const seen = new Set();
  for (const value of [location?.name, location?.name_ko, location?.name_en]) {
    const name = String(value || '').trim();
    const key = name.toLocaleLowerCase();
    if (name.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function adminSuffixAt(rest) {
  return KO_ADMIN_SUFFIXES.find((suffix) => rest === suffix || rest.startsWith(`${suffix} `) || rest.startsWith(`${suffix},`));
}

function trailIsMoreAdmin(trail) {
  if (!trail) return true;
  if (/[을를이가은는와과에서으로의]/.test(trail)) return false;
  const tokens = trail.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length || tokens.length > 4) return false;
  return tokens.every((token) => /^[\p{Script=Hangul}A-Za-z0-9·.-]{1,12}$/u.test(token));
}

function segmentMatchesPlaceName(segment, name) {
  const foldedSegment = segment.toLocaleLowerCase();
  const foldedName = name.toLocaleLowerCase();
  if (foldedSegment === foldedName) return true;
  if (!foldedSegment.startsWith(foldedName)) return false;
  const rest = segment.slice(name.length).trim().replace(/^[-–—]\s*/, '');
  if (!rest) return true;
  if (EN_ADMIN_SUFFIXES.has(rest.toLocaleLowerCase())) return true;
  const suffix = adminSuffixAt(rest);
  if (!suffix) return false;
  return trailIsMoreAdmin(rest.slice(suffix.length).trim());
}

/** Whole place token or place + admin suffix. A longer phrase that merely contains the name does not match. */
export function locationTextMatchesPlaceName(locationText, placeName) {
  const name = String(placeName || '').trim();
  const text = String(locationText || '').trim();
  if (name.length < 2 || !text) return false;
  const segments = text.split(/[,/|·•、，;]+/).map((part) => part.trim()).filter(Boolean);
  return (segments.length ? segments : [text]).some((segment) => segmentMatchesPlaceName(segment, name));
}

/**
 * ILIKE patterns for a location-name fallback.
 * No leading-and-trailing wildcard (`%제주%`), so '신제주' / '제주 환승 후 오사카' are not candidates.
 */
export function editorialLocationIlikePatterns(placeName) {
  const name = String(placeName || '').trim();
  if (name.length < 2) return [];
  const patterns = new Set([name, `${name} Island`, `${name},*`, `${name}, *`, `*, ${name}`, `*,${name}`, `*, ${name},*`, `*,${name},*`]);
  for (const suffix of KO_ADMIN_SUFFIXES) {
    patterns.add(`${name}${suffix}`);
    patterns.add(`${name}${suffix},*`);
  }
  return [...patterns];
}

export function editorialRowMatchesLocationFallback(row, { placeSlug = '', names = [] } = {}) {
  if (!isEditorialLogbookPublished(row)) return false;
  const slug = String(placeSlug || '').trim();
  const rowSlug = String(row?.place_slug || '').trim();
  if (rowSlug && slug && rowSlug !== slug) return false;
  if (rowSlug && slug && rowSlug === slug) return true;
  return names.some((name) => locationTextMatchesPlaceName(row?.location, name));
}

export function filterEditorialLocationFallback(rows, options) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    if (!editorialRowMatchesLocationFallback(row, options)) continue;
    const key = travelogueRowKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
