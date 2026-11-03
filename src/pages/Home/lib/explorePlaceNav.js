import { coordsInKorea } from './visitedPlaceSearch.js';
import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { resolveExploreCityHubExact } from './exploreHubResolve.js';
import { getLocalizedParentCityLabel } from '../../../components/PlaceCard/common/locationDisplay.js';
import { koreaTourContentPlaceParam } from './formatUrlName.js';
import {
  expandKoreaAdminPlaceQueries,
  isKoreaProvinceLevelName,
  isMapboxRegionFeatureAdminPin,
  resolveKoreaProvinceCatalogHub,
} from './koreaExploreProvincePlace.js';

const MAPBOX_SOURCES = new Set(['mapbox', 'mapbox-geocode']);

export function isMapboxOrGeocodeSource(source) {
  const s = String(source ?? '').trim().toLowerCase();
  return MAPBOX_SOURCES.has(s);
}

export function pinCoordsInKorea(pin) {
  const lat = Number(pin?.lat);
  const lng = Number(pin?.lng);
  return coordsInKorea(lat, lng);
}

export function hasKoreaTourContentId(pin) {
  const contentId = String(pin?.contentId ?? '').trim();
  return /^\d{1,32}$/.test(contentId);
}

function compactExploreNameKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

const ADMIN_REGION_SUFFIX_RE =
  /(?:특별자치도|특별자치시|특별시|광역시|자치시|자치군|도)$/u;

function isDomesticMapboxCountryName(pin) {
  const nameKey = compactExploreNameKey(pin?.name || pin?.name_en);
  return (
    nameKey === 'southkorea' ||
    nameKey === 'korea' ||
    nameKey === 'republicofkorea' ||
    nameKey === '대한민국' ||
    nameKey === '한국'
  );
}

/** Mapbox country·region(도) 행정 — POI가 아닌 핀 */
export function isDomesticMapboxAdminAreaPin(pin) {
  if (!pin || typeof pin !== 'object') return false;
  const source = String(pin.source ?? '').trim().toLowerCase();
  if (!isMapboxOrGeocodeSource(source) && !isMapboxOrGeocodePinId(pin)) return false;

  const featureType = String(pin.feature_type || pin.featureType || '').toLowerCase();
  if (featureType === 'country') return true;
  if (isMapboxRegionFeatureAdminPin(pin)) return true;
  const name = String(pin.name || pin.name_ko || '').trim();
  if (name && (isKoreaProvinceLevelName(name) || resolveKoreaProvinceCatalogHub(name))) {
    return true;
  }
  return isDomesticMapboxCountryName(pin);
}

/** region(도) Mapbox — 허브 exact(제주특별자치도→jeju). 나라·무매칭 도는 null */
export function resolveDomesticMapboxAdminHub(pin) {
  if (!pin || typeof pin !== 'object') return null;
  if (!isDomesticMapboxAdminAreaPin(pin)) return null;

  const featureType = String(pin.feature_type || pin.featureType || '').toLowerCase();
  if (featureType === 'country' || isDomesticMapboxCountryName(pin)) return null;

  const rawName = String(pin.name || pin.name_ko || pin.place_formatted || '').trim();
  if (!rawName) return null;

  const queries = new Set(expandKoreaAdminPlaceQueries(rawName));
  let stripped = rawName.replace(ADMIN_REGION_SUFFIX_RE, '').trim();
  if (stripped) queries.add(stripped);
  if (/특별자치도$/u.test(rawName)) {
    const prefix = rawName.replace(/특별자치도$/u, '').trim();
    if (prefix) queries.add(prefix);
  }

  for (const q of queries) {
    const hub =
      resolveKoreaProvinceCatalogHub(q) ||
      resolveExploreCityHubExact(q) ||
      resolveCityAttractionHub(q);
    if (hub?.hubId) return hub;
  }
  return null;
}

/** @deprecated use isDomesticMapboxAdminAreaPin + resolveDomesticMapboxAdminHub */
export function isDomesticMapboxCountryOrProvincePin(pin) {
  if (!isDomesticMapboxAdminAreaPin(pin)) return false;
  if (String(pin.feature_type || pin.featureType || '').toLowerCase() === 'country') return true;
  if (isDomesticMapboxCountryName(pin)) return true;
  return !resolveDomesticMapboxAdminHub(pin);
}

/** Mapbox 나라·무매칭 도 — 홈 지구본 (/place/mapbox-* 금지) */
export function shouldKeepDomesticMapboxAdminPinOnHome(pin) {
  if (!isDomesticMapboxAdminAreaPin(pin)) return false;
  if (String(pin.feature_type || pin.featureType || '').toLowerCase() === 'country') return true;
  if (isDomesticMapboxCountryName(pin)) return true;
  return !resolveDomesticMapboxAdminHub(pin);
}

