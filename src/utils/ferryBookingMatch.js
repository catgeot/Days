import ferryData from '../pages/Home/data/travelSpotFerries.json';
import { DIRECT_FERRIES_HOME_URL } from '../components/PlaceCard/tabs/planner/constants.js';
import { getKlookFerryUrl } from './affiliate.js';

const PROVIDER_ORDER = ['direct', 'direct_ferries', 'twelve_go', 'klook_ferry'];

/** @typedef {{ provider: string, name: string, url?: string }} FerryBookingLink */
/** @typedef {{ id: string, label: string, duration?: string, directFerries?: boolean, tips?: string[], dfRecommendations?: string[], bookings: FerryBookingLink[] }} FerryRoute */
/** @typedef {{ tier: string, summary?: string, routes?: FerryRoute[], fallbacks?: string[], dfRecommendations?: string[], source?: string }} FerryProfile */

/**
 * @param {string | null | undefined} slug
 * @returns {FerryProfile | null}
 */
export function resolveFerryProfile(slug) {
  if (!slug) return null;
  const profile = ferryData.spots?.[slug];
  if (!profile) return null;
  return profile;
}

/**
 * @param {string | null | undefined} slug
 * @returns {boolean}
 */
export function shouldShowFerryCard(slug) {
  const profile = resolveFerryProfile(slug);
  if (!profile) return false;
  return profile.tier === 'required' || profile.tier === 'common';
}

/**
 * @param {FerryBookingLink} booking
 * @returns {FerryBookingLink & { url: string }}
 */
export function resolveBookingUrl(booking) {
  if (booking.provider === 'direct_ferries') {
    return { ...booking, url: DIRECT_FERRIES_HOME_URL };
  }
  if (booking.provider === 'klook_ferry') {
    return { ...booking, url: getKlookFerryUrl() };
  }
  return { ...booking, url: booking.url ?? '' };
}

/**
 * @param {FerryBookingLink[]} bookings
 * @returns {Array<FerryBookingLink & { url: string }>}
 */
function sortAndResolveBookings(bookings) {
  const sorted = [...bookings].sort(
    (a, b) => PROVIDER_ORDER.indexOf(a.provider) - PROVIDER_ORDER.indexOf(b.provider)
  );
  return sorted.map(resolveBookingUrl).filter((b) => b.url);
}

/**
 * @param {string | null | undefined} slug
 * @param {string} [stepTitle]
 * @returns {{ route: FerryRoute | null, bookings: Array<FerryBookingLink & { url: string }>, fallbacks: Array<FerryBookingLink & { url: string }> }}
 */
export function resolveFerryBookings(slug, stepTitle = '') {
  const profile = resolveFerryProfile(slug);
  if (!profile || (profile.tier !== 'required' && profile.tier !== 'common')) {
    return { route: null, bookings: [], fallbacks: [] };
  }

  const routes = profile.routes ?? [];
  let matchedRoute = routes[0] ?? null;

  if (stepTitle && routes.length > 1) {
    const lower = stepTitle.toLowerCase();
    const found = routes.find(
      (r) =>
        r.label.toLowerCase().includes(lower) ||
        lower.includes(r.label.toLowerCase().slice(0, 8))
    );
    if (found) matchedRoute = found;
  }

  const routeBookings = matchedRoute?.bookings?.length
    ? sortAndResolveBookings(matchedRoute.bookings)
    : [];

  const fallbackProviders = profile.fallbacks ?? [];
  const fallbacks = fallbackProviders
    .map((provider) => resolveBookingUrl({ provider, name: provider === 'klook_ferry' ? 'Klook 페리' : provider }))
    .filter((b) => b.url && !routeBookings.some((rb) => rb.provider === b.provider));

  const bookings =
    routeBookings.length > 0
      ? routeBookings
      : fallbacks.length > 0
        ? fallbacks
        : [resolveBookingUrl({ provider: 'klook_ferry', name: 'Klook 페리' })].filter((b) => b.url);

  return { route: matchedRoute, bookings, fallbacks };
}

/**
 * @param {string | null | undefined} slug
 * @returns {string[]}
 */
export function getDfRecommendations(slug) {
  const profile = resolveFerryProfile(slug);
  return profile?.dfRecommendations ?? [];
}

/**
 * @param {string | null | undefined} slug
 * @returns {boolean}
 */
export function isCruiseOnlyDestination(slug) {
  const profile = resolveFerryProfile(slug);
  return profile?.tier === 'cruise_only';
}
