import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import { distanceKm } from '../../../utils/rentalAirportMatch.js';
import { findNearestAirportInIndex } from '../../../utils/airportsIndexLookup.js';
import { matchDepartureInText } from '../../../utils/resolveDepartureIataFromChat.js';
import { getFlightCinemaOriginOption } from './flightCinemaOriginOptions.js';

const GEO_HUB_MAX_KM = 200;
const GEO_INDEX_MAX_KM = 120;

/**
 * @param {number} lat
 * @param {number} lng
 * @param {number} maxKm
 * @returns {{ iata: string, label: string, officialKo?: string, km: number } | null}
 */
function findNearestRentalHub(lat, lng, maxKm) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let best = null;
  let bestKm = Infinity;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const km = distanceKm(lat, lng, hub.lat, hub.lng);
    const limit = Math.min(maxKm, hub.radiusKm ?? maxKm);
    if (km <= limit && km < bestKm) {
      bestKm = km;
      const ko = hub.aliases?.find((alias) => /[가-힣]/.test(alias));
      best = {
        iata: hub.iata,
        label: ko || hub.officialKo || hub.iata,
        officialKo: hub.officialKo,
        km,
      };
    }
  }
  return best;
}

/**
 * @param {import('../../../utils/rentalAirportHubs.js').RentalAirportHub} hub
 * @returns {{ iata: string, label: string, officialKo?: string }}
 */
function hubToSearchResult(hub) {
  const option = getFlightCinemaOriginOption(hub.iata);
  return {
    iata: hub.iata,
    label: option?.label || hub.officialKo || hub.iata,
    officialKo: hub.officialKo,
  };
}

/**
 * @param {string} hay
 * @param {import('../../../utils/rentalAirportHubs.js').RentalAirportHub} hub
 * @returns {number} higher = better match; 0 = no match
 */
function scoreHubAgainstQuery(hay, hub) {
  const iataLower = hub.iata.toLowerCase();
  if (hay === iataLower) return 100;
  if (hub.officialKo && hub.officialKo.toLowerCase().includes(hay)) {
    return hub.officialKo.toLowerCase().startsWith(hay) ? 80 : 60;
  }
  for (const alias of hub.aliases || []) {
    const al = alias.toLowerCase();
    if (al === hay) return 90;
    if (al.startsWith(hay) && hay.length >= 2) return 70;
    if (al.includes(hay) && hay.length >= 2) return 50;
  }
  if (iataLower.startsWith(hay) && hay.length >= 2) return 65;
  return 0;
}

/**
 * RENTAL_AIRPORT_HUBS + MOONi matcher — 시네마 출발지 검색.
 * @param {string} query
 * @param {{ limit?: number }} [options]
 * @returns {{ iata: string, label: string, officialKo?: string }[]}
 */
export function searchFlightOriginHubs(query, options = {}) {
  const limit = options.limit ?? 8;
  const raw = String(query ?? '').trim();
  if (!raw) return [];

  const hay = raw.toLowerCase();
  const ranked = new Map();

  const push = (row, score) => {
    if (!row?.iata) return;
    const prev = ranked.get(row.iata);
    if (!prev || score > prev.score) {
      ranked.set(row.iata, { row, score });
    }
  };

  const chatMatch = matchDepartureInText(raw);
  if (chatMatch) {
    const option = getFlightCinemaOriginOption(chatMatch.iata);
    push(
      {
        iata: chatMatch.iata,
        label: chatMatch.label || option?.label || chatMatch.iata,
        officialKo: option?.officialKo,
      },
      95
    );
  }

  for (const hub of RENTAL_AIRPORT_HUBS) {
    const score = scoreHubAgainstQuery(hay, hub);
    if (score > 0) push(hubToSearchResult(hub), score);
  }

  return [...ranked.values()]
    .sort((a, b) => b.score - a.score || a.row.iata.localeCompare(b.row.iata))
    .slice(0, limit)
    .map(({ row }) => row);
}

/**
 * GPS → rental 허브 200km → airportsIndex 120km 폴백.
 * @returns {Promise<{ iata: string, label: string, officialKo?: string, source: 'hub' | 'index' }>}
 */
export function resolveOriginFromGeolocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const hub = findNearestRentalHub(latitude, longitude, GEO_HUB_MAX_KM);
        if (hub) {
          resolve({
            iata: hub.iata,
            label: hub.label,
            officialKo: hub.officialKo,
            source: 'hub',
          });
          return;
        }

        const indexHit = findNearestAirportInIndex(latitude, longitude, { maxKm: GEO_INDEX_MAX_KM });
        if (indexHit) {
          const option = getFlightCinemaOriginOption(indexHit.iata);
          resolve({
            iata: indexHit.iata,
            label: option?.label || indexHit.iata,
            officialKo: option?.officialKo,
            source: 'index',
          });
          return;
        }

        reject(Object.assign(new Error('not_found'), { code: 'not_found' }));
      },
      (err) => {
        const code = err?.code === 1 ? 'denied' : 'unavailable';
        reject(Object.assign(new Error(code), { code }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}
