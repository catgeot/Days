import { citiesData } from '../data/citiesData';
import { normalizePlaceKey, placeIdVariants } from '../../../utils/travelSpotResolve.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

/** 「맥머도」↔「맥머도 기지」·「McMurdo」↔「McMurdo Station」 */
export function findCityBySearchQuery(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const ql = q.toLowerCase();

  const exact = citiesData.find(
    (c) =>
      c.name.toLowerCase() === ql ||
      (c.name_en && c.name_en.toLowerCase() === ql),
  );
  if (exact) return exact;

  const cityQueryKeys = new Set(
    placeIdVariants(q)
      .map((v) => normalizePlaceKey(v))
      .filter(Boolean),
  );
  if (cityQueryKeys.size === 0) return null;

  return (
    citiesData.find((c) => {
      for (const field of [c.name, c.name_en, c.slug]) {
        if (!field) continue;
        for (const v of placeIdVariants(field)) {
          if (cityQueryKeys.has(normalizePlaceKey(v))) return true;
        }
      }
      return false;
    }) || null
  );
}

export function cityToSuggestion(city) {
  if (!city) return null;
  return {
    id: `city-${city.lat}-${city.lng}`,
    kind: 'city',
    badge: '도시',
    name: city.name,
    name_en: city.name_en || city.name,
    country: city.country || 'Explore',
    country_en: city.country_en || 'Explore',
    lat: city.lat,
    lng: city.lng,
    slug: city.slug,
    desc: city.desc,
    type: 'temp-base',
    uiPlace: true,
    source: 'cities',
  };
}

export function matchCitiesPrefix(query, { limit = 4 } = {}) {
  const q = String(query || '').trim();
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const key = normalizeKey(q);
  const hits = citiesData.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const nameEn = (c.name_en || '').toLowerCase();
    return (
      name.includes(lower) ||
      nameEn.includes(lower) ||
      normalizeKey(c.name).startsWith(key) ||
      normalizeKey(c.name_en).startsWith(key) ||
      normalizeKey(c.slug).startsWith(key)
    );
  });
  return hits.slice(0, limit);
}
