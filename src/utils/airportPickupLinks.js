import { isAccessRouteQuery } from './resolveDestinationFromChat.js';
import { buildTripcomAirportTransferUrl, getMrtSearchUrl } from './affiliate.js';
import { KOREA_AIRPORT_IATAS } from './koreaAirportIatas.js';
import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import { resolveRentalAirport } from './rentalAirportMatch.js';
import { isGateoAirportPickupLinksEnabled } from '../shared/gateoFeatureFlags.js';
import travelSpotList from '../pages/Home/data/travelSpots-list.json';

/**
 * Trip.com listing paths whose <title> is the city pickup page, not the generic
 * 「전문 공항픽업」 home. Checked 2026-11-25. Unlisted airports use MyRealTrip search.
 */
const TRIP_AIRPORT_TRANSFER_CITY = {
  HKT: 'phuket',
  BKK: 'bangkok',
  DMK: 'bangkok',
  CAI: 'cairo',
  KIX: 'osaka',
  SIN: 'singapore',
  CDG: 'paris',
  JFK: 'new-york',
  DXB: 'dubai',
  CNX: 'chiang-mai',
};

function normalizeIata(value) {
  return String(value ?? '').trim().toUpperCase();
}

function hubForIata(code) {
  return RENTAL_AIRPORT_HUBS.find((row) => row.iata === code) || null;
}

const spotBySlug = new Map(
  (Array.isArray(travelSpotList) ? travelSpotList : []).map((row) => [row.slug, row]),
);

function placeNames(location) {
  const slug = String(location?.slug || '').trim();
  const spot = slug ? spotBySlug.get(slug) : null;
  const placeKo = String(spot?.name || location?.name || '').trim();
  const placeEn = String(spot?.name_en || location?.name_en || placeKo).trim();
  return { placeKo, placeEn };
}

function describeAirportPickup(code) {
  const citySlug = TRIP_AIRPORT_TRANSFER_CITY[code];
  if (citySlug) {
    const href = buildTripcomAirportTransferUrl(citySlug, code, { campaign: 'airport-pickup' });
    return href ? { href, partner: 'trip' } : null;
  }
  const hub = hubForIata(code);
  if (!hub) return null;
  const href = getMrtSearchUrl(`${code} 공항 픽업`);
  return href ? { href, partner: 'mrt' } : null;
}

/**
 * Airport pickup listing URL. Korean airports and unknown codes return null.
 * Trip.com listing when the city path is verified; otherwise MyRealTrip search
 * (`getMrtSearchUrl`) keyed by the airport code.
 *
 * @param {string} iata
 * @returns {string | null}
 */
export function buildAirportPickupUrl(iata) {
  const code = normalizeIata(iata);
  if (!/^[A-Z]{3}$/.test(code)) return null;
  if (KOREA_AIRPORT_IATAS.has(code)) return null;
  return describeAirportPickup(code)?.href || null;
}

/**
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {{ href: string, iata: string, partner: 'trip' | 'mrt', placeKo: string, placeEn: string } | null}
 */
export function airportPickupRowForPlace(location) {
  if (!isGateoAirportPickupLinksEnabled()) return null;
  const resolved = resolveRentalAirport(location);
  const iata = normalizeIata(resolved?.iata);
  const href = buildAirportPickupUrl(iata);
  if (!href) return null;
  return {
    href,
    iata,
    partner: TRIP_AIRPORT_TRANSFER_CITY[iata] ? 'trip' : 'mrt',
    ...placeNames(location),
  };
}

/** MOONi 「가는 방법」 / festival 「가는 법」 turn. */
export function isGettingThereUserText(text) {
  return isAccessRouteQuery(text);
}
