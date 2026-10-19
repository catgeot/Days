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
