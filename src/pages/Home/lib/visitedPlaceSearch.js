/**
 * 방문으로 생긴 place_stats 행을 검색 카드로 쓰기 위한 순수 매칭.
 * DB 조회는 visitedPlaceSearchLookup.js — 이 파일은 supabase를 넣지 않는다.
 */
import { formatUrlName, isUrlSafeEnglishLabel } from './formatUrlName.js';
import { getPlaceStatsId } from '../../../utils/travelSpotResolve.js';

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
  for (const raw of [location.name_en, location.name, location.display_name]) {
    const text = String(raw || '').trim();
    if (isUrlSafeEnglishLabel(text)) return text;
  }
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
  return {
    id: `visited-${placeId || `${lat}-${lng}`}`,
    slug: placeId || undefined,
    kind: 'city',
    badge: '장소',
    name,
    name_en: nameEn || name,
    name_ko: nameKo || (HAS_HANGUL_RE.test(name) ? name : ''),
    country: extras.country || 'Explore',
    country_en: extras.country_en || 'Explore',
    lat,
    lng,
    source: 'visited',
    uiPlace: true,
    desc,
    image_url: row.image_url || '',
  };
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
