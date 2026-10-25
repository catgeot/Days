/**
 * 방문으로 생긴 place_stats 행을 검색 카드로 쓰기 위한 순수 매칭.
 * DB 조회는 visitedPlaceSearchLookup.js — 이 파일은 supabase를 넣지 않는다.
 */
import { formatUrlName, isUrlSafeEnglishLabel } from './formatUrlName.js';
import { getPlaceStatsId, isPlaceholderCountry } from '../../../utils/travelSpotResolve.js';
import {
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubPlaceFromSlug,
} from './cityAttractionHubs.js';
import {
  latinNameIsAdminArea,
  pickLatinPlaceName,
  samePlaceCenter,
} from './uiPlaceAssetQuery.js';
import { resolveLegacyMishealPlace } from './legacyMishealPlaceSlugs.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;
const SKIP_STATS_IDS = new Set(['New Session', 'Scanning...', 'Searching...', '위치 탐색 중...']);

/** 0,0(Null Island)은 지오코딩 실패 기본값 — 방문 카드로 쓰지 않는다 */
export function hasUsableVisitedCoords(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return false;
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return false;
  if (latN === 0 && lngN === 0) return false;
  return Math.abs(latN) <= 90 && Math.abs(lngN) <= 180;
}

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

function isKoreaCountryLabel(country, countryEn) {
  const c = String(country || '').trim();
  const ce = String(countryEn || '').trim().toLowerCase();
  return (
    c === '대한민국' ||
    c === '한국' ||
    ce === 'south korea' ||
    ce === 'korea' ||
    ce === 'republic of korea'
  );
}

/** ROK-ish bbox minus Japan (Tsushima·北九州) and north of DMZ slant for visited infer */
const VISITED_KOREA_LNG_MIN = 124.5;
const VISITED_KOREA_LNG_MAX = 132.2;
const VISITED_KOREA_LAT_MIN = 33.0;
const VISITED_KOREA_LAT_MAX = 38.8;

/** DMZ slants NE — west ~37.77 (개성) to east coast ~38.68 (고성·통일전망대) */
const DMZ_NORTH_WEST = { lng: 126.5, lat: 37.77 };
const DMZ_NORTH_MID = { lng: 127.25, lat: 38.28 };
const DMZ_NORTH_EAST = { lng: 128.55, lat: 38.68 };

/** West of DMZ west anchor — flat 37.77°N cuts ROK Yellow Sea islands; explicit pockets only */
const VISITED_KOREA_INCLUSION_BOXES = [
  { latMin: 37.88, latMax: 38.04, lngMin: 124.55, lngMax: 124.82 },
  { latMin: 37.74, latMax: 37.92, lngMin: 124.58, lngMax: 124.88 },
  { latMin: 37.58, latMax: 37.76, lngMin: 125.58, lngMax: 125.82 },
  { latMin: 37.7, latMax: 37.88, lngMin: 126.15, lngMax: 126.38 },
  { latMin: 37.72, latMax: 37.82, lngMin: 126.08, lngMax: 126.48 },
];

