/**
 * search- 좌표 카드 — 근처 등록 여행지·도시 허브의 이름과 소개를 쓴다.
 * URL은 search-lat-lng 로 남긴다 (좌표 카드·달력). uiPlace 풀머지는 하지 않는다.
 */
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { resolveTravelSpotFromCoords } from '../../../utils/travelSpotResolve.js';
import { hubToPlacePin, listCityAttractionHubs } from './cityAttractionHubs.js';

/** 도심 좌표가 도시 핀에서 몇 km 떨어져도 같은 도시로 본다. */
export const COORD_PLACE_CITY_KM = 20;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestHub(lat, lng) {
  let best = null;
  let bestKm = Infinity;
  for (const hub of listCityAttractionHubs()) {
    const hLat = Number(hub?.lat);
    const hLng = Number(hub?.lng);
    if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) continue;
    const km = haversineKm(lat, lng, hLat, hLng);
    if (km < bestKm) {
      bestKm = km;
      best = hub;
    }
  }
  if (!best || bestKm > COORD_PLACE_CITY_KM) return null;
  return { hub: best, km: bestKm };
}

function fromSpot(spot) {
  return {
    kind: 'spot',
    slug: spot.slug,
    name: spot.name,
    name_en: spot.name_en || spot.name,
    country: spot.country || '',
    country_en: spot.country_en || '',
    desc: String(spot.desc || '').trim(),
  };
}

function fromHub(hub) {
  const pin = hubToPlacePin(hub);
  return {
    kind: 'hub',
    slug: pin.slug,
    name: pin.name,
    name_en: pin.name_en || pin.name,
    country: pin.country || '',
    country_en: pin.country_en || '',
    desc: String(pin.desc || '').trim(),
  };
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {{ kind: string, slug: string, name: string, name_en: string, country: string, country_en: string, desc: string } | null}
 */
export function resolveCoordinatePlaceIdentity(lat, lng) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;

  const spot = resolveTravelSpotFromCoords(latN, lngN, TRAVEL_SPOTS, COORD_PLACE_CITY_KM);
  const spotKm = spot ? haversineKm(latN, lngN, spot.lat, spot.lng) : Infinity;
  const hubHit = nearestHub(latN, lngN);

  if (spot && !hubHit) return fromSpot(spot);
  if (!spot && hubHit) return fromHub(hubHit.hub);
  if (!spot && !hubHit) return null;

  if (spotKm <= hubHit.km) return fromSpot(spot);
  const editorial = String(spot.desc || '').trim();
  const editorialReal = Boolean(editorial) && !/지역을 탐색합니다/.test(editorial);
  if (editorialReal && spotKm <= COORD_PLACE_CITY_KM && hubHit.km + 8 >= spotKm) {
    return fromSpot(spot);
  }
  return fromHub(hubHit.hub);
}
