import {
  canPreviewFlightRoute,
  DEFAULT_FLIGHT_ORIGIN_IATA,
  resolveFlightCinemaOd,
} from './globeFlightCinema.js';

/**
 * ICN→dest flight route facts for external SEO (planner tab).
 * No fares, schedules, or airline names — path·IATA·approx hours only.
 * @see plans/en-seo-followup-plan.md §1.2 flight-route · #14
 */

/** @param {{ originIata: string, destIata: string, hubIatas?: string[], isConnecting?: boolean, flightHours?: number }} od */
function formatRouteArrow(od) {
  const hubs = (od.hubIatas ?? []).filter(Boolean);
  if (!hubs.length) {
    return `${od.originIata}→${od.destIata}`;
  }
  return `${od.originIata}→${hubs.join('·')}→${od.destIata}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {ReturnType<typeof resolveFlightCinemaOd> | null}
 */
export function getPlaceFlightRouteSeoOd(location) {
  if (!canPreviewFlightRoute(location)) return null;
  return resolveFlightCinemaOd(location, { originIata: DEFAULT_FLIGHT_ORIGIN_IATA }) ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} location
 * @param {'ko'|'en'} locale
 * @returns {string | null}
 */
export function getPlaceFlightRouteSeoDescSnippet(location, locale = 'ko') {
  const od = getPlaceFlightRouteSeoOd(location);
  if (!od) return null;

  const hours = Math.round(od.flightHours ?? 0);
  const route = formatRouteArrow(od);
  const hubs = od.hubIatas ?? [];

  if (locale === 'en') {
    const via =
      hubs.length > 0 ? ` via ${hubs.join(', ')}` : od.isConnecting ? '' : ', nonstop';
    const hoursPart = hours > 0 ? ` About ${hours} hours.` : '';
    return `Flight route ${route}${via}.${hoursPart}`.replace(/\.\./g, '.').trim();
  }

  const viaKo = hubs.length > 0 ? ` 경유 ${hubs.join('·')}.` : od.isConnecting ? '.' : ' 직항.';
  const hoursPart = hours > 0 ? ` 약 ${hours}시간.` : '';
  return `인천(${od.originIata})→${od.destIata} 항공 경로.${viaKo}${hoursPart}`.replace(/\.\./g, '.').trim();
}

/**
 * @param {Record<string, unknown> | null | undefined} location
 * @param {'ko'|'en'} locale
 * @param {string} displayName localized place name
 * @returns {string[]}
 */
export function getPlaceFlightRouteSeoKeywords(location, locale = 'ko', displayName = '') {
  const od = getPlaceFlightRouteSeoOd(location);
  if (!od) return [];

  const name = String(displayName || '').trim();
  const { originIata, destIata, isConnecting } = od;
  const routeArrow = formatRouteArrow(od);

  if (locale === 'en') {
    return [
      name && `${name} flights`,
      `${originIata} to ${destIata}`,
      `${originIata} ${destIata}`,
      routeArrow,
      isConnecting ? `${name} connecting flights` : `${name} nonstop flights`,
    ].filter(Boolean);
  }

  return [
    name && `${name} 항공`,
    name && `${name} 항공 경로`,
    name && `${name} 항공편`,
    `인천 ${name}`,
    `서울 ${name}`,
    `${originIata} ${destIata}`,
    routeArrow,
    !isConnecting && name && `${name} 직항`,
    !isConnecting && `서울 ${name} 직항`,
  ].filter(Boolean);
}
