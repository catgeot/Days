import { resolveCityAttractionHub } from '../../pages/Home/lib/cityAttractionHubs.js';
import { extractTourAttractionSigungu } from '../../pages/Home/lib/koreaTourAttractionLocality.js';
import { resolveKoreaAreaFromCoords } from '../../pages/Korea/resolveKoreaAreaFromCoords.js';
import { detectSidoFromAddr } from '../../pages/Korea/koreaAreaFilter.js';
import { hubIdsForArea } from '../../pages/Korea/koreaHubSeeds.js';
import {
  getPlaceStableKey,
  mergeCanonicalTravelSpot,
  resolveTravelSpotFromCoords,
  resolveTravelSpotFromLocation,
  resolveTravelSpotFromSearchQuery,
} from '../../utils/travelSpotResolve.js';
import { restaurantMapSearchRegionLabel, isExploreRestaurantItem } from '../search/tourRestaurantDetect.js';
import { distanceKm } from '../../utils/rentalAirportMatch.js';

function maxCoordKmForTier(tier) {
  const t = Number(tier) || 3;
  if (t <= 1) return 12;
  if (t === 2) return 22;
  return 45;
}

function hubToToolkitSpot(hub) {
  if (!hub?.hubId) return null;
  const hit = resolveTravelSpotFromLocation({ slug: hub.hubId, hubId: hub.hubId });
  if (hit?.spot) return hit.spot;
  const lat = Number(hub.lat);
  const lng = Number(hub.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    slug: hub.hubId,
    name: hub.name,
    name_en: hub.name_en || hub.name,
    lat,
    lng,
    country: hub.country || '대한민국',
    country_en: hub.country_en || 'South Korea',
    hubId: hub.hubId,
    tier: 2,
  };
}

function spotFromHubQuery(query) {
  const hub = resolveCityAttractionHub(query);
  return hubToToolkitSpot(hub);
}

const METRO_SIDO_CODES = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

function spotFromKoreanAddress(addr1, addr2) {
  const addr = String(addr1 || '');
  const sido = detectSidoFromAddr(addr);
  if (!sido) return null;

  if (METRO_SIDO_CODES.has(String(sido))) {
    const primary = hubIdsForArea(sido)[0];
    const metro = spotFromHubQuery(primary);
    if (metro) return metro;
  }

  const sigungu = extractTourAttractionSigungu(addr1, addr2);
  if (sigungu) {
    const fromSigungu = spotFromHubQuery(sigungu);
    if (fromSigungu) return fromSigungu;
    const sigunguCore = String(sigungu).replace(/(시|군|구)$/u, '').trim();
    if (sigunguCore && sigunguCore !== sigungu) {
      const fromCore = spotFromHubQuery(sigunguCore);
      if (fromCore) return fromCore;
    }
  }

  const primary = hubIdsForArea(sido)[0];
  return spotFromHubQuery(primary);
}

function spotFromOfficialQuery(query) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) return null;
  const spot = resolveTravelSpotFromSearchQuery(trimmed);
  return spot || null;
}

function spotFromCoordsTight(lat, lng) {
  const spot = resolveTravelSpotFromCoords(lat, lng);
  if (!spot) return null;
  const tier = Number(spot.tier) || 3;
  if (tier > 2) return null;
  const d = distanceKm(lat, lng, spot.lat, spot.lng);
  if (!Number.isFinite(d) || d > maxCoordKmForTier(tier)) return null;
  return spot;
}

/**
 * @param {object | null | undefined} location
 * @returns {{ spot: object, matchKind: string, hub?: object } | null}
 */
