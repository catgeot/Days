import { citiesData } from '../data/citiesData.js';
import { shouldRefreshPlaceVideoCache } from './placeVideoCache.js';

const FREE_SEARCH_ID_RE = /^(loc|search|city|label)-/i;
const PLACEHOLDER_NAME = /^(알 수 없는 지역|알 수 없는 도시)$/;
const BROAD_REGION = /수도권|전국/;

const CATALOG_CITY_SLUGS = new Set(
  (citiesData || [])
    .map((city) => String(city?.slug || '').trim().toLowerCase())
    .filter(Boolean),
);

export function isFreeSearchPlaceId(value) {
  return FREE_SEARCH_ID_RE.test(String(value ?? '').trim());
}

/** citiesData slug, or the same city reached by a city-lat-lng id. */
export function catalogCitySlug(location) {
  if (location == null || typeof location !== 'object') return '';
  const slugs = [location.canonical_slug, location.slug, location.place_id, location.placeId];
  for (const value of slugs) {
    const slug = String(value ?? '').trim().toLowerCase();
    if (slug && CATALOG_CITY_SLUGS.has(slug)) return slug;
  }
  const id = String(location.id ?? location.placeId ?? '');
  if (!/^city-/i.test(id)) return '';
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  const city = (citiesData || []).find(
    (row) => Math.abs(Number(row.lat) - lat) < 0.001 && Math.abs(Number(row.lng) - lng) < 0.001,
  );
  return city?.slug ? String(city.slug).toLowerCase() : '';
}

/**
 * Link-only mode is for pins that are not a catalog city.
 * A city-<lat>-<lng> id with a citiesData slug (moorea, suggestion routes) still searches.
 */
export function isFreeSearchLocation(location) {
  if (location == null) return false;
  if (typeof location !== 'object') return isFreeSearchPlaceId(location);
  if (catalogCitySlug(location)) return false;
  return [
    location.id,
    location.place_id,
    location.placeId,
    location.slug,
    location.canonical_slug,
  ].some(isFreeSearchPlaceId);
}

function usableLabel(value) {
  const text = String(value ?? '').trim();
  if (!text || PLACEHOLDER_NAME.test(text) || BROAD_REGION.test(text)) return '';
  return text;
}

/** 시·군. 수도권 같은 권역과 「알 수 없는 지역」은 검색어에 넣지 않는다. */
export function narrowCityLabel(location) {
  const addr = String(location?.addr1 || '').trim().split(/\s+/).filter(Boolean);
  const cityToken = addr.find((part) => /(특별시|광역시|시|군)$/.test(part) && !/도$/.test(part));
  if (cityToken) {
    const short = cityToken.replace(/(특별자치시|특별시|광역시|시|군)$/u, '');
    if (usableLabel(short)) return short;
  }
  for (const key of ['city', 'parentCity', 'locality']) {
    const value = usableLabel(location?.[key]);
    if (value) return value;
  }
  return '';
}

/** YouTube 결과 검색어. 자리표시 지명이면 빈 문자열(링크를 만들지 않음). */
export function freeSearchYouTubeQuery(location) {
  const rawName = String(location?.name || '').trim();
  const name = PLACEHOLDER_NAME.test(rawName)
    ? usableLabel(location?.name_en) || usableLabel(location?.region) || usableLabel(location?.country)
    : usableLabel(rawName) || usableLabel(location?.name_en);
  const city = narrowCityLabel(location);
  if (!name && !city) return '';
  if (!city || city.toLowerCase() === String(name).toLowerCase()) return name || city;
  if (!name) return city;
  return `${name} ${city}`;
}

export function freeSearchYouTubeUrl(location) {
  const q = freeSearchYouTubeQuery(location);
  if (!q) return '';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/** 자유 검색 핀도 기존 place_videos 행이 있으면 링크 대신 그 영상을 보여 준다. API는 호출하지 않는다. */
export function shouldShowFreeSearchLink(location, row) {
  if (!isFreeSearchLocation(location)) return false;
  if (
    row
    && Array.isArray(row.videos)
    && row.videos.length > 0
    && !shouldRefreshPlaceVideoCache(row)
  ) {
    return false;
  }
  return true;
}
