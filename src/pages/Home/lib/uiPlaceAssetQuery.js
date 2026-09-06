import { isUrlSafeEnglishLabel } from './formatUrlName.js';

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

export function mergeSearchBoxEnglishHits(koHits, enHits) {
  const byId = new Map(
    (enHits || []).filter((h) => h?.mapboxId).map((h) => [h.mapboxId, h]),
  );
  return (koHits || []).map((hit) => {
    if (isLatinPlaceName(hit?.name_en)) return hit;
    return mergeLatinPlaceFields(hit, byId.get(hit?.mapboxId));
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
