import { coordsInKorea } from './visitedPlaceSearch.js';
import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';

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

/** 국내 탐색 후보 — Mapbox·명승·tourapi 포함 contentId 또는 한글 POI는 /place 로 */
export function shouldRouteDomesticExplorePinToPlace(pin) {
  if (!pin || typeof pin !== 'object') return false;
  if (!pinCoordsInKorea(pin)) return false;
  if (!isDomesticKoreaLocation(pin)) return false;

  const source = String(pin.source ?? '').trim().toLowerCase();
  if (source === 'tourapi') return true;
  if (hasKoreaTourContentId(pin)) return true;

  if (isMapboxOrGeocodeSource(source)) {
    const name = String(pin.name || pin.name_ko || '').trim();
    if (/[\uAC00-\uD7A3]/.test(name)) return true;
  }
  return false;
}

export function isBlockedCountryOnlyPlaceParam(param) {
  const p = String(param ?? '').trim().toLowerCase();
  return p === 'south-korea' || p === 'korea' || p === 'republic-of-korea';
}
