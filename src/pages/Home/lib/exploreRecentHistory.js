import { TRAVEL_SPOTS } from '../data/travelSpots';
import { citiesData } from '../data/citiesData';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve';
import {
  detachCountySlugFromCatalog,
  isDomesticExploreUiPoiPinForRouting,
  pinNameOwnsPlace,
  uiPlacePoiCollidesWithCatalogParam,
} from './explorePlaceSlugGuard.js';
import { resolveExploreAliasDirectPlaceSlug } from './koreaPlaceMatchDictionary.js';
import { resolveHubPlaceFromSlug } from './cityAttractionHubs';
import { getPlaceUrlParam, isEphemeralSlug, resolveCatalogPlaceSlug } from './formatUrlName';
import { resolveSettlementPlaceFromSlug } from './mapboxSettlementPlaces';
import {
  isMapboxOrGeocodeSource,
  shouldRouteDomesticExplorePinToPlace,
  isBlockedCountryOnlyPlaceParam,
  normalizeExploreSelectionPin,
  resolveDomesticMapboxAdminHub,
  resolveDomesticProvinceNameHub,
} from './explorePlaceNav.js';
import { isKoreaProvinceLevelTourResult, isKoreaProvinceLevelName } from './koreaExploreProvincePlace.js';

export const RECENT_SEARCH_KEY = 'gateo_recent_search_keywords';
export const RECENT_VISITED_KEY = 'gateo_recent_visited_destinations';
export const RECENT_KEYWORD_VISITS_KEY = 'gateo_recent_keyword_visits';
export const MAX_RECENT_ITEMS = 30;

export function destinationLabel(item) {
  if (typeof item === 'string') return item.trim();
  return String(item?.name || '').trim();
}

/** compact 방문지 ref — localStorage용 */
export function toDestinationRef(loc) {
  if (!loc || typeof loc !== 'object') return null;
  const name = String(loc.name || '').trim();
  if (!name) return null;
  const ref = { name };
  const slug = typeof loc.slug === 'string' ? loc.slug.trim() : '';
  if (slug) ref.slug = slug;
  const nameEn = typeof loc.name_en === 'string' ? loc.name_en.trim() : '';
  if (nameEn) ref.name_en = nameEn;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    ref.lat = lat;
    ref.lng = lng;
  }
  const country = typeof loc.country === 'string' ? loc.country.trim() : '';
  if (country) ref.country = country;
  const countryEn = typeof loc.country_en === 'string' ? loc.country_en.trim() : '';
  if (countryEn) ref.country_en = countryEn;
  if (loc.uiPlace) ref.uiPlace = true;
  if (loc.id != null && loc.id !== '') ref.id = loc.id;
  return ref;
}

export function sameDestination(a, b) {
  const la = destinationLabel(a).toLowerCase();
  const lb = destinationLabel(b).toLowerCase();
  return Boolean(la && lb && la === lb);
}

function normalizeDestinationItem(item) {
  if (typeof item === 'string') {
    const name = item.trim();
    return name || null;
  }
  return toDestinationRef(item);
}

export function safeLoadRecentList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string' && item.trim() !== '')
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return [];
  const nextItems = [
    trimmed,
    ...safeLoadRecentList(RECENT_SEARCH_KEY).filter((item) => item !== trimmed),
  ].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export function removeRecentSearch(value) {
  const nextItems = safeLoadRecentList(RECENT_SEARCH_KEY).filter((item) => item !== value);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export function clearRecentSearches() {
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify([]));
  return [];
}

