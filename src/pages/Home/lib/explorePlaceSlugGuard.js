import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { citiesData } from '../data/citiesData.js';
import {
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubPlaceFromSlug,
} from './cityAttractionHubs.js';
import {
  isKoreaProvinceLevelName,
  resolveKoreaProvinceCatalogHub,
} from './koreaExploreProvincePlace.js';
const MAPBOX_SOURCES = new Set(['mapbox', 'mapbox-geocode']);

function isMapboxOrGeocodeSource(source) {
  return MAPBOX_SOURCES.has(String(source ?? '').trim().toLowerCase());
}

function hasKoreaTourContentId(pin) {
  const contentId = String(pin?.contentId ?? '').trim();
  return /^\d{1,32}$/.test(contentId);
}

function isEphemeralSlug(slug) {
  if (!slug || typeof slug !== 'string') return true;
  const s = slug.trim();
  return (
    !s ||
    /^\d+$/.test(s) ||
    s.startsWith('search-') ||
    s.startsWith('loc-') ||
    s.startsWith('city-') ||
    s.startsWith('label-')
  );
}

function resolveCatalogPlaceSlug(slug) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!s || isEphemeralSlug(s)) return null;
  return TRAVEL_SPOTS.find((x) => String(x.slug).toLowerCase() === s)?.slug ?? null;
}

function normalizePlaceToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function isMapboxOrGeocodePin(spot) {
  const id = String(spot?.id ?? '').trim().toLowerCase();
  if (id.startsWith('mapbox-') || id.startsWith('geocode-')) return true;
  return isMapboxOrGeocodeSource(spot?.source);
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

export function pinNameOwnsPlace(pin, place) {
  if (!place) return true;
  const names = [pin?.name, pin?.name_ko].map(normalizePlaceToken).filter(Boolean);
  if (!names.length) return true;
  const hub = resolveCityAttractionHub(place?.hubId || place?.slug);
  const catalogSlug = resolveCatalogPlaceSlug(place?.slug || place?.hubId);
  const catalog = catalogSlug
    ? TRAVEL_SPOTS.find((spot) => String(spot.slug).toLowerCase() === catalogSlug)
    : null;
  const known = [
    place.name,
    place.name_en,
    place.slug,
    place.hubId,
    ...(place.aliases || []),
    ...(hub?.aliases || []),
    hub?.name,
    hub?.name_en,
    catalog?.name,
    catalog?.name_en,
  ]
    .map(normalizePlaceToken)
    .filter(Boolean);
  return names.some((token) => known.includes(token));
}

function knownPlaceSlug(param) {
  const catalog = resolveCatalogPlaceSlug(param);
  if (catalog) return catalog;
  const normalized = String(param ?? '').trim().toLowerCase();
  if (!normalized || isEphemeralSlug(normalized)) return null;
  const hub = resolveHubPlaceFromSlug(normalized);
  if (hub?.slug && !isEphemeralSlug(String(hub.slug))) return String(hub.slug);
  const city = (citiesData || []).find((row) => String(row?.slug || '').toLowerCase() === normalized);
  return city?.slug ? String(city.slug) : null;
}

function isDomesticExploreUiPoiPin(pin) {
  if (!pin || typeof pin !== 'object') return false;
  const source = String(pin.source ?? '').trim().toLowerCase();
  if (source === 'tourapi' || source === 'hub' || source === 'ssot') return false;
  if (hasKoreaTourContentId(pin)) return false;
  return Boolean(pin.uiPlace || pin.poiAttraction || isMapboxOrGeocodePin(pin));
}

export function uiPlacePoiCollidesWithCatalogParam(pin, urlParam) {
  if (!isDomesticExploreUiPoiPin(pin)) return false;
  const param = knownPlaceSlug(String(urlParam || '').trim());
  if (!param) return false;
  const known = knownPlaceForParam(param);
  if (!known) return false;
  const hubSlug = String(pin?.hubId ?? '').trim().toLowerCase();
  if (hubSlug && hubSlug === String(param).toLowerCase()) {
    if (pinNameOwnsPlace(pin, known)) return false;
    const adminName = String(pin?.name_ko || pin?.name || '').trim();
    const provinceHub = adminName ? resolveKoreaProvinceCatalogHub(adminName) : null;
    if (
      adminName &&
      isKoreaProvinceLevelName(adminName) &&
      String(provinceHub?.hubId || '').toLowerCase() === hubSlug
    ) {
      return false;
    }
  }
  return !pinNameOwnsPlace(pin, known);
}

export function detachCountySlugFromCatalog(pin, known) {
  const name = String(pin?.name_ko || pin?.name || '').trim();
  const knownTokens = [known?.name, known?.name_en, known?.slug].map(normalizePlaceToken);
  const nameEn = String(pin?.name_en || '').trim();
  const enIsCounty = Boolean(nameEn) && knownTokens.includes(normalizePlaceToken(nameEn));
  return {
    ...pin,
    slug: placeUrlSlug(enIsCounty ? '' : nameEn, name),
    name_en: enIsCounty ? '' : pin?.name_en,
    parentCity: pin?.parentCity || known?.name || undefined,
  };
}

export function isDomesticExploreUiPoiPinForRouting(pin) {
  return isDomesticExploreUiPoiPin(pin);
}
