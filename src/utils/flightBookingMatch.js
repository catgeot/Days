import flightData from '../pages/Home/data/travelSpotFlightBookings.json';

/** @typedef {'standard'|'segmented'|'carrier-only'|'agency-only'} FlightBookingTier */
/** @typedef {{ provider: string, name: string, originIata?: string, destinationIata: string, url?: string }} FlightOfficialLinkDef */
/** @typedef {{ tier: FlightBookingTier, bookingNote?: string, tripDisclaimer?: string, officialLinks?: FlightOfficialLinkDef[] }} FlightBookingProfile */

const UNITED_SEARCH_BASE = 'https://www.united.com/en/us/fsr/choose-flights';

/** citiesData-only 등 travelSpots 미등록 slug — flight SSOT 키 */
const FLIGHT_BOOKING_SLUG_ALIASES = {
  '마셜 제도': 'marshall-islands',
  마셜제도: 'marshall-islands',
  'marshall islands': 'marshall-islands',
};

function normalizePlaceIdKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * flight-booking SSOT slug — `location.slug` 없을 때 표시명·canonical_slug 폴백.
 *
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @returns {string | null}
 */
export function resolveFlightBookingSlug(locationOrSlug) {
  if (locationOrSlug == null) return null;

  if (typeof locationOrSlug === 'string') {
    const slug = locationOrSlug.trim().toLowerCase();
    if (flightData.spots?.[slug]) return slug;
    return FLIGHT_BOOKING_SLUG_ALIASES[slug] ?? FLIGHT_BOOKING_SLUG_ALIASES[normalizePlaceIdKey(slug)] ?? null;
  }

  const direct = String(locationOrSlug.slug ?? locationOrSlug.canonical_slug ?? '')
    .trim()
    .toLowerCase();
  if (direct && flightData.spots?.[direct]) return direct;

  for (const raw of [locationOrSlug.name, locationOrSlug.name_en, locationOrSlug.name_ko]) {
    if (raw == null || raw === '') continue;
    const key = String(raw).trim();
    const candidates = [key.toLowerCase(), normalizePlaceIdKey(key)];
    for (const candidate of candidates) {
      const aliased = FLIGHT_BOOKING_SLUG_ALIASES[candidate];
      if (aliased && flightData.spots?.[aliased]) return aliased;
    }
  }

  return direct && flightData.spots?.[direct] ? direct : null;
}

/**
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @returns {FlightBookingProfile | null}
 */
export function resolveFlightBookingProfile(locationOrSlug) {
  const slug = resolveFlightBookingSlug(locationOrSlug);
  if (!slug) return null;
  return flightData.spots?.[slug] ?? null;
}

/**
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @returns {FlightBookingTier}
 */
export function resolveFlightBookingTier(locationOrSlug) {
  return resolveFlightBookingProfile(locationOrSlug)?.tier ?? 'standard';
}

/**
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @returns {boolean}
 */
export function shouldShowOfficialFlightBooking(locationOrSlug) {
  const tier = resolveFlightBookingTier(locationOrSlug);
  return tier !== 'standard';
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatUnitedDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * United `/fsr/choose-flights` 딥링크 — 출발·귀국일은 클릭 시점 기준 ~45·~52일 후(주간 스케줄 대응).
 *
 * @param {{ originIata?: string, destinationIata: string, tripType?: 'roundtrip'|'oneway' }} options
 * @returns {string}
 */
export function buildUnitedFlightSearchUrl(options = {}) {
  const origin = String(options.originIata || 'HNL')
    .trim()
    .toUpperCase();
  const destination = String(options.destinationIata || '')
    .trim()
    .toUpperCase();
  if (!destination) return '';

  const depart = new Date();
  depart.setDate(depart.getDate() + 45);
  const ret = new Date(depart);
  ret.setDate(ret.getDate() + 7);

  const params = new URLSearchParams({
    f: origin,
    t: destination,
    d: formatUnitedDate(depart),
    sc: '7',
    px: '1',
    taxng: '1',
    clm: '7',
    st: 'bestmatches',
    newDateOverride: 'true',
  });

  if (options.tripType === 'oneway') {
    params.set('tt', '0');
  } else {
    params.set('r', formatUnitedDate(ret));
    params.set('tt', '1');
  }

  return `${UNITED_SEARCH_BASE}?${params.toString()}`;
}

/**
 * @param {FlightOfficialLinkDef} linkDef
 * @returns {{ name: string, url: string, subtext?: string }}
 */
export function resolveOfficialFlightLink(linkDef) {
  if (linkDef.url) {
    return { name: linkDef.name, url: linkDef.url };
  }

  if (linkDef.provider === 'united') {
    const origin = linkDef.originIata || 'HNL';
    const destination = linkDef.destinationIata;
    const url = buildUnitedFlightSearchUrl({ originIata: origin, destinationIata: destination });
    const subtext = `${origin}→${destination}`;
    return { name: linkDef.name, url, subtext };
  }

  return { name: linkDef.name, url: linkDef.url ?? '' };
}

/**
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @returns {Array<{ name: string, url: string, subtext?: string, provider: string }>}
 */
export function resolveOfficialFlightLinks(locationOrSlug) {
  const slug = resolveFlightBookingSlug(locationOrSlug);
  const profile = slug ? flightData.spots?.[slug] : null;
  if (!profile?.officialLinks?.length) return [];

  return profile.officialLinks
    .map((linkDef) => {
      const resolved = resolveOfficialFlightLink(linkDef);
      if (!resolved.url) return null;
      return { ...resolved, provider: linkDef.provider };
    })
    .filter(Boolean);
}

/**
 * Trip CTA 부제 — tier≠standard 일 때 표시.
 *
 * @param {string | Record<string, unknown> | null | undefined} locationOrSlug
 * @param {{ arrivalIata?: string | null }} [context]
 * @returns {string | null}
 */
export function getFlightTripDisclaimer(locationOrSlug, context = {}) {
  const profile = resolveFlightBookingProfile(locationOrSlug);
  if (!profile || profile.tier === 'standard') return null;
  if (profile.tripDisclaimer) return profile.tripDisclaimer;

  const arrival = context.arrivalIata ? String(context.arrivalIata).trim().toUpperCase() : null;
  if (profile.tier === 'agency-only') {
    return arrival
      ? `Trip.com 검색은 ${arrival}까지입니다. 최종 구간은 아래 안내·현지 에이전시를 확인해 주세요.`
      : 'Trip.com은 국제선 관문까지만 검색됩니다. 최종 구간은 아래 안내를 확인해 주세요.';
  }

  return arrival
    ? `Trip.com 검색은 ${arrival}까지입니다. 최종 구간은 아래 공식 예약 링크를 이용해 주세요.`
    : 'Trip.com은 국제선 관문까지만 검색됩니다. 최종 구간은 아래 공식 예약 링크를 이용해 주세요.';
}
