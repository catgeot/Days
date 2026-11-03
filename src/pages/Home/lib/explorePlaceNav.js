import { coordsInKorea } from './visitedPlaceSearch.js';
import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { getLocalizedParentCityLabel } from '../../../components/PlaceCard/common/locationDisplay.js';
import { koreaTourContentPlaceParam } from './formatUrlName.js';

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

/** Mapbox 나라·광역(도) — 홈 지구본 유지, /place/mapbox-kr 금지 */
export function isDomesticMapboxCountryOrProvincePin(pin) {
  if (!pin || typeof pin !== 'object') return false;
  const source = String(pin.source ?? '').trim().toLowerCase();
  if (!isMapboxOrGeocodeSource(source) && !isMapboxOrGeocodePinId(pin)) return false;

  const featureType = String(pin.feature_type || pin.featureType || '').toLowerCase();
  if (featureType === 'country' || featureType === 'region') return true;

  const nameKey = compactExploreNameKey(pin.name || pin.name_en);
  if (
    nameKey === 'southkorea' ||
    nameKey === 'korea' ||
    nameKey === 'republicofkorea' ||
    nameKey === '대한민국' ||
    nameKey === '한국'
  ) {
    return true;
  }
  return false;
}

/** 국내 탐색 후보 — tourapi·국내 Mapbox POI(나라·도 제외)는 /place */
export function shouldRouteDomesticExplorePinToPlace(pin) {
  if (!pin || typeof pin !== 'object') return false;
  if (!pinCoordsInKorea(pin)) return false;
  if (!isDomesticKoreaLocation(pin)) return false;

  const source = String(pin.source ?? '').trim().toLowerCase();
  if (source === 'tourapi') return true;

  if (isMapboxOrGeocodeSource(source) || isMapboxOrGeocodePinId(pin)) {
    if (isDomesticMapboxCountryOrProvincePin(pin)) return false;
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

  const hubId =
    String(normalized.hubId || '').trim() || hubIdFromParentCity(normalized.parentCity);

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
