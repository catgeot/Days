import {
  buildTripcomPlannerFlightUrl,
  getKlookAffiliateUrl,
  getKlookSearchUrl,
  getMrtAccommodationSearchUrl,
  getMrtSearchUrl,
  getPlannerFlightArrivalIata,
  TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
} from './affiliate.js';
import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import {
  canShowMrtStayStrip,
  isMrtDomesticLocation,
  resolveMrtStayQuery,
} from './mrtStayQuery.js';
import { canShowMrtTnaStrip, resolveMrtTnaQuery } from './mrtTnaQuery.js';
import { resolveTravelSpotFromLocation } from './travelSpotResolve.js';
import { CHAT_KLOOK_AIRPORT_TRANSFER_URL } from './chatPrepBookingLinks.js';
import { getDestinationBookingProfile } from './destinationBookingProfile.js';
import { resolveDepartureFromChat } from './resolveDepartureIataFromChat.js';
import { i18n } from '../i18n/config.js';
import { extractItineraryStayDates } from './chatItineraryDates.js';

export { extractItineraryStayDates } from './chatItineraryDates.js';

const HUB_BY_IATA = new Map(
  RENTAL_AIRPORT_HUBS.map((hub) => [hub.iata.toUpperCase(), hub.officialKo]),
);

function lookupAirportKo(iata) {
  const code = String(iata ?? '').trim().toUpperCase();
  if (code.length !== 3) return null;
  return HUB_BY_IATA.get(code) ?? null;
}

function formatFlightCtaLabel(destinationName) {
  const place =
    String(destinationName ?? '').trim() ||
    i18n.t('mooni.planner.destinationFallback');
  return i18n.t('mooni.planner.flightBooking', { place });
}

function formatFlightRouteHint({ departureIata, arrivalIata, destinationName }) {
  const depart = String(departureIata || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT)
    .trim()
    .toUpperCase();
  const arrive = arrivalIata ? String(arrivalIata).trim().toUpperCase() : null;
  const locale = i18n.language?.slice?.(0, 2) ?? i18n.language;
  if (arrive) {
    if (locale === 'en') {
      return i18n.t('mooni.booking.flightRouteSearchIata', { depart, arrive });
    }
    const departKo = lookupAirportKo(depart);
    const arriveKo = lookupAirportKo(arrive);
    if (departKo && arriveKo) {
      return i18n.t('mooni.booking.flightRouteSearch', {
        departName: departKo,
        depart,
        arriveName: arriveKo,
        arrive,
      });
    }
    return i18n.t('mooni.booking.flightRouteSearchIata', { depart, arrive });
  }
  const place =
    String(destinationName ?? '').trim() ||
    i18n.t('mooni.planner.destinationFallback');
  return i18n.t('mooni.booking.flightSearchPlace', { place });
}

function resolveArrivalIata({ slug, destinationName, essentialGuide, profile }) {
  const resolvedProfile = profile ?? getDestinationBookingProfile(slug);
  const location = slug ? { slug, name: destinationName || slug } : null;
  return (
    getPlannerFlightArrivalIata(location, { essentialGuide }) ||
    resolvedProfile.arrivalIata ||
    null
  );
}

export function resolveItineraryLocation(slug, destinationName = '') {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return null;
  const resolved = resolveTravelSpotFromLocation({
    slug: key,
    name: destinationName || key,
  });
  const spot = resolved?.spot;
  if (!spot) return null;
  return {
    slug: spot.slug,
    name: spot.name || destinationName,
    name_en: spot.name_en,
    name_ko: spot.name,
    country: spot.country,
    country_en: spot.country_en,
  };
}

