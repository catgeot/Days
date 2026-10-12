import { resolveListImageUrl } from '../../../utils/listImageUrl.js';

/**
 * Early nearby rows often have no first_image. Later thumb URLs merge in place.
 * @param {unknown} value
 * @returns {string}
 */
export function usableNearbyImageUrl(value) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  return raw.replace(/^http:\/\//i, 'https://');
}

function toHttps(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('//')) return `https:${s}`;
  return s.replace(/^http:\/\//i, 'https://');
}

/**
 * Same URL candidates as the nearby row thumbnail (list role).
 * @param {object | null | undefined} spot
 * @param {unknown} [extraThumb]
 * @returns {string[]}
 */
export function nearbyRowThumbCandidateUrls(spot, extraThumb = '') {
  const out = [];
  const seen = new Set();
  for (const raw of [spot?.firstImage, spot?.imageUrl, extraThumb]) {
    const url = resolveListImageUrl(toHttps(raw), { role: 'list' });
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * @param {object | null | undefined} item
 * @param {unknown} [extraThumb]
 */
export function nearbyItemHasImage(item, extraThumb = '') {
  return nearbyRowThumbCandidateUrls(item, extraThumb).length > 0;
}

/**
 * After DB/live lookup, ids that still have no displayable thumb → landmark icon.
 * @param {string[]} ids
 * @param {Map<string, object>} spotById
 * @param {Map<string, string>} thumbById
 * @returns {string[]}
 */
export function nearbySightIdsWithoutDisplayableThumb(ids, spotById, thumbById) {
  const spots = spotById instanceof Map ? spotById : new Map();
  const thumbs = thumbById instanceof Map ? thumbById : new Map();
  /** @type {string[]} */
  const miss = [];
  for (const id of ids || []) {
    const key = String(id || '').trim();
    if (!/^\d{1,32}$/.test(key)) continue;
    const spot = spots.get(key);
    const extra = thumbs.get(key);
    if (!spot) {
      if (!nearbyRowThumbCandidateUrls({ firstImage: extra }, '').length) miss.push(key);
      continue;
    }
    const merged = mergeNearbyItemImages([spot], thumbs)[0];
    if (!nearbyRowThumbCandidateUrls(merged, extra).length) miss.push(key);
  }
  return miss;
}

/**
 * Rendered nearby rows that still need a photo lookup.
 * @param {object[] | null | undefined} items
 * @returns {string[]}
 */
export function missingNearbySightImageIds(items) {
  /** @type {string[]} */
  const ids = [];
  const seen = new Set();
  for (const item of items || []) {
    if (nearbyItemHasImage(item)) continue;
    const id = String(item?.contentId || '').trim();
    if (!/^\d{1,32}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Fill missing photos without reordering or replacing a photo already on the row.
 * @param {object[] | null | undefined} items
 * @param {Map<string, string> | Record<string, string> | null | undefined} urlById
 */
export function mergeNearbyItemImages(items, urlById) {
  const map = urlById instanceof Map ? urlById : new Map(Object.entries(urlById || {}));
  return (items || []).map((item) => {
    if (!item || nearbyItemHasImage(item)) return item;
    const id = String(item.contentId || '').trim();
    const url = usableNearbyImageUrl(map.get(id));
    if (!url) return item;
    const merged = {
      ...item,
      firstImage: url,
      imageUrl: usableNearbyImageUrl(item.imageUrl) || url,
    };
    if (!nearbyRowThumbCandidateUrls(merged).length) return item;
    return merged;
  });
}

/**
 * Landmark icon only after lookup settles with no photo.
 * A contentId still waiting stays pending even when the list is already on screen.
 * @param {object | null | undefined} item
 * @param {Set<string> | string[] | null | undefined} settledMissIds
 */
export function nearbySightImagePending(item, settledMissIds) {
  if (nearbyItemHasImage(item)) return false;
  const id = String(item?.contentId || '').trim();
  if (!/^\d{1,32}$/.test(id)) return false;
  const miss = settledMissIds instanceof Set ? settledMissIds : new Set(settledMissIds || []);
  return !miss.has(id);
}