/** 국내 탐색 후보 — tourapi·국내 Mapbox POI(나라·도 제외)는 /place */
export function shouldRouteDomesticExplorePinToPlace(pin) {
  if (!pin || typeof pin !== 'object') return false;
  if (!pinCoordsInKorea(pin)) return false;
  if (!isDomesticKoreaLocation(pin)) return false;

  const source = String(pin.source ?? '').trim().toLowerCase();
  if (source === 'tourapi') return true;

  if (isMapboxOrGeocodeSource(source) || isMapboxOrGeocodePinId(pin)) {
    if (shouldKeepDomesticMapboxAdminPinOnHome(pin)) return false;
    if (resolveDomesticMapboxAdminHub(pin)) return true;
    return true;
  }
  return false;
}

function isMapboxOrGeocodePinId(pin) {
  const id = String(pin?.id ?? '').trim().toLowerCase();
  return id.startsWith('mapbox-') || id.startsWith('geocode-');
}

function hubIdFromParentCity(parentCity) {
  const raw = String(parentCity || '').trim();
  if (!raw) return '';
  const hub = resolveCityAttractionHub(raw);
  return hub?.hubId ? String(hub.hubId) : '';
}

/** 탐색 선택 직전 — tour-{contentId}·mapbox source·한글 parentCity 정규화 */
export function normalizeExploreSelectionPin(pin) {
  if (!pin || typeof pin !== 'object') return pin;
  let next = { ...pin };

  const id = String(next.id ?? '').trim().toLowerCase();
  if (!next.source && isMapboxOrGeocodePinId(next)) {
    next.source = id.startsWith('geocode-') ? 'mapbox-geocode' : 'mapbox';
  }

  const parentRaw = String(next.parentCity || '').trim();
  if (parentRaw) {
    const localized = getLocalizedParentCityLabel(parentRaw, 'ko');
    if (localized && localized !== parentRaw) {
      next.parentCity = localized;
    }
    if (!next.hubId) {
      const hubId = hubIdFromParentCity(localized || parentRaw);
      if (hubId) next.hubId = hubId;
    }
  }

  const adminHub = resolveDomesticMapboxAdminHub(next);
  if (adminHub?.hubId) {
    const hubSlug = String(adminHub.hubId).trim();
    next.hubId = hubSlug;
    next.slug = hubSlug;
    next.canonical_slug = hubSlug;
  }

  const contentId = String(next.contentId ?? '').trim();
  const tourParam = koreaTourContentPlaceParam(contentId);
  const source = String(next.source ?? '').trim().toLowerCase();
  const tourAttached = next.exploreTourAttached === true;
  if (tourParam && (source === 'tourapi' || tourAttached)) {
    next.source = 'tourapi';
    next.contentId = contentId;
    next.slug = tourParam;
    next.canonical_slug = tourParam;
    next.uiPlace = true;
    delete next.exploreTourAttached;
  }

  return next;
}

/**
 * 국내 Mapbox POI — TourAPI title·hub로 contentId 연결 (장흥 고산사 tour-127937 등).
 * @param {object} pin
 */
export async function attachKoreaTourContentToExplorePin(pin) {
  const normalized = normalizeExploreSelectionPin(pin);
  if (hasKoreaTourContentId(normalized)) return normalized;

  const source = String(normalized.source ?? '').trim().toLowerCase();
  if (!isMapboxOrGeocodeSource(source) && !isMapboxOrGeocodePinId(normalized)) {
    return normalized;
  }
  if (!shouldRouteDomesticExplorePinToPlace(normalized)) return normalized;

  const title = String(normalized.name || normalized.name_ko || '').trim();
  if (!title || title.length < 2) return normalized;

  let hubId =
    String(normalized.hubId || '').trim() || hubIdFromParentCity(normalized.parentCity);
  if (!hubId) {
    const formatted = String(normalized.place_formatted || '').trim();
    const head = formatted.split(',')[0]?.trim();
    if (head) hubId = hubIdFromParentCity(head);
  }

  try {
    const { lookupKoreaTourAttractionByTitle } = await import('./koreaTourAttractions.js');
    const row = await lookupKoreaTourAttractionByTitle({ title, hubId: hubId || undefined });
    if (!row?.contentId) return normalized;
    const { tourAttractionToPoiSuggestion } = await import('./koreaPoiTypeSearch.js');
    const tourPin = tourAttractionToPoiSuggestion(row);
    if (!tourPin) return normalized;
    return normalizeExploreSelectionPin({
      ...normalized,
      ...tourPin,
      exploreTourAttached: true,
      name: normalized.name || tourPin.name,
      name_ko: normalized.name_ko || normalized.name || tourPin.name,
      parentCity: normalized.parentCity || tourPin.parentCity,
      hubId: normalized.hubId || tourPin.hubId,
    });
  } catch {
    return normalized;
  }
}

export function isBlockedCountryOnlyPlaceParam(param) {
  const p = String(param ?? '').trim().toLowerCase();
  return p === 'south-korea' || p === 'korea' || p === 'republic-of-korea';
}
