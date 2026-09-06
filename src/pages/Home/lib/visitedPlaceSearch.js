/**
 * 방문으로 생긴 place_stats 행을 검색 카드로 쓰기 위한 순수 매칭.
 * DB 조회는 visitedPlaceSearchLookup.js — 이 파일은 supabase를 넣지 않는다.
 */
import { formatUrlName, isUrlSafeEnglishLabel } from './formatUrlName.js';
import { getPlaceStatsId, isPlaceholderCountry } from '../../../utils/travelSpotResolve.js';
import { pickLatinPlaceName, samePlaceCenter } from './uiPlaceAssetQuery.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;
const SKIP_STATS_IDS = new Set(['New Session', 'Scanning...', 'Searching...', '위치 탐색 중...']);

export function normalizeVisitedSearchKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function isSafeVisitedSearchQuery(query) {
  const q = String(query || '').trim();
  if (q.length < 2 || q.length > 80) return false;
  if (/[,()]/.test(q)) return false;
  return true;
}

function pickHangulPlaceName(location) {
  if (!location || typeof location !== 'object') return '';
  for (const raw of [location.name_ko, location.name, location.originalQuery, location.display_name]) {
    const text = String(raw || '').trim();
    if (HAS_HANGUL_RE.test(text)) return text;
  }
  return '';
}

function pickLatinPlaceNameFromLocation(location) {
  if (!location || typeof location !== 'object') return '';
  const fromHelper = pickLatinPlaceName(location);
  if (fromHelper) return fromHelper;
  for (const raw of [location.name_en, location.name, location.display_name]) {
    const text = String(raw || '').trim();
    if (isUrlSafeEnglishLabel(text)) return text;
  }
  return '';
}

function concreteCountry(primary, fallback) {
  if (!isPlaceholderCountry(primary)) return String(primary || '').trim();
  if (!isPlaceholderCountry(fallback)) return String(fallback || '').trim();
  return '';
}

export function rowMatchesVisitedSearchQuery(row, query) {
  const q = normalizeVisitedSearchKey(query);
  if (q.length < 2) return false;
  const slug = normalizeVisitedSearchKey(formatUrlName(query));
  const keys = [row?.place_id, row?.name_ko, row?.name_en]
    .map((value) => normalizeVisitedSearchKey(value))
    .filter((key) => key.length >= 2);
  return keys.some((key) => key === q || (slug && key === slug));
}

export function visitedRowToSearchSpot(row, extras = {}) {
  if (!row || typeof row !== 'object') return null;
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameKo = String(row.name_ko || '').trim();
  const nameEn = String(row.name_en || '').trim();
  const placeId = String(row.place_id || '').trim();
  const name = nameKo || nameEn || placeId;
  if (!name) return null;

  const desc = String(extras.desc || '').trim();
  const latinName = pickLatinPlaceNameFromLocation({ name_en: nameEn, name });
  const country = concreteCountry(extras.country, extras.country_en);
  const countryEn = concreteCountry(extras.country_en, extras.country);
  return {
    id: `visited-${placeId || `${lat}-${lng}`}`,
    slug: placeId || undefined,
    kind: 'city',
    badge: '장소',
    name,
    name_en: latinName,
    name_ko: nameKo || (HAS_HANGUL_RE.test(name) ? name : ''),
    country,
    country_en: countryEn,
    lat,
    lng,
    source: 'visited',
    uiPlace: true,
    desc,
    image_url: row.image_url || '',
  };
}

export function visitedSpotNeedsGeoCountry(spot) {
  if (!spot) return false;
  return (
    isPlaceholderCountry(spot.country) ||
    isPlaceholderCountry(spot.country_en) ||
    !pickLatinPlaceName(spot)
  );
}

function geoHitMatchesVisited(visited, hit) {
  if (!visited || !hit) return false;
  if (samePlaceCenter(visited, hit, 0.5)) return true;
  const nameKey = normalizeVisitedSearchKey(visited.name);
  const latinKey = normalizeVisitedSearchKey(pickLatinPlaceName(visited));
  const hitName = normalizeVisitedSearchKey(hit.name);
  const hitLatin = normalizeVisitedSearchKey(pickLatinPlaceName(hit));
  const sameName =
    (nameKey && (hitName === nameKey || hitLatin === nameKey)) ||
    (latinKey && (hitLatin === latinKey || hitName === latinKey));
  if (!sameName) return false;
  const vLat = Number(visited.lat);
  const vLng = Number(visited.lng);
  const hLat = Number(hit.lat);
  const hLng = Number(hit.lng);
  if (![vLat, vLng, hLat, hLng].every(Number.isFinite)) return true;
  return samePlaceCenter(visited, hit, 1.5);
}

export function overlayGeoFieldsOnVisitedSpot(visited, geoHits) {
  if (!visited) return visited;
  const list = Array.isArray(geoHits) ? geoHits : [];
  const geo = list.find((hit) => geoHitMatchesVisited(visited, hit));
  const latin = pickLatinPlaceName(visited) || pickLatinPlaceName(geo);
  const country = concreteCountry(visited.country, geo?.country);
  const countryEn = concreteCountry(visited.country_en, geo?.country_en) ||
    (isUrlSafeEnglishLabel(geo?.country) ? String(geo.country).trim() : '');
  return {
    ...visited,
    ...(latin ? { name_en: latin } : {}),
    country,
    country_en: countryEn,
  };
}

export function overlayGeoFieldsOnVisitedSpots(visitedSpots, geoHits) {
  return (Array.isArray(visitedSpots) ? visitedSpots : []).map((spot) =>
    overlayGeoFieldsOnVisitedSpot(spot, geoHits),
  );
}

export function buildPlaceStatsIdentityPayload(location) {
  if (!location || typeof location !== 'object') return null;
  const placeId = getPlaceStatsId(location);
  if (!placeId || SKIP_STATS_IDS.has(placeId)) return null;

  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const nameKo = pickHangulPlaceName(location);
  const nameEn = pickLatinPlaceNameFromLocation(location);
  if (!nameKo && !nameEn) return null;

  const payload = {
    place_id: placeId,
    lat,
    lng,
    source: 'visit',
  };
  if (nameKo) payload.name_ko = nameKo;
  if (nameEn) payload.name_en = nameEn;
  return payload;
}

export function buildVisitedLookupTokens(query) {
  const q = String(query || '').trim();
  if (!isSafeVisitedSearchQuery(q)) return [];
  const tokens = [q];
  const compact = q.replace(/\s+/g, '');
  if (compact && compact !== q) tokens.push(compact);
  const slug = formatUrlName(q);
  if (slug) tokens.push(slug);
  return [...new Set(tokens)];
}
