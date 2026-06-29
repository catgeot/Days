import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from '../../../utils/rentalAirportHubs.js';
import { distanceKm } from '../../../utils/rentalAirportMatch.js';

/** 국내·단거리 feeder → 국제 gateway 승격 (GPS geolocation 전용) */
export const FLIGHT_ORIGIN_METRO_GATEWAYS = [
  { gatewayIata: 'ICN', feederIatas: ['GMP'] },
  { gatewayIata: 'PVG', feederIatas: ['SHA'] },
];

/**
 * @param {string} iata
 * @param {import('../../../utils/rentalAirportHubs.js').RentalAirportHub[]} hubs
 */
function findHubByIata(iata, hubs) {
  return hubs.find((hub) => hub.iata === iata) ?? null;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {import('../../../utils/rentalAirportHubs.js').RentalAirportHub} hub
 */
function isWithinHubRadius(lat, lng, hub) {
  const km = distanceKm(lat, lng, hub.lat, hub.lng);
  const limit = hub.radiusKm ?? DEFAULT_HUB_RADIUS_KM;
  return km <= limit;
}

/**
 * feeder IATA + GPS가 feeder·gateway radius 모두 안이면 gateway IATA 반환.
 * @param {string} feederIata
 * @param {number} lat
 * @param {number} lng
 * @param {import('../../../utils/rentalAirportHubs.js').RentalAirportHub[]} [hubs]
 * @returns {string | null} gateway IATA or null
 */
export function promoteFlightOriginGateway(feederIata, lat, lng, hubs = RENTAL_AIRPORT_HUBS) {
  const code = String(feederIata ?? '').trim().toUpperCase();
  if (code.length !== 3 || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  for (const group of FLIGHT_ORIGIN_METRO_GATEWAYS) {
    if (!group.feederIatas.includes(code)) continue;

    const feederHub = findHubByIata(code, hubs);
    const gatewayHub = findHubByIata(group.gatewayIata, hubs);
    if (!feederHub || !gatewayHub) continue;

    if (isWithinHubRadius(lat, lng, feederHub) && isWithinHubRadius(lat, lng, gatewayHub)) {
      return group.gatewayIata;
    }
  }

  return null;
}

const METRO_GATEWAY_HINT_LABELS = {
  ICN: '인천(ICN)',
  PVG: '푸둥(PVG)',
};

/**
 * 수동 feeder(GMP·SHA) + 장거리·경유 시 gateway 출발 권장 한 줄 (Bar tooltip).
 * @param {string} originIata
 * @param {{ flightHours?: number, hopCount?: number }} [opts]
 * @returns {string | null}
 */
export function getFlightOriginMetroHint(originIata, { flightHours = 0, hopCount = 0 } = {}) {
  const code = String(originIata ?? '').trim().toUpperCase();
  const isLongHaul = flightHours >= 4 || hopCount >= 2;
  if (!isLongHaul) return null;

  for (const group of FLIGHT_ORIGIN_METRO_GATEWAYS) {
    if (!group.feederIatas.includes(code)) continue;
    const label = METRO_GATEWAY_HINT_LABELS[group.gatewayIata] ?? group.gatewayIata;
    return `장거리 국제선은 ${label} 출발을 권장해요.`;
  }

  return null;
}
