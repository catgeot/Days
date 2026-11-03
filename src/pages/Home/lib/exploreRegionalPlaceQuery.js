/**
 * 탐색창 「제주 우도」「홍성 고산사」 — 앞 토큰=한국 허브·여행지, 뒤=실제 장소명.
 * Mapbox·TourAPI는 placeQuery + KR proximity만 쓰고, 해외·부분일치(가우도↔우도)는 거른다.
 */
import { resolveCityAttractionHub, resolveHubAttraction } from './cityAttractionHubs.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import { resolveExploreSearchAlias } from './exploreSearchAliases.js';
import { KO_EXPLORE_BARE_PLACE_SCOPES, normalizePlaceMatchKey } from './koreaPlaceMatchDictionary.js';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import { haversineKm } from './searchHomonymRegion.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

const BARE_PLACE_SCOPE_MAP = new Map(
  KO_EXPLORE_BARE_PLACE_SCOPES.map(([key, value]) => [normalizePlaceMatchKey(key), value]),
);

const GENERIC_TAIL_RE =
  /^(?:커피|맛집|카페|술|펍|바|호텔|숙소|맥주|와인|치킨|피자|버거|국수|밥|면|식당|레스토랑|브런치|디저트|베이커리|빵|산책|드라이브|캠핑|글램핑|수영|골프|스키|서핑|갈만한|핫플|추천|근처|주변|코스)$/u;

/** @param {string} country */
function isKoreaCountry(country) {
  const c = String(country || '').trim().toLowerCase();
  return c === '대한민국' || c === '한국' || c === 'south korea' || c === 'korea';
}

function compactToken(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '');
}

function itemAddressText(item) {
  return [item?.addr1, item?.address, item?.place_formatted, item?.desc, item?.parentCity, item?.region]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' ');
}

function addrMatchesHubHints(item, hubHints) {
  const addr = itemAddressText(item);
  if (!addr || !Array.isArray(hubHints) || !hubHints.length) return false;
  return hubHints.some((hint) => {
    const h = String(hint || '').trim();
    return h.length >= 2 && addr.includes(h);
  });
}

/** @param {string} placeQuery @param {object | null | undefined} regionHub @param {object | null | undefined} regionSpot */
function isRegionalPlaceTail(placeQuery, regionHub, regionSpot) {
  const tail = String(placeQuery || '').trim();
  if (tail.length < 2) return false;
  if (GENERIC_TAIL_RE.test(tail)) return false;

  if (resolveExploreSearchAlias(tail)?.canonical) return true;
  if (resolveHubAttraction(tail)) return true;

  const tailHub = resolveExploreCityHubExact(tail);
  const tailSpot = resolveTravelSpotFromSearchQuery(tail);
  if (tailHub && !isKoreaCountry(tailHub.country)) return false;
  if (tailSpot && !isKoreaCountry(tailSpot.country)) return false;

  if (!HAS_HANGUL_RE.test(tail)) return false;
  return tail.length >= 2 && tail.length <= 12;
}

/** @returns {'exact' | 'partial' | 'none'} */
function nameMatchKind(item, placeQuery) {
  const pq = compactToken(placeQuery);
  if (!pq) return 'none';
  const names = [item?.name, item?.name_ko, item?.name_en]
    .map(compactToken)
    .filter(Boolean);
  if (names.some((n) => n === pq)) return 'exact';
  if (names.some((n) => n.includes(pq) && n !== pq)) return 'partial';
  return 'none';
}

/**
 * @param {string} query
 * @returns {object | null}
 */
