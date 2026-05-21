import ferryData from '../pages/Home/data/travelSpotFerries.json';
import { DIRECT_FERRIES_HOME_URL } from '../components/PlaceCard/tabs/planner/constants.js';
import { get12GoAffiliateUrl, getKlookFerryUrl } from './affiliate.js';

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
 * @param {{ slug?: string, campaign?: string }} [context]
 * @returns {FerryBookingLink & { url: string }}
 */
export function resolveBookingUrl(booking, context = {}) {
  if (booking.provider === 'direct_ferries') {
    return { ...booking, url: DIRECT_FERRIES_HOME_URL };
  }
  if (booking.provider === 'klook_ferry') {
    return { ...booking, url: getKlookFerryUrl() };
  }
  if (booking.provider === 'twelve_go') {
    const base = booking.url ?? '';
    const subId =
      context.subId ??
      (context.slug
        ? `${context.slug}-${context.campaign || 'planner'}`
        : context.campaign || 'gateo-planner');
    return { ...booking, url: get12GoAffiliateUrl(base, { subId }) };
  }
  return { ...booking, url: booking.url ?? '' };
}

/**
 * @param {FerryBookingLink[]} bookings
 * @returns {Array<FerryBookingLink & { url: string }>}
 */
function sortAndResolveBookings(bookings, context = {}) {
  const sorted = [...bookings].sort(
    (a, b) => PROVIDER_ORDER.indexOf(a.provider) - PROVIDER_ORDER.indexOf(b.provider)
  );
  return sorted.map((b) => resolveBookingUrl(b, context)).filter((b) => b.url);
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

  const context = { slug, campaign: stepTitle ? 'timeline' : 'planner' };

  const routeBookings = matchedRoute?.bookings?.length
    ? sortAndResolveBookings(matchedRoute.bookings, context)
    : [];

  const fallbackProviders = profile.fallbacks ?? [];
  const fallbacks = fallbackProviders
    .map((provider) =>
      resolveBookingUrl(
        { provider, name: provider === 'klook_ferry' ? 'Klook 페리' : provider },
        context,
      ),
    )
    .filter((b) => b.url && !routeBookings.some((rb) => rb.provider === b.provider));

  const bookings =
    routeBookings.length > 0
      ? routeBookings
      : fallbacks.length > 0
        ? fallbacks
        : [resolveBookingUrl({ provider: 'klook_ferry', name: 'Klook 페리' }, context)].filter(
            (b) => b.url,
          );

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
 * 12Go 배너 라벨 — route/profile override → 노선 label 간소화.
 *
 * @param {{ twelveGoBannerLabel?: string, label?: string } | null | undefined} route
 * @param {{ twelveGoBannerLabel?: string } | null | undefined} profile
 * @returns {string}
 */
export function resolveTwelveGoBannerLabel(route, profile) {
  if (route?.twelveGoBannerLabel) return route.twelveGoBannerLabel;
  if (profile?.twelveGoBannerLabel) return profile.twelveGoBannerLabel;
  const label = route?.label?.trim();
  if (!label) return '페리·교통 검색';
  return label
    .replace(/\([^)]*\)/g, '')
    .replace(/\s*↔\s*/g, ' ↔ ')
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Array<FerryBookingLink & { url: string }>} bookings
 */
export function partitionFerryBookings(bookings) {
  const twelveGo = bookings.find((b) => b.provider === 'twelve_go' && b.url) ?? null;
  const others = bookings.filter((b) => b.provider !== 'twelve_go' && b.url);
  return { twelveGo, others };
}

/**
 * @param {string | null | undefined} slug
 * @returns {boolean}
 */
export function isCruiseOnlyDestination(slug) {
  const profile = resolveFerryProfile(slug);
  return profile?.tier === 'cruise_only';
}
