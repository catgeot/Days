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

/**
 * @param {object | null | undefined} item
 */
export function nearbyItemHasImage(item) {
  return Boolean(
    usableNearbyImageUrl(item?.firstImage) || usableNearbyImageUrl(item?.imageUrl),
  );
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
    return {
      ...item,
      firstImage: url,
      imageUrl: usableNearbyImageUrl(item.imageUrl) || url,
    };
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