const VISITED_KOREA_EXCLUSION_BOXES = [
  { latMin: 34.05, latMax: 34.55, lngMin: 129.15, lngMax: 130.15 },
  { latMin: 33.0, latMax: 34.55, lngMin: 130.0, lngMax: 131.25 },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Max latitude treated as ROK at this longitude (north of line → DPRK / excluded). */
export function northBoundaryLatForVisitedKorea(lng) {
  if (!Number.isFinite(lng)) return DMZ_NORTH_WEST.lat;
  if (lng <= DMZ_NORTH_WEST.lng) return DMZ_NORTH_WEST.lat;
  if (lng <= DMZ_NORTH_MID.lng) {
    const t = (lng - DMZ_NORTH_WEST.lng) / (DMZ_NORTH_MID.lng - DMZ_NORTH_WEST.lng);
    return lerp(DMZ_NORTH_WEST.lat, DMZ_NORTH_MID.lat, t);
  }
  if (lng <= DMZ_NORTH_EAST.lng) {
    const t = (lng - DMZ_NORTH_MID.lng) / (DMZ_NORTH_EAST.lng - DMZ_NORTH_MID.lng);
    return lerp(DMZ_NORTH_MID.lat, DMZ_NORTH_EAST.lat, t);
  }
  return DMZ_NORTH_EAST.lat;
}

function inVisitedKoreaInclusionBox(lat, lng) {
  return VISITED_KOREA_INCLUSION_BOXES.some(
    (box) =>
      lat >= box.latMin &&
      lat <= box.latMax &&
      lng >= box.lngMin &&
      lng <= box.lngMax,
  );
}

function inVisitedKoreaExclusionBox(lat, lng) {
  return VISITED_KOREA_EXCLUSION_BOXES.some(
    (box) =>
      lat >= box.latMin &&
      lat <= box.latMax &&
      lng >= box.lngMin &&
      lng <= box.lngMax,
  );
}

export function coordsInKorea(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (
    lat < VISITED_KOREA_LAT_MIN ||
    lat > VISITED_KOREA_LAT_MAX ||
    lng < VISITED_KOREA_LNG_MIN ||
    lng > VISITED_KOREA_LNG_MAX
  ) {
    return false;
  }
  if (inVisitedKoreaExclusionBox(lat, lng)) return false;
  if (inVisitedKoreaInclusionBox(lat, lng)) return true;
  if (lat > northBoundaryLatForVisitedKorea(lng)) return false;
  return true;
}

/** Hangul place_stats 행에 country가 없을 때만 — 해외 한글 표기는 대한민국으로 추정하지 않음 */
function shouldInferKoreaCountryForVisited({ nameKo, lat, lng }) {
  const ko = String(nameKo || '').trim();
  if (!ko || !HAS_HANGUL_RE.test(ko)) return false;
  const hub = resolveCityAttractionHub(ko);
  if (hub && isKoreaCountryLabel(hub.country, hub.country_en)) return true;
  const legacy = resolveLegacyMishealPlace(ko);
  if (legacy && isKoreaCountryLabel(legacy.country, legacy.country_en)) return true;
  return coordsInKorea(lat, lng);
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
  if (!hasUsableVisitedCoords(lat, lng)) return null;

  const nameKo = String(row.name_ko || '').trim();
  const nameEn = String(row.name_en || '').trim();
  const placeId = String(row.place_id || '').trim();
  const name = nameKo || nameEn || placeId;
  if (!name) return null;

  const desc = String(extras.desc || '').trim();
  const identity = visitedIdentityForRow(placeId, nameKo, nameEn);
  let latinName = identity.nameEn
    ? pickLatinPlaceNameFromLocation({ name_en: identity.nameEn, name })
    : '';
  if (!latinName) {
    latinName = latinFromVisitedSlug({ slug: identity.slug, place_id: placeId });
  }
  let country = concreteCountry(extras.country, extras.country_en);
  let countryEn = concreteCountry(extras.country_en, extras.country);
  if (!country && shouldInferKoreaCountryForVisited({ nameKo, lat, lng })) {
    country = '대한민국';
    countryEn = countryEn || 'South Korea';
  }
  return {
    id: `visited-${placeId || `${lat}-${lng}`}`,
    slug: identity.slug,
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
    ...(identity.parentCity
      ? { parentCity: identity.parentCity, poiAttraction: true }
      : {}),
  };
}

/**
 * place_stats.place_id가 시군 허브여도 표시명이 그 시군이 아니면 슬러그를 옮기지 않는다.
 * 평창 통계 행은 그대로 두고, 흥정계곡 카드만 한글 이름 슬러그를 쓴다.
 */
function visitedIdentityForRow(placeId, nameKo, nameEn) {
  const id = String(placeId || '').trim();
  const ko = String(nameKo || '').trim();
  const legacy = id ? resolveLegacyMishealPlace(id) : null;
  if (legacy && ko && normalizeVisitedSearchKey(legacy.name) === normalizeVisitedSearchKey(ko)) {
    return {
      slug: placeUrlSlug('', ko),
      nameEn: '',
      parentCity: legacy.parentCity || '',
    };
  }
  if (resolveCityAttractionHub(ko)) {
    return { slug: id || placeUrlSlug(nameEn, ko), nameEn, parentCity: '' };
  }
  const known = id ? resolveHubPlaceFromSlug(id) : null;
  if (known) {
    const knownTokens = [known.name, known.name_en, known.slug].map(normalizeVisitedSearchKey);
    const koToken = normalizeVisitedSearchKey(ko);
    if (koToken && !knownTokens.includes(koToken)) {
      const enIsCounty = knownTokens.includes(normalizeVisitedSearchKey(nameEn));
      return {
        slug: placeUrlSlug(enIsCounty ? '' : nameEn, ko),
        nameEn: enIsCounty ? '' : nameEn,
        parentCity: known.name || '',
      };
    }
  }
  return { slug: id || undefined, nameEn, parentCity: '' };
}

function geoCountriesAlign(visited, geo) {
  const vKo = concreteCountry(visited?.country, '');
  const vEn = concreteCountry(visited?.country_en, visited?.country);
  const gKo = concreteCountry(geo?.country, '');
  const gEn = concreteCountry(geo?.country_en, geo?.country);
  const pairs = [
    [vKo, gKo],
    [vEn, gEn],
    [vEn, gKo],
    [vKo, gEn],
  ];
  for (const [a, b] of pairs) {
    if (!a || !b) continue;
    if (normalizeVisitedSearchKey(a) === normalizeVisitedSearchKey(b)) return true;
  }
  if (!vKo && !vEn) return true;
  if (!gKo && !gEn) return true;
  return false;
}

/** Same pin as geocode admin hit but visitor label is the destination (e.g. 티니안 vs San Jose). */
export function isSamePinKeepVisitorLabel(visited, geo) {
  if (!visited || !geo) return false;
  if (!geoCountriesAlign(visited, geo)) return false;
  if (!samePlaceCenter(visited, geo, 0.3)) return false;
  const visitedToken = normalizeVisitedSearchKey(visited?.name_ko || visited?.name);
  const geoName = normalizeVisitedSearchKey(geo.name);
  if (!visitedToken || !geoName || visitedToken === geoName) return false;
  const ownLatin = pickLatinPlaceName(visited);
  const geoLatin = pickLatinPlaceName(geo);
  if (ownLatin && geoLatin) {
    return normalizeVisitedSearchKey(ownLatin) !== normalizeVisitedSearchKey(geoLatin);
  }
  const kind = String(geo.kind || '').toLowerCase();
  return kind === 'city' || geo.badge === '도시' || Boolean(geoLatin && latinNameIsAdminArea(geoLatin, geo.name));
}

export function latinFromVisitedSlug(visited) {
  const slug = String(visited?.slug || visited?.place_id || '').trim();
  if (!slug || !/^[a-z][a-z0-9-]*$/i.test(slug)) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function geoHitIsForeignAdmin(visited, geo) {
  if (!geo) return false;
  if (resolveCityAttractionHub(visited?.name_ko) || resolveCityAttractionHub(visited?.name)) {
    return false;
  }
  if (isSamePinKeepVisitorLabel(visited, geo)) return false;
  const visitedToken = normalizeVisitedSearchKey(visited?.name_ko || visited?.name);
  const geoName = normalizeVisitedSearchKey(geo.name);
  const geoLatin = pickLatinPlaceName(geo);
  const latin = geoLatin;
  const latinHub = latin ? resolveCityAttractionHub(latin) : null;
  if (latinHub) {
    const known = [latinHub.name, latinHub.name_en, latinHub.hubId].map(normalizeVisitedSearchKey);
    return Boolean(visitedToken) && !known.includes(visitedToken);
  }
  if (!geoName || !visitedToken || geoName === visitedToken) return false;
  const kind = String(geo.kind || '').toLowerCase();
  return kind === 'city' || geo.badge === '도시';
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
  const keepLabel = geo && isSamePinKeepVisitorLabel(visited, geo);
  const rejectAdmin = geoHitIsForeignAdmin(visited, geo);
  const ownLatin = pickLatinPlaceName(visited);
  const ownIsAdmin =
    latinNameIsAdminArea(ownLatin, visited?.parentCity) ||
    (!ownLatin &&
      geo &&
      geoHitIsForeignAdmin(visited, { ...geo, name: ownLatin, name_en: ownLatin }));
  const latin = keepLabel
    ? (ownLatin || latinFromVisitedSlug(visited) || pickLatinPlaceName(geo))
    : rejectAdmin || ownIsAdmin
      ? ''
      : (ownLatin || pickLatinPlaceName(geo));
  const country = concreteCountry(visited.country, geo?.country);
  const countryEn = concreteCountry(visited.country_en, geo?.country_en) ||
    (isUrlSafeEnglishLabel(geo?.country) ? String(geo.country).trim() : '');
  const parentCity = keepLabel
    ? String(visited.parentCity || '').trim()
    : visited.parentCity || (rejectAdmin ? String(geo?.name || '').trim() : '');
  return {
    ...visited,
    ...(latin ? { name_en: latin } : rejectAdmin || ownIsAdmin ? { name_en: '' } : {}),
    ...(parentCity ? { parentCity } : {}),
    country,
    country_en: countryEn,
  };
}

export function overlayGeoFieldsOnVisitedSpots(visitedSpots, geoHits) {
  return (Array.isArray(visitedSpots) ? visitedSpots : []).map((spot) =>
    overlayGeoFieldsOnVisitedSpot(spot, geoHits),
  );
}

function visitedCoordKey(spot) {
  const lat = Number(spot?.lat);
  const lng = Number(spot?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat.toFixed(3)}|${lng.toFixed(3)}`;
}

function visitedNameKey(spot) {
  return normalizeVisitedSearchKey(spot?.name_ko || spot?.name);
}

function isStockSearchImage(url) {
  return /images\.unsplash\.com|images\.pexels\.com/i.test(String(url || ''));
}

/**
 * 같은 한글 이름·같은 좌표의 place_stats 행은 한 장.
 * 한글 place_id를 라틴 지명 슬러그(sang-won-ri)보다 남긴다.
 * @param {object[]} spots
 */
export function collapseDuplicateVisitedSpots(spots) {
  const out = [];
  for (const spot of Array.isArray(spots) ? spots : []) {
    if (!spot) continue;
    const name = visitedNameKey(spot);
    const coord = visitedCoordKey(spot);
    const idx = out.findIndex(
      (row) => name && visitedNameKey(row) === name && coord && visitedCoordKey(row) === coord,
    );
    if (idx < 0) {
      out.push(spot);
      continue;
    }
    out[idx] = preferVisitedSpot(out[idx], spot);
  }
  return out;
}

function preferVisitedSpot(current, next) {
  const name = visitedNameKey(current) || visitedNameKey(next);
  const currentId = normalizeVisitedSearchKey(current?.slug || current?.place_id);
  const nextId = normalizeVisitedSearchKey(next?.slug || next?.place_id);
  const currentNamed = Boolean(name) && currentId === name;
  const nextNamed = Boolean(name) && nextId === name;
  if (currentNamed !== nextNamed) return currentNamed ? current : next;
  const currentStock = isStockSearchImage(current?.image_url || current?.imageUrl);
  const nextStock = isStockSearchImage(next?.image_url || next?.imageUrl);
  if (currentStock !== nextStock) return currentStock ? next : current;
  return current;
}

export function buildPlaceStatsIdentityPayload(location) {
  if (!location || typeof location !== 'object') return null;
  const placeId = getPlaceStatsId(location);
  if (!placeId || SKIP_STATS_IDS.has(placeId)) return null;

  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!hasUsableVisitedCoords(lat, lng)) return null;

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
