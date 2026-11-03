/**
 * 탐색창 「제주 우도」「홍성 고산사」 — 앞 토큰=한국 허브·여행지, 뒤=실제 장소명.
 * Mapbox·TourAPI는 placeQuery + KR proximity만 쓰고, 해외 부분일치(Udomlya 등)는 거른다.
 */
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import { haversineKm } from './searchHomonymRegion.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

/** @param {string} country */
function isKoreaCountry(country) {
  const c = String(country || '').trim().toLowerCase();
  return c === '대한민국' || c === '한국' || c === 'south korea' || c === 'korea';
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
 * @param {string} query
 */
export function effectiveExploreSearchQuery(query) {
  const regional = parseKoreaRegionalExploreQuery(query);
  return regional?.placeQuery || String(query || '').trim();
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
  const maxKm = opts.maxKm ?? 160;
  const { lat: alat, lng: alng } = regional.anchor;
  return list.filter((item) => {
    const lat = Number(item?.lat);
    const lng = Number(item?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    const country = String(item?.country_en || item?.country || '').trim();
    if (country && !isKoreaCountry(country)) return false;
    return haversineKm(alat, alng, lat, lng) <= maxKm;
  });
}
