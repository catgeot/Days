import {
  clearDomesticAirportDeparture,
  domesticFestivalGroundOrigin,
} from './festivalDomesticOrigins.js';
import { resolveFestivalMooniEventDates } from '../../Korea/lib/festivalMooniContext.js';
import { extractMooniChipPromptFacts } from './mooniChipPrompts.js';
import {
  extractMooniTripFacts,
  mergeMooniTripSession,
} from './mooniTripSession.js';

/** City-origin chips whose rules and facts are airport legs. Domestic festivals remap these. */
const AIRPORT_ORIGIN_CHIPS = new Set([
  'prep_flight',
  'access_origin',
  'from_seoul',
  'from_busan',
  'from_incheon',
]);

const OVERSEAS_CHIP_IDS = new Set([
  'festival_overseas_visa',
  'festival_overseas_flight',
  'festival_overseas_airport',
]);

/**
 * Overseas flight / 인천공항 stays on the air context.
 * A domestic city leg does not, even when the typed sentence resolves to from_seoul.
 */
export function isFestivalOverseasAirPath(chipId, userText) {
  if (OVERSEAS_CHIP_IDS.has(String(chipId || ''))) return true;
  return /인천\s*공항|인천국제공항|incheon airport/i.test(String(userText || ''));
}

function stripDomesticAirFacts(chipFacts) {
  if (!chipFacts) return null;
  const profile = chipFacts.facts?.profile
    ? { ...chipFacts.facts.profile, preTravel: null }
    : null;
  const profileEmpty = !profile
    || (!profile.ferryRequired && !profile.noCarOnIsland && !profile.ferryStep && !profile.preTravel);
  const chipId = AIRPORT_ORIGIN_CHIPS.has(chipFacts.chipId)
    ? 'festival_access'
    : chipFacts.chipId;
  if (profileEmpty) return { chipId, facts: null };
  return { chipId, facts: { profile } };
}

function alignGroundUserText(userText) {
  return String(userText || '').trim();
}

/**
 * Festival mooni_chat body. Domestic city origin drops air, airport, and K-ETA fields.
 * Overseas chips and an 인천공항 ask keep them.
 */
export function prepareFestivalMooniChatPayload({
  baseSession = null,
  festivalContext = false,
  userText = '',
  departureLabel = '',
  chipId = null,
  slug = null,
  destinationName = '',
  chatHistory = [],
  essentialGuide = null,
  locale = 'ko',
}) {
  const cleanText = String(userText || '').trim();
  const nextSession = mergeMooniTripSession(
    baseSession,
    extractMooniTripFacts(cleanText, { destinationName, slug }),
  );
  nextSession.destinationName = destinationName || nextSession.destinationName;
  nextSession.slug = slug || nextSession.slug;

  const overseas = Boolean(festivalContext) && isFestivalOverseasAirPath(chipId, cleanText);
  const groundOrigin = festivalContext && !overseas
    ? domesticFestivalGroundOrigin(cleanText, departureLabel)
    : null;
  if (groundOrigin) clearDomesticAirportDeparture(nextSession);

  let chipFacts = extractMooniChipPromptFacts({
    chipId,
    userText: cleanText,
    slug,
    destinationName,
    chatHistory,
    essentialGuide,
    locale,
    tripSession: nextSession,
  });
  if (groundOrigin) chipFacts = stripDomesticAirFacts(chipFacts);

  return {
    session: nextSession,
    chipFacts,
    modelUserText: alignGroundUserText(cleanText),
    groundOrigin,
  };
}

/** Real chat polish options — SSOT dates and festival fields for `polishFestivalModelReply`. */
export function buildFestivalMooniPolishOptions(festivalContext, extra = {}) {
  const dates = festivalContext ? resolveFestivalMooniEventDates(festivalContext) : {};
  return {
    contentId: festivalContext?.contentId,
    placeName: festivalContext?.hubLabel,
    venue: festivalContext?.venue,
    address: festivalContext?.address,
    stayAreas: festivalContext?.stayAreas,
    lat: festivalContext?.lat,
    lng: festivalContext?.lng,
    festivalTitle: festivalContext?.title,
    nearbyPlaces: festivalContext?.nearbyPlaces,
    nearbyRestaurants: festivalContext?.nearbyRestaurants,
    nearbyParking: festivalContext?.nearbyParking,
    nearbyStays: festivalContext?.nearbyStays,
    homepage: festivalContext?.homepage,
    tel: festivalContext?.tel,
    parking: festivalContext?.parking,
    overview: festivalContext?.sceneOverview || festivalContext?.overview,
    program: festivalContext?.program,
    sceneOverview: festivalContext?.sceneOverview,
    feeText: festivalContext?.feeText,
    timeText: festivalContext?.timeText,
    eventStartDate: dates.eventStartDate,
    eventEndDate: dates.eventEndDate,
    dateLabel: dates.dateLabel,
    transport: festivalContext?.transport ?? null,
    ...extra,
  };
}