export function parseKoreaRegionalExploreQuery(query) {
  const raw = String(query || '').trim();
  if (!raw || !HAS_HANGUL_RE.test(raw)) return null;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  for (let splitAt = 1; splitAt < parts.length; splitAt += 1) {
    const regionQuery = parts.slice(0, splitAt).join(' ');
    const placeQuery = parts.slice(splitAt).join(' ');
    if (placeQuery.length < 2) continue;

    const hub = resolveExploreCityHubExact(regionQuery) || resolveCityAttractionHub(regionQuery);
    const spot = resolveTravelSpotFromSearchQuery(regionQuery);
    if (!hub && !spot) continue;
    if (hub && !isKoreaCountry(hub.country)) continue;
    if (spot && !isKoreaCountry(spot.country)) continue;
    if (!isRegionalPlaceTail(placeQuery, hub, spot)) continue;

    const lat = Number(hub?.lat ?? spot?.lat);
    const lng = Number(hub?.lng ?? spot?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const hubHints = [
      hub?.name,
      regionQuery,
      ...(hub?.aliases || []),
      spot?.name,
    ]
      .map((s) => String(s || '').trim())
      .filter((s) => s.length >= 2);

    return {
      originalQuery: raw,
      regionQuery,
      placeQuery,
      hub,
      hubHints: [...new Set(hubHints)],
      proximity: [lng, lat],
      anchor: { lat, lng },
    };
  }
  return null;
}

/**
 * 단독 「우do」「닭머르」 — SSOT bare scope + 허브 anchor (regional과 동일 필터).
 * @param {string} query
 * @returns {object | null}
 */
export function parseBareKoreaExploreScope(query) {
  const raw = String(query || '').trim();
  if (!raw || /\s/.test(raw) || !HAS_HANGUL_RE.test(raw)) return null;

  const scopeRow = BARE_PLACE_SCOPE_MAP.get(normalizePlaceMatchKey(raw));
  if (!scopeRow?.hubId) return null;

  const hub =
    resolveCityAttractionHub(scopeRow.hubId) ||
    resolveExploreCityHubExact(scopeRow.regionQuery);
  if (!hub || !isKoreaCountry(hub.country)) return null;

  const lat = Number(hub.lat);
  const lng = Number(hub.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const placeQuery = String(scopeRow.placeQuery || raw).trim();
  const regionQuery = String(scopeRow.regionQuery || hub.name || '').trim();
  const hubHints = [hub.name, regionQuery, ...(hub.aliases || []), placeQuery]
    .map((s) => String(s || '').trim())
    .filter((s) => s.length >= 2);

  return {
    originalQuery: raw,
    regionQuery,
    placeQuery,
    hub,
    hubHints: [...new Set(hubHints)],
    proximity: [lng, lat],
    anchor: { lat, lng },
    bareScope: true,
  };
}

/**
 * @param {string} query
 * @returns {object | null}
 */
export function parseExploreSearchScope(query) {
  return parseKoreaRegionalExploreQuery(query) || parseBareKoreaExploreScope(query);
}

/**
 * @param {string} query
 */
export function effectiveExploreSearchQuery(query) {
  const scope = parseExploreSearchScope(query);
  return scope?.placeQuery || String(query || '').trim();
}

/** @param {object | null | undefined} regional */
export function regionalExploreMapboxOpts(regional) {
  if (!regional?.proximity) return {};
  return {
    country: 'kr',
    proximity: regional.proximity,
  };
}

/**
 * @param {object | null | undefined} regional
 * @param {object[]} hits
 * @param {{ maxKm?: number }} [opts]
 */
export function filterRegionalExploreHits(regional, hits, opts = {}) {
  const list = Array.isArray(hits) ? hits : [];
  if (!regional?.anchor) return list;
  const maxKm = opts.maxKm ?? 80;
  const tightKm = Math.min(maxKm, 45);
  const { lat: alat, lng: alng } = regional.anchor;
  const placeQuery = regional.placeQuery;

  const kept = list.filter((item) => {
    const lat = Number(item?.lat);
    const lng = Number(item?.lng);
    const country = String(item?.country_en || item?.country || '').trim();
    if (country && !isKoreaCountry(country)) return false;

    const match = nameMatchKind(item, placeQuery);
    if (match === 'partial') {
      return addrMatchesHubHints(item, regional.hubHints);
    }
    if (match === 'none' && !addrMatchesHubHints(item, regional.hubHints)) {
      return false;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return match === 'exact';
    const dist = haversineKm(alat, alng, lat, lng);
    if (match === 'exact') return dist <= maxKm;
    if (addrMatchesHubHints(item, regional.hubHints)) return dist <= maxKm;
    return dist <= tightKm;
  });

  return kept.sort((a, b) => {
    const rank = (item) => {
      const match = nameMatchKind(item, placeQuery);
      if (match === 'exact') return 0;
      if (addrMatchesHubHints(item, regional.hubHints)) return 1;
      return 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    const da = haversineKm(alat, alng, Number(a.lat), Number(a.lng));
    const db = haversineKm(alat, alng, Number(b.lat), Number(b.lng));
    return da - db;
  });
}

/**
 * 「제주 우도」 등 권역 쿼리 — Mapbox·방문 DB parentCity(서울) 오염을 허브·regionQuery로 덮는다.
 * @param {object | null | undefined} regional
 * @param {object[]} hits
 */
export function applyRegionalHubLabels(regional, hits) {
  const list = Array.isArray(hits) ? hits : [];
  if (!regional || !list.length) return list;
  const hubId = String(regional.hub?.hubId || '').trim();
  const parentCity =
    String(regional.regionQuery || regional.hub?.name || '').trim() || undefined;
  if (!hubId && !parentCity) return list;
  return list.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const next = { ...item };
    if (hubId) next.hubId = hubId;
    if (parentCity) next.parentCity = parentCity;
    if (hubId || parentCity) {
      next.country = next.country || '대한민국';
      next.country_en = next.country_en || 'South Korea';
    }
    return next;
  });
}
