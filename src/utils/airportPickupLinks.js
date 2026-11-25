import { isAccessRouteQuery } from './resolveDestinationFromChat.js';
import { buildTripcomAirportTransferUrl, getMrtSearchUrl } from './affiliate.js';
import { KOREA_AIRPORT_IATAS } from './koreaAirportIatas.js';
import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import { resolveRentalAirport } from './rentalAirportMatch.js';
import { isGateoAirportPickupLinksEnabled } from '../shared/gateoFeatureFlags.js';

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
  const citySlug = TRIP_AIRPORT_TRANSFER_CITY[code];
  if (citySlug) {
    const href = buildTripcomAirportTransferUrl(citySlug, code, { campaign: 'airport-pickup' });
    return href || null;
  }
  const hub = hubForIata(code);
  if (!hub) return null;
  const href = getMrtSearchUrl(`${code} 공항 픽업`);
  return href || null;
}

/**
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {{ href: string, iata: string } | null}
 */
export function airportPickupRowForPlace(location) {
  if (!isGateoAirportPickupLinksEnabled()) return null;
  const resolved = resolveRentalAirport(location);
  const iata = normalizeIata(resolved?.iata);
  if (!/^[A-Z]{3}$/.test(iata)) return null;
  const href = buildAirportPickupUrl(iata);
  if (!href) return null;
  return { href, iata };
}

/** MOONi 「가는 방법」 / festival 「가는 법」 turn. */
export function isGettingThereUserText(text) {
  return isAccessRouteQuery(text);
}
