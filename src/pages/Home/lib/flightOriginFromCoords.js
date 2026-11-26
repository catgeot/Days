import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import { distanceKm } from '../../../utils/rentalAirportMatch.js';
import { findNearestAirportInIndex } from '../../../utils/airportsIndexLookup.js';
import { KOREA_AIRPORT_IATAS } from '../../../utils/koreaAirportIatas.js';
import { coordsInKorea } from './visitedPlaceSearch.js';
import { preferPrimaryMetroHub, promoteFlightOriginGateway } from './flightOriginMetroGateways.js';

const GEO_HUB_MAX_KM = 200;
const GEO_INDEX_MAX_KM = 120;

function nearestHubIata(lat, lng, maxKm, excludeIatas) {
  let best = null;
  let bestKm = Infinity;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    if (excludeIatas?.has(hub.iata)) continue;
    const km = distanceKm(lat, lng, hub.lat, hub.lng);
    const limit = Math.min(maxKm, hub.radiusKm ?? maxKm);
    if (km <= limit && km < bestKm) {
      bestKm = km;
      best = hub.iata;
    }
  }
  return best;
}

/**
 * GPS·저장된 좌표 → 출발 IATA. i18n 없이 허브 검색과 같은 반경을 쓴다.
 * @param {number} lat
 * @param {number} lng
 * @returns {string | null}
 */
export function resolveFlightOriginIataFromCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const outside = !coordsInKorea(lat, lng);
  const excludeIatas = outside ? KOREA_AIRPORT_IATAS : null;
  const hubIata = nearestHubIata(lat, lng, GEO_HUB_MAX_KM, excludeIatas);
  if (hubIata) {
    const promoted = promoteFlightOriginGateway(hubIata, lat, lng)
      || preferPrimaryMetroHub(hubIata, lat, lng);
    if (promoted && !excludeIatas?.has(promoted)) return promoted;
    return hubIata;
  }
  const indexHit = findNearestAirportInIndex(lat, lng, {
    maxKm: GEO_INDEX_MAX_KM,
    excludeIatas,
  });
  if (!indexHit) return null;
  if (outside && KOREA_AIRPORT_IATAS.has(indexHit.iata)) return null;
  return indexHit.iata;
}
