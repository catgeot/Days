import { findKoreaOriginCityById, readDomesticOriginCityId } from './koreaOriginCityMatch.js';
import {
  queryGeolocationPermission,
  readLocationSuccess,
  shouldAttemptSilentGeolocation,
} from '../../Korea/festivalLocationHint.js';

const GEO_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 120000,
};

function finitePair(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { lat: latitude, lng: longitude };
}

/**
 * 이미 알고 있는 위치. 권한 창은 띄우지 않는다.
 * @param {Pick<Storage, 'getItem'> | null | undefined} [storage]
 * @returns {{ lat: number, lng: number } | null}
 */
export function readStoredUserOriginCoords(storage) {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return null;
  const saved = readLocationSuccess(store);
  if (saved) return finitePair(saved.lat, saved.lng);
  const city = findKoreaOriginCityById(readDomesticOriginCityId(store));
  if (!city) return null;
  return finitePair(city.lat, city.lng);
}

/**
 * 호출자가 넘긴 좌표가 있으면 그것을, 없으면 저장된 위치를 쓴다.
 * @param {{ userLat?: number, userLng?: number }} [options]
 * @returns {{ lat: number, lng: number } | null}
 */
export function resolveKnownUserOriginCoords(options = {}) {
  const explicit = finitePair(options.userLat, options.userLng);
  if (explicit) return explicit;
  return readStoredUserOriginCoords();
}

/**
 * 이미 허용된 위치만 읽는다. prompt 상태에서는 요청하지 않는다.
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export function readGrantedUserOriginCoords() {
  if (typeof navigator === 'undefined' || !navigator.geolocation?.getCurrentPosition) {
    return Promise.resolve(null);
  }
  return queryGeolocationPermission().then((permission) => {
    if (!shouldAttemptSilentGeolocation(permission)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(finitePair(position?.coords?.latitude, position?.coords?.longitude));
        },
        () => resolve(null),
        GEO_OPTIONS,
      );
    });
  });
}
