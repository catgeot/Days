import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

/** @param {Record<string, unknown> | null | undefined} spot */
export function isScenicSpotHidden(spot) {
  return Boolean(spot && spot.hidden === true);
}

/** @returns {Record<string, unknown> | null} */
export function getKoreaScenicSpotRecordById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  return list.find((s) => String(s?.id || '') === key) || null;
}

export function isHiddenKoreaScenicSpotId(id) {
  const spot = getKoreaScenicSpotRecordById(id);
  return spot ? isScenicSpotHidden(spot) : false;
}

export function isHiddenKoreaScenicPlaceSlug(slug) {
  const normalized = String(slug || '').trim().toLowerCase();
  if (!normalized) return false;
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  for (const spot of list) {
    if (!isScenicSpotHidden(spot)) continue;
    const id = String(spot.id || '').trim().toLowerCase();
    const placeSlug = String(spot.placeSlug || '').trim().toLowerCase();
    if (id === normalized || placeSlug === normalized) return true;
  }
  return false;
}

export function isHiddenHubScenicAttraction(hubId, attractionName) {
  const hubKey = normalizeKey(hubId);
  const nameKey = normalizeKey(attractionName);
  if (!hubKey || !nameKey) return false;
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  for (const spot of list) {
    if (!isScenicSpotHidden(spot)) continue;
    if (normalizeKey(spot.hubId) !== hubKey) continue;
    const attr = normalizeKey(spot.attractionName);
    const name = normalizeKey(spot.name);
    if (attr === nameKey || name === nameKey) return true;
  }
  return false;
}

/** @template T @param {T[]} spots @returns {T[]} */
export function filterVisibleKoreaScenicSpots(spots) {
  if (!Array.isArray(spots)) return [];
  return spots.filter((s) => !isScenicSpotHidden(s));
}