export function safeLoadRecentVisited() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_VISITED_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDestinationItem).filter(Boolean).slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function pushRecentVisited(locOrName) {
  const ref =
    typeof locOrName === 'string'
      ? normalizeDestinationItem(locOrName)
      : toDestinationRef(locOrName) || normalizeDestinationItem(locOrName?.name);
  if (!ref) return safeLoadRecentVisited();

  const nextItems = [
    ref,
    ...safeLoadRecentVisited().filter((item) => !sameDestination(item, ref)),
  ].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_VISITED_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export function removeRecentVisited(destination) {
  const nextItems = safeLoadRecentVisited().filter((item) => !sameDestination(item, destination));
  localStorage.setItem(RECENT_VISITED_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export function clearRecentVisited() {
  localStorage.setItem(RECENT_VISITED_KEY, JSON.stringify([]));
  return [];
}

export function safeLoadKeywordVisits() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEYWORD_VISITS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item && typeof item.keyword === 'string' && Array.isArray(item.destinations)
      )
      .map((entry) => ({
        ...entry,
        keyword: entry.keyword.trim(),
        destinations: (entry.destinations || []).map(normalizeDestinationItem).filter(Boolean),
      }))
      .filter((entry) => entry.keyword && entry.destinations.length > 0)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function pushKeywordVisit(keyword, locOrName) {
  const normalizedKeyword = (keyword || '').trim();
  const ref =
    typeof locOrName === 'string'
      ? normalizeDestinationItem(locOrName)
      : toDestinationRef(locOrName) || normalizeDestinationItem(locOrName?.name);
  if (!normalizedKeyword || !ref) return safeLoadKeywordVisits();

  const keywordVisits = safeLoadKeywordVisits();
  const matched = keywordVisits.find((entry) => entry.keyword === normalizedKeyword);
  let nextKeywordVisits;

  if (matched) {
    const updatedDestinations = [
      ref,
      ...(matched.destinations || []).filter((dest) => !sameDestination(dest, ref)),
    ].slice(0, 5);
    nextKeywordVisits = [
      { ...matched, destinations: updatedDestinations, updatedAt: Date.now() },
      ...keywordVisits.filter((entry) => entry.keyword !== normalizedKeyword),
    ];
  } else {
    nextKeywordVisits = [
      { keyword: normalizedKeyword, destinations: [ref], updatedAt: Date.now() },
      ...keywordVisits,
    ];
  }

  const sliced = nextKeywordVisits.slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_KEYWORD_VISITS_KEY, JSON.stringify(sliced));
  return sliced;
}

export function removeKeywordVisit(keyword, destination = null) {
  const nextHistory = safeLoadKeywordVisits()
    .map((entry) => {
      if (entry.keyword !== keyword) return entry;
      if (!destination) return null;
      const nextDestinations = (entry.destinations || []).filter(
        (item) => !sameDestination(item, destination)
      );
      if (nextDestinations.length === 0) return null;
      return { ...entry, destinations: nextDestinations };
    })
    .filter(Boolean)
    .slice(0, MAX_RECENT_ITEMS);

  localStorage.setItem(RECENT_KEYWORD_VISITS_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function clearKeywordVisits() {
  localStorage.setItem(RECENT_KEYWORD_VISITS_KEY, JSON.stringify([]));
  return [];
}

function normalizePlaceToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function knownPlaceForParam(param) {
  const hub = resolveHubPlaceFromSlug(param);
  if (hub) return hub;
  const catalog = resolveCatalogPlaceSlug(param);
  if (catalog) {
    return TRAVEL_SPOTS.find((spot) => String(spot.slug).toLowerCase() === catalog) || null;
  }
  return (
    (citiesData || []).find(
      (row) => String(row?.slug || '').toLowerCase() === String(param || '').toLowerCase(),
    ) || null
  );
}

function isMapboxOrGeocodePin(spot) {
  const id = String(spot?.id ?? '').trim().toLowerCase();
  if (id.startsWith('mapbox-') || id.startsWith('geocode-')) return true;
  return isMapboxOrGeocodeSource(spot?.source);
}

/** 새로고침·공유가 홈으로 튕기지 않는 slug. 이름 kebab(hallstatt)는 제외. */
function knownPlaceSlug(param) {
  const catalog = resolveCatalogPlaceSlug(param);
  if (catalog) return catalog;
  const normalized = String(param ?? '').trim().toLowerCase();
  if (!normalized || isEphemeralSlug(normalized)) return null;
  const hub = resolveHubPlaceFromSlug(normalized);
  if (hub?.slug && !isEphemeralSlug(String(hub.slug))) return String(hub.slug);
  const settlement = resolveSettlementPlaceFromSlug(normalized);
  if (settlement?.slug && !isEphemeralSlug(String(settlement.slug))) return String(settlement.slug);
  const city = (citiesData || []).find((row) => String(row?.slug || '').toLowerCase() === normalized);
  return city?.slug ? String(city.slug) : null;
}

/**
 * 홈·탐색 검색 결과 탭.
 * `/place`는 SSOT slug만 (카탈로그·허브·정착지·도시).
 * mapbox-/geocode- 는 search- 핀과 같이 홈 써머리 — 이름 slug가 카탈로그와 겹쳐도.
 * @param {object | null | undefined} spot
 * @returns {{ type: 'place', spot: object, param: string } | { type: 'home', spot: object } | null}
 */
export function resolveSearchResultSelect(spot) {
  if (!spot || typeof spot !== 'object') return null;
  const lat = Number(spot.lat);
  const lng = Number(spot.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const pin = normalizeExploreSelectionPin({ ...spot, lat, lng });
  const source = String(pin.source ?? '').trim().toLowerCase();
  if (isKoreaProvinceLevelTourResult(pin)) {
    return { type: 'home', spot: pin };
  }

  const adminHub = resolveDomesticMapboxAdminHub(pin);
  if (
    adminHub?.hubId &&
    (shouldRouteDomesticExplorePinToPlace(pin) ||
      isKoreaProvinceLevelName(String(pin.name || pin.name_ko || '').trim()))
  ) {
    const hubSlug = String(adminHub.hubId).trim();
    if (hubSlug && !isBlockedCountryOnlyPlaceParam(hubSlug)) {
      const hubPin = normalizeExploreSelectionPin({
        ...pin,
        hubId: hubSlug,
        slug: hubSlug,
        canonical_slug: hubSlug,
      });
      return { type: 'place', spot: hubPin, param: hubSlug };
    }
  }

  const tourParam = getPlaceUrlParam(pin);
  if (source === 'tourapi' && tourParam && !isBlockedCountryOnlyPlaceParam(tourParam)) {
    return { type: 'place', spot: pin, param: tourParam };
  }

  const routeDomesticPoi = shouldRouteDomesticExplorePinToPlace(pin);
  const catalogSlugCollision = uiPlacePoiCollidesWithCatalogParam(pin, tourParam);

  if (routeDomesticPoi && !catalogSlugCollision) {
    const domesticParam = getPlaceUrlParam(pin);
    if (domesticParam && !isBlockedCountryOnlyPlaceParam(domesticParam)) {
      return { type: 'place', spot: pin, param: domesticParam };
    }
  }

  const rawParam = tourParam;
  const param = knownPlaceSlug(rawParam);
  const known = param ? knownPlaceForParam(param) : null;
  const countyMismatch = Boolean(known) && !pinNameOwnsPlace(pin, known);
  const spotForOpen = countyMismatch ? detachCountySlugFromCatalog(pin, known) : pin;
  if ((isMapboxOrGeocodePin(pin) || countyMismatch) && (!routeDomesticPoi || catalogSlugCollision)) {
    const foreignParam = rawParam;
    const explicitCatalogSlug = resolveCatalogPlaceSlug(
      String(pin.slug || pin.canonical_slug || '').trim(),
    );
    if (explicitCatalogSlug && !catalogSlugCollision) {
      return { type: 'home', spot: spotForOpen };
    }
    if (foreignParam?.startsWith('search-')) {
      if (routeDomesticPoi || catalogSlugCollision) {
        return { type: 'place', spot: spotForOpen, param: foreignParam };
      }
      return { type: 'home', spot: spotForOpen };
    }
    if (foreignParam?.startsWith('tour-') && !isBlockedCountryOnlyPlaceParam(foreignParam)) {
      return { type: 'place', spot: spotForOpen, param: foreignParam };
    }
    const aliasPlaceSlug =
      resolveExploreAliasDirectPlaceSlug(pin.name) ||
      resolveExploreAliasDirectPlaceSlug(pin.name_ko) ||
      resolveExploreAliasDirectPlaceSlug(pin.name_en);
    if (
      aliasPlaceSlug &&
      foreignParam === aliasPlaceSlug &&
      !isBlockedCountryOnlyPlaceParam(aliasPlaceSlug)
    ) {
      return { type: 'place', spot: spotForOpen, param: aliasPlaceSlug };
    }
    return { type: 'home', spot: spotForOpen };
  }
  if (param && !(countyMismatch && isDomesticExploreUiPoiPinForRouting(pin))) {
    return { type: 'place', spot: pin, param };
  }
  if (rawParam && (pin.contentId || pin.source === 'tourapi')) {
    return { type: 'place', spot: pin, param: rawParam };
  }
  const provinceHub = resolveDomesticProvinceNameHub(pin);
  const provinceSlug = String(provinceHub?.hubId || '').trim();
  if (provinceSlug && !isBlockedCountryOnlyPlaceParam(provinceSlug)) {
    const hubPin = normalizeExploreSelectionPin({
      ...pin,
      hubId: provinceSlug,
      slug: provinceSlug,
      canonical_slug: provinceSlug,
    });
    return { type: 'place', spot: hubPin, param: provinceSlug };
  }
  return { type: 'home', spot: pin };
}

/** SSOT 카탈로그 여행지 — `/place/` 카드 직행. 그 외(uiPlace·도시 등)는 지구본 홈. */
export function isCatalogTravelSpot(spot) {
  if (!spot || typeof spot !== 'object') return false;
  if (spot.uiPlace) return false;
  const slug = resolveCatalogPlaceSlug(spot.slug || spot.canonical_slug);
  if (slug) return true;
  const name = destinationLabel(spot).toLowerCase();
  if (!name) return false;
  return TRAVEL_SPOTS.some(
    (s) =>
      s.name.toLowerCase() === name ||
      (s.name_en && s.name_en.toLowerCase() === name)
  );
}

/**
 * AI 없이 장소 객체로 해석. 실패 시 null.
 */
export function resolveDestinationToSpot(item) {
  const label = destinationLabel(item);
  if (!label) return null;

  // 좌표가 있으면: SSOT slug일 때만 카탈로그, 아니면 uiPlace 유지 (이름 스냅 금지)
  if (item && typeof item === 'object') {
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const catalogSlug = resolveCatalogPlaceSlug(item.slug || item.canonical_slug);
      if (catalogSlug) {
        const bySlug = TRAVEL_SPOTS.find((s) => String(s.slug).toLowerCase() === catalogSlug);
        if (bySlug) return bySlug;
      }

      const rawSlug = typeof item.slug === 'string' ? item.slug.trim() : '';
      const keepSlug = rawSlug && !isEphemeralSlug(rawSlug) ? rawSlug : '';
      const pinId = item.id || (keepSlug ? keepSlug : `search-${lat}-${lng}`);
      return {
        id: pinId,
        slug: keepSlug || `search-${lat}-${lng}`,
        name: label,
        name_en: item.name_en || label,
        country: item.country || null,
        country_en: item.country_en || null,
        lat,
        lng,
        type: 'temp-base',
        uiPlace: true,
        category: item.category,
      };
    }
  }

  if (item && typeof item === 'object' && item.slug) {
    const catalogSlug = resolveCatalogPlaceSlug(item.slug);
    if (catalogSlug) {
      const bySlug = TRAVEL_SPOTS.find((s) => String(s.slug).toLowerCase() === catalogSlug);
      if (bySlug) return bySlug;
    }
  }

  const querySpot = resolveTravelSpotFromSearchQuery(label);
  if (querySpot) return querySpot;

  const lower = label.toLowerCase();
  const localSpot =
    TRAVEL_SPOTS.find(
      (s) =>
        s.name.toLowerCase() === lower ||
        (s.name_en && s.name_en.toLowerCase() === lower)
    ) || null;
  if (localSpot) return localSpot;

  const citySpot =
    (citiesData || []).find(
      (c) =>
        c.name.toLowerCase() === lower ||
        (c.name_en && c.name_en.toLowerCase() === lower)
    ) || null;
  if (citySpot) {
    return {
      id: `city-${citySpot.lat}-${citySpot.lng}`,
      slug: citySpot.slug,
      name: citySpot.name,
      name_en: citySpot.name_en || citySpot.name,
      country: citySpot.country || 'Explore',
      country_en: citySpot.country_en || 'Explore',
      lat: citySpot.lat,
      lng: citySpot.lng,
      type: 'temp-base',
    };
  }

  return null;
}
