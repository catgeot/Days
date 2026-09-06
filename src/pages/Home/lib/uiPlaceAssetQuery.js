import { formatUrlName, isEphemeralSlug, isUrlSafeEnglishLabel } from './formatUrlName.js';

const PLACEHOLDER_COUNTRY = new Set([
  'Explore',
  'Global',
  'Ocean',
  '바다',
  '대륙',
  'SEARCHING',
  '',
]);

export function isLatinPlaceName(value) {
  return isUrlSafeEnglishLabel(value);
}

/** Unsplash/YouTube/URL용 — 한글이 섞인 name_en은 쓰지 않음 */
export function pickLatinPlaceName(loc) {
  if (!loc || typeof loc !== 'object') return '';
  for (const key of ['name_en', 'name_preferred', 'name']) {
    const raw = String(loc[key] || '').trim();
    if (!raw) continue;
    const first = raw.split(',')[0].trim();
    if (isLatinPlaceName(first)) return first;
  }
  return '';
}

export function needsLatinPlaceName(loc) {
  if (!loc || typeof loc !== 'object') return false;
  return !pickLatinPlaceName(loc);
}

/**
 * Mapbox ko 히트에 en 히트의 라틴 지명·국가를 붙인다.
 * 표시명(name)·한글 국가는 유지.
 */
export function mergeLatinPlaceFields(base, english) {
  if (!base || typeof base !== 'object') return base;
  const latinName = pickLatinPlaceName(english) || pickLatinPlaceName(base);
  const latinCountry = pickLatinPlaceName({
    name_en: english?.country_en,
    name: english?.country,
  }) || pickLatinPlaceName({
    name_en: base?.country_en,
    name: base?.country,
  });
  if (!latinName && !latinCountry) return base;
  return {
    ...base,
    ...(latinName ? { name_en: latinName } : {}),
    ...(latinCountry ? { country_en: latinCountry } : {}),
  };
}

const normalizePlaceKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

/** Search Box ko/en·지오코딩이 같은 핀인지 — mapbox_id가 달라도 좌표로 붙인다 */
export const SAME_PLACE_CENTER_DEG = 0.08;

export function samePlaceCenter(a, b, maxDeg = SAME_PLACE_CENTER_DEG) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return false;
  return Math.abs(lat1 - lat2) <= maxDeg && Math.abs(lng1 - lng2) <= maxDeg;
}

/** 라틴 name_en이 있으면 uiPlace slug를 영문으로 — 한글 place_id 인물 갤러리 고착 방지 */
export function ensureLatinPlaceSlug(place) {
  if (!place || typeof place !== 'object') return place;
  const latin = pickLatinPlaceName(place);
  if (!latin) return place;
  const next = { ...place, name_en: latin };
  const slug = formatUrlName(latin);
  if (!slug) return next;
  const current = String(place.slug || '').trim();
  if (current && !isEphemeralSlug(current) && !/[\uAC00-\uD7A3]/.test(current)) {
    return next;
  }
  return { ...next, slug };
}

export function mergeSearchBoxEnglishHits(koHits, enHits) {
  const enList = enHits || [];
  const byId = new Map(enList.filter((h) => h?.mapboxId).map((h) => [h.mapboxId, h]));
  return (koHits || []).map((hit) => {
    if (isLatinPlaceName(hit?.name_en)) return ensureLatinPlaceSlug(hit);
    const byMapbox = hit?.mapboxId ? byId.get(hit.mapboxId) : null;
    const byCenter = byMapbox ? null : enList.find((h) => samePlaceCenter(h, hit));
    return ensureLatinPlaceSlug(mergeLatinPlaceFields(hit, byMapbox || byCenter));
  });
}

/** Enter 지오코딩 영문을 Search Box 동명·근접 히트에 이식 — 드롭다운·선택 카드가 다른 핀이 되지 않게 */
export function overlayGeocodeLatinOnHits(hits, coords) {
  const list = Array.isArray(hits) ? hits : [];
  if (!coords) return list;
  const geo = {
    name: coords.name,
    name_en: coords.name_en,
    country: coords.country,
    country_en: coords.country_en,
    lat: coords.lat,
    lng: coords.lng,
  };
  const geoNameKey = normalizePlaceKey(geo.name);
  const geoLatinKey = normalizePlaceKey(pickLatinPlaceName(geo));
  return list.map((hit) => {
    if (!hit) return hit;
    const nameHit = normalizePlaceKey(hit.name);
    const latinHit = normalizePlaceKey(pickLatinPlaceName(hit));
    const sameName =
      (geoNameKey && nameHit === geoNameKey) ||
      (geoLatinKey && (nameHit === geoLatinKey || latinHit === geoLatinKey));
    if (!sameName && !samePlaceCenter(hit, geo)) return hit;
    return ensureLatinPlaceSlug(mergeLatinPlaceFields(hit, geo));
  });
}

function dictionaryEnglish(name, dictionary) {
  if (!name || !dictionary) return '';
  const direct = dictionary[name];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  return '';
}

/**
 * 스톡 갤러리 1차 쿼리. 한글 단독 검색은 인물 오탐 → 라틴 지명만.
 * @returns {{ primaryQuery: string, backupQuery: string, koreanName: string }}
 */
export function resolveGalleryStockQuery(targetSpot, fallbackDictionary = {}) {
  const koreanName =
    typeof targetSpot === 'object'
      ? String(targetSpot?.name || '').trim()
      : String(targetSpot || '').trim();
  const latin = typeof targetSpot === 'object' ? pickLatinPlaceName(targetSpot) : '';
  const fromDict =
    dictionaryEnglish(koreanName, fallbackDictionary) ||
    (typeof targetSpot === 'object'
      ? dictionaryEnglish(String(targetSpot?.name_en || '').trim(), fallbackDictionary)
      : '');
  const primaryQuery = latin || fromDict || '';

  let backupQuery = '';
  if (typeof targetSpot === 'object' && primaryQuery) {
    const regionEn = pickLatinPlaceName(targetSpot.galleryRegionSpot);
    const country = pickLatinPlaceName({
      name_en: targetSpot.country_en,
      name: targetSpot.country,
    }) || String(targetSpot.country_en || targetSpot.country || '').trim();
    if (regionEn && regionEn.toLowerCase() !== primaryQuery.toLowerCase()) {
      backupQuery = `${primaryQuery} ${regionEn}`;
    } else if (country && country !== primaryQuery && !PLACEHOLDER_COUNTRY.has(country)) {
      backupQuery = `${primaryQuery} ${country}`;
    }
  }

  return { primaryQuery, backupQuery, koreanName };
}

function usableCountry(location) {
  const latin = pickLatinPlaceName({
    name_en: location?.country_en,
    name: location?.country,
  });
  if (latin) return latin;
  const raw = String(location?.country || '').trim();
  if (!raw || PLACEHOLDER_COUNTRY.has(raw)) return '';
  return raw;
}

/** YouTube Edge 쿼리 — 라틴 지명이 있으면 한글 인명 검색을 1차로 쓰지 않음 */
export function resolvePlaceVideoQueries(location) {
  const latin = pickLatinPlaceName(location);
  const country = usableCountry(location);
  if (latin) {
    const query = country ? `${latin} ${country}` : latin;
    return { query, fallbackQuery: `${latin} travel vlog` };
  }
  const name = String(location?.name || '').trim();
  const query = country ? `${name} ${country}` : name;
  return { query, fallbackQuery: `${query} travel vlog` };
}