function buildStayAction(location, dateOpts) {
  if (!canShowMrtStayStrip(location)) return null;
  const { keyword } = resolveMrtStayQuery(location);
  if (!keyword) return null;
  const isDomestic = isMrtDomesticLocation(location);
  const place = location.name || keyword;
  let url = null;
  if (dateOpts.checkIn && dateOpts.checkOut) {
    url = getMrtAccommodationSearchUrl(keyword, {
      isDomestic,
      checkIn: dateOpts.checkIn,
      checkOut: dateOpts.checkOut,
    });
  } else {
    url = getMrtSearchUrl(`${keyword} 숙소`);
  }
  if (!url) return null;
  return {
    type: 'mrt_stay',
    label: i18n.t('mooni.booking.itineraryStay', { place, defaultValue: `${place} 숙소` }),
    url,
    provider: 'mrt_lodging',
    handoffKind: 'lodging',
  };
}

function buildTourAction(location) {
  const place = location.name || location.slug;
  const isDomestic = isMrtDomesticLocation(location);
  if (isDomestic && canShowMrtTnaStrip(location)) {
    const { keyword } = resolveMrtTnaQuery(location);
    const q = keyword || place;
    const url = getMrtSearchUrl(q);
    if (!url) return null;
    return {
      type: 'mrt_tour',
      label: i18n.t('mooni.booking.itineraryTour', { place, defaultValue: `${place} 투어·액티비티` }),
      url,
      provider: 'mrt_tour',
      handoffKind: 'tour',
    };
  }
  const locale = i18n.language?.slice?.(0, 2) ?? 'ko';
  const url = getKlookSearchUrl(place, locale);
  if (!url) return null;
  return {
    type: 'klook_tour',
    label: i18n.t('mooni.booking.itineraryTour', { place, defaultValue: `${place} 투어·액티비티` }),
    url,
    provider: 'klook_tour',
    handoffKind: 'tour',
  };
}

/**
 * @param {{
 *   slug: string,
 *   destinationName?: string,
 *   userText?: string,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   essentialGuide?: object | null,
 *   tripSession?: object | null,
 * }} params
 */
export function resolveItineraryBookingActions(params) {
  const {
    slug,
    destinationName = '',
    userText = '',
    chatHistory = [],
    essentialGuide = null,
    tripSession = null,
  } = params;

  const location = resolveItineraryLocation(slug, destinationName);
  if (!location) {
    return { actions: [], compact: false };
  }

  const profile = getDestinationBookingProfile(slug);
  const dateOpts = extractItineraryStayDates(userText, tripSession || {});
  const locationPayload = { slug: location.slug, name: location.name };
  const arrivalIata = resolveArrivalIata({
    slug,
    destinationName: location.name,
    essentialGuide,
    profile,
  });
  const departureIata = resolveDepartureFromChat(userText, chatHistory, {
    excludeIata: arrivalIata,
  })?.iata;

  /** @type {Array<object>} */
  const actions = [];

  const stay = buildStayAction(location, dateOpts);
  if (stay) actions.push(stay);

  if (arrivalIata) {
    const flightUrl = buildTripcomPlannerFlightUrl(locationPayload, {
      essentialGuide,
      tracking: 'chat-flight',
      departureIata,
    });
    if (flightUrl) {
      actions.push({
        type: 'trip_flight',
        label: formatFlightCtaLabel(location.name),
        url: flightUrl,
        provider: 'trip_com',
        openFlightWidget: true,
        departureIata,
        routeHint: formatFlightRouteHint({
          departureIata,
          arrivalIata,
          destinationName: location.name,
        }),
      });
    }
  }

  const tour = buildTourAction(location);
  if (tour) actions.push(tour);

  if (arrivalIata) {
    const pickupUrl = getKlookAffiliateUrl(CHAT_KLOOK_AIRPORT_TRANSFER_URL);
    if (pickupUrl) {
      actions.push({
        type: 'klook_transfer',
        label: i18n.t('mooni.booking.itineraryPickup', {
          place: location.name,
          defaultValue: `${location.name} 공항 픽업`,
        }),
        url: pickupUrl,
        provider: 'klook_tour',
        handoffKind: 'tour',
      });
    }
  }

  return { actions: actions.slice(0, 4), compact: false };
}