export function resolveRestaurantPlannerCity(location) {
  if (!isExploreRestaurantItem(location)) return null;

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  const hubId = String(location.hubId || '').trim();
  if (hubId) {
    const spot = spotFromHubQuery(hubId);
    if (spot) return { spot, matchKind: 'hubId' };
  }

  const parentCity = String(location.parentCity || '').trim();
  if (parentCity) {
    const fromHub = spotFromHubQuery(parentCity);
    if (fromHub) return { spot: fromHub, matchKind: 'parentCityHub', hub: resolveCityAttractionHub(parentCity) };
    const fromQuery = spotFromOfficialQuery(parentCity);
    if (fromQuery) return { spot: fromQuery, matchKind: 'parentCityOfficial' };
  }

  const fromKoreanAddr = spotFromKoreanAddress(location.addr1, location.addr2);
  if (fromKoreanAddr) return { spot: fromKoreanAddr, matchKind: 'koreanAddrHub' };

  const regionLabel = restaurantMapSearchRegionLabel(location, 'ko');
  if (regionLabel && regionLabel !== parentCity && !/(?:구|군)$/u.test(regionLabel)) {
    const fromHub = spotFromHubQuery(regionLabel);
    if (fromHub) return { spot: fromHub, matchKind: 'regionHub' };
    const fromQuery = spotFromOfficialQuery(regionLabel);
    if (fromQuery) return { spot: fromQuery, matchKind: 'regionOfficial' };
  }

  const formatted = String(location.place_formatted || '').trim();
  if (formatted) {
    const head = formatted.split(',')[0]?.trim();
    if (head) {
      const fromQuery = spotFromOfficialQuery(head);
      if (fromQuery) return { spot: fromQuery, matchKind: 'placeFormatted' };
    }
    const tokyoToken = formatted
      .split(',')
      .map((s) => s.trim())
      .find((s) => /^tokyo$/i.test(s) || s === '도쿄');
    if (tokyoToken) {
      const fromQuery = spotFromOfficialQuery(tokyoToken);
      if (fromQuery) return { spot: fromQuery, matchKind: 'placeFormattedTokyo' };
    }
  }

  if (Number.isFinite(lat) && Number.isFinite(lng) && !String(location.addr1 || '').trim()) {
    const korea = resolveKoreaAreaFromCoords(lat, lng);
    if (korea?.hubId) {
      const fromKorea = spotFromHubQuery(korea.hubId);
      if (fromKorea) return { spot: fromKorea, matchKind: 'koreaCoordsHub' };
    }
    const fromCoords = spotFromCoordsTight(lat, lng);
    if (fromCoords) return { spot: fromCoords, matchKind: 'coordsTier12' };
  }

  return null;
}

/** DB·Edge 툴킷 조회/생성에 쓸 도시 travelSpot 행 (식당이면 호스트 도시, 아니면 원본) */
export function getPlannerToolkitLocation(location) {
  const base = mergeCanonicalTravelSpot(location);
  const host = resolveRestaurantPlannerCity(base);
  if (host?.spot) {
    return mergeCanonicalTravelSpot(host.spot);
  }
  return base;
}

export function isRestaurantPlannerHostLocation(location) {
  if (!isExploreRestaurantItem(location)) return false;
  return resolveRestaurantPlannerCity(location) != null;
}

/**
 * @param {object | null | undefined} location
 * @param {'ko' | 'en' | string} [locale]
 */
export function getRestaurantPlannerCityLabel(location, locale = 'ko') {
  const host = resolveRestaurantPlannerCity(location);
  if (!host?.spot) return '';
  const en = locale === 'en' || String(locale).startsWith('en');
  return (
    (en ? host.spot.name_en || host.spot.name : host.spot.name || host.spot.name_en) ||
  String(host.hub?.name || '').trim() ||
    getPlaceStableKey(host.spot) ||
    ''
  );
}

/**
 * update-place-toolkit 요청 body용 (식당 → 도시 place_id)
 * @param {object | null | undefined} location
 * @param {'ko' | 'en' | string} [locale]
 */
export function buildPlannerToolkitInvokeBody(location, locale = 'ko') {
  const canonicalLoc = getPlannerToolkitLocation(location);
  const slug = getPlaceStableKey(canonicalLoc) || canonicalLoc?.slug;
  const en = locale === 'en' || String(locale).startsWith('en');
  const locationName =
    (en ? canonicalLoc?.name_en || canonicalLoc?.name : canonicalLoc?.name || canonicalLoc?.name_en) ||
    canonicalLoc?.name ||
    '';
  return {
    placeId: slug,
    canonicalPlaceId: slug,
    locationName,
    lat: canonicalLoc?.lat,
    lng: canonicalLoc?.lng,
    country: canonicalLoc?.country,
    slug,
    locale,
  };
}
