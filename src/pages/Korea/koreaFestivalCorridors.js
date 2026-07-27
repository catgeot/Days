import corridorsSsot from './data/koreaFestivalCorridors.json' with { type: 'json' };

const PRIORITY = Array.isArray(corridorsSsot?.priority) ? corridorsSsot.priority : [];
const CORRIDORS = Array.isArray(corridorsSsot?.corridors) ? corridorsSsot.corridors : [];

const byId = new Map(CORRIDORS.map((c) => [c.id, c]));

/**
 * @param {unknown} mapx
 * @param {unknown} mapy
 * @returns {{ lng: number, lat: number } | null}
 */
export function festivalLngLat(mapx, mapy) {
  const lng = Number(mapx);
  const lat = Number(mapy);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 124 || lng > 132.5 || lat < 32.8 || lat > 39.2) return null;
  return { lng, lat };
}

/**
 * @param {{ minLng: number, maxLng: number, minLat: number, maxLat: number }} box
 * @param {number} lng
 * @param {number} lat
 */
function inBox(box, lng, lat) {
  return (
    lng >= box.minLng &&
    lng <= box.maxLng &&
    lat >= box.minLat &&
    lat <= box.maxLat
  );
}

/**
 * @param {unknown} mapx TourAPI mapx (lng)
 * @param {unknown} mapy TourAPI mapy (lat)
 * @returns {string} corridor id or 'unmapped'
 */
export function assignCorridor(mapx, mapy) {
  const pt = festivalLngLat(mapx, mapy);
  if (!pt) return 'unmapped';

  for (const id of PRIORITY) {
    const corridor = byId.get(id);
    if (!corridor) continue;
    const boxes = Array.isArray(corridor.boxes) ? corridor.boxes : [];
    for (const box of boxes) {
      if (box && inBox(box, pt.lng, pt.lat)) return id;
    }
  }
  return 'unmapped';
}

/**
 * @returns {{ id: string, label: string }[]}
 */
export function listCorridors() {
  return PRIORITY.map((id) => {
    const c = byId.get(id);
    return c ? { id: c.id, label: String(c.label || c.id) } : null;
  }).filter(Boolean);
}

/**
 * @param {object[]} items
 * @returns {Map<string, number>}
 */
export function countByCorridor(items) {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const item of items || []) {
    const id = assignCorridor(item?.mapx, item?.mapy);
    if (id === 'unmapped') continue;
    map.set(id, (map.get(id) || 0) + 1);
  }
  return map;
}

/**
 * @param {object[]} items
 * @param {string} corridorId
 */
export function filterByCorridor(items, corridorId) {
  if (!corridorId || corridorId === 'all') return items || [];
  return (items || []).filter(
    (item) => assignCorridor(item?.mapx, item?.mapy) === corridorId,
  );
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {string} corridor id or 'unmapped'
 */
export function assignCorridorFromLatLng(lat, lng) {
  return assignCorridor(lng, lat);
}
