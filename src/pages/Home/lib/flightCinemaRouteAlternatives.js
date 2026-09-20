import {
  DEFAULT_FLIGHT_ORIGIN_IATA,
  estimateFlightHoursChain,
  estimateFlightLegHours,
  getAirportHubCoords,
} from './globeFlightCinema.js';
import {
  getCuratedFlightRouteAlternativeHubSets,
  resolveCinemaDestIata,
} from '../../../utils/rentalAirportMatch.js';

/**
 * @param {string} originIata
 * @param {string} destIata
 * @param {string[]} hubIatas
 * @returns {string}
 */
export function buildFlightRouteAlternativeKey(originIata, destIata, hubIatas = []) {
  const origin = String(originIata ?? '').trim().toUpperCase();
  const dest = String(destIata ?? '').trim().toUpperCase();
  const hubs = (hubIatas ?? []).map((code) => String(code).trim().toUpperCase()).filter(Boolean);
  return [origin, ...hubs, dest].join('>');
}

/**
 * @param {string} originIata
 * @param {string} destIata
 * @param {string[]} hubIatas
 * @returns {string}
 */
export function formatFlightRouteAlternativeLabel(originIata, destIata, hubIatas = []) {
  const route = [originIata, ...(hubIatas ?? []), destIata].filter(Boolean);
  if (route.length <= 2 && !(hubIatas?.length)) return '직항';
  if (!hubIatas?.length) return route.join(' → ');
  return hubIatas.join(' · ');
}

/**
 * @param {string} originIata
 * @param {string} destIata
 * @param {string[]} hubIatas
 * @returns {{
 *   key: string,
 *   originIata: string,
 *   destIata: string,
 *   hubIatas: string[],
 *   routeIatas: string[],
 *   label: string,
 *   flightHours: number,
 *   flightLegHours: { fromIata: string, toIata: string, hours: number }[],
 *   isConnecting: boolean,
 *   source?: string,
 * }}
 */
export function buildFlightRouteAlternativeOption(originIata, destIata, hubIatas = [], source) {
  const normalizedOrigin = String(originIata ?? '').trim().toUpperCase();
  const normalizedDest = String(destIata ?? '').trim().toUpperCase();
  const hubs = (hubIatas ?? [])
    .map((code) => String(code ?? '').trim().toUpperCase())
    .filter((code) => code.length === 3);
  const routeIatas = [normalizedOrigin, ...hubs, normalizedDest];
  const origin = getAirportHubCoords(normalizedOrigin);
  const dest = getAirportHubCoords(normalizedDest);
  const chainPoints = [
    origin,
    ...hubs.map((iata) => getAirportHubCoords(iata)).filter(Boolean),
    dest,
  ].filter(Boolean);

  return {
    key: buildFlightRouteAlternativeKey(normalizedOrigin, normalizedDest, hubs),
    originIata: normalizedOrigin,
    destIata: normalizedDest,
    hubIatas: hubs,
    routeIatas,
    label: formatFlightRouteAlternativeLabel(normalizedOrigin, normalizedDest, hubs),
    flightHours: estimateFlightHoursChain(chainPoints),
    flightLegHours: estimateFlightLegHours(routeIatas),
    isConnecting: hubs.length > 0,
    source,
  };
}

/**
 * Edge `alternatives` 배열 → Bar top-N 칩 SSOT.
 * @param {string} originIata
 * @param {string} destIata
 * @param {Array<{ hubIatas?: string[], source?: string, path?: string[] }>} [alternatives]
 * @param {number} [maxCount=3]
 */
export function normalizeFlightRouteAlternatives(originIata, destIata, alternatives = [], maxCount = 3) {
  const normalizedOrigin = String(originIata ?? '').trim().toUpperCase();
  const normalizedDest = String(destIata ?? '').trim().toUpperCase();
  const seen = new Set();
  const out = [];

  for (const row of alternatives) {
    const hubs = Array.isArray(row?.hubIatas) ? row.hubIatas : [];
    const option = buildFlightRouteAlternativeOption(
      normalizedOrigin,
      normalizedDest,
      hubs,
      row?.source
    );
    if (seen.has(option.key)) continue;
    seen.add(option.key);
    out.push(option);
    if (out.length >= maxCount) break;
  }

  return out;
}

/**
 * overrides `flightRouteAlternativeHubs` — ICN 출발 Bar 경유 칩 (Edge graph 대신).
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ originIata?: string, destIata?: string, essentialGuide?: Record<string, unknown> | null }} [options]
 */
export function resolveCuratedFlightRouteAlternativesForCinema(location, options = {}) {
  const originIata = String(options.originIata ?? DEFAULT_FLIGHT_ORIGIN_IATA).trim().toUpperCase();
  if (originIata !== DEFAULT_FLIGHT_ORIGIN_IATA) return [];

  const destIata = String(
    options.destIata ?? resolveCinemaDestIata(location, options) ?? ''
  )
    .trim()
    .toUpperCase();
  if (destIata.length !== 3) return [];

  const hubSets = getCuratedFlightRouteAlternativeHubSets(location);
  if (!hubSets?.length) return [];

  const alternatives = hubSets.map((hubIatas) => ({
    hubIatas,
    source: 'curated-alternative',
  }));
  return normalizeFlightRouteAlternatives(originIata, destIata, alternatives, hubSets.length);
}
