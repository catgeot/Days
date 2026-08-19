import { getDestinationBookingProfile } from '../../../utils/destinationBookingProfile.js';
import { getPlannerFlightArrivalIata } from '../../../utils/affiliate.js';
import {
  getFlightDestinationSearchHint,
  resolveRentalPickupBannerInfo,
  extractArrivalIataCodesFromEssentialGuide,
} from '../../../utils/rentalAirportMatch.js';
import { resolveDepartureFromChat } from '../../../utils/resolveDepartureIataFromChat.js';
import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';
import { i18n } from '../../../i18n/config';
import { getMooniPromptBundle, fillMooniPromptTemplate } from '../../../i18n/mooniPromptBundles';

/** MOONi L2 칩 id — mooniQuickReplies.js SSOT와 동기화 */
export const MOONI_CHIP_IDS = {
  VISA_DOCS: 'visa_docs',
  PREP_FLIGHT: 'prep_flight',
  PREP_HOTEL: 'prep_hotel',
  PREP_TRANSPORT: 'prep_transport',
  ACCESS_ORIGIN: 'access_origin',
  /** @deprecated 고정 도시 칩 제거 — TEXT_TO_CHIP·구 세션 호환 */
  FROM_SEOUL: 'from_seoul',
  FROM_BUSAN: 'from_busan',
  FROM_INCHEON: 'from_incheon',
  FERRY: 'ferry',
  PLACE_OVERVIEW: 'place_overview',
  SAFETY_VIBE: 'safety_vibe',
  HISTORY: 'history',
  WHY_GO: 'why_go',
  ACTIVITIES: 'activities',
  FOOD: 'food',
  ITINERARY: 'itinerary',
  COMPANION: 'companion',
};

const TEXT_TO_CHIP_KO = [
  { re: /항공권\s*예약을\s*어떻게|항공권\s*예약|항공\s*예약\s*방법/, id: MOONI_CHIP_IDS.PREP_FLIGHT },
  { re: /숙소는\s*어디가\s*좋|숙소\s*추천|숙박\s*지역/, id: MOONI_CHIP_IDS.PREP_HOTEL },
  { re: /현지\s*교통|렌터카|픽업|공항\s*픽/, id: MOONI_CHIP_IDS.PREP_TRANSPORT },
  { re: /비자|입국\s*필수|입국\s*준비|관광세|입국\s*심사|필수\s*서류/, id: MOONI_CHIP_IDS.VISA_DOCS },
  { re: /서울에서\s*어떻게|서울에서\s*가/, id: MOONI_CHIP_IDS.FROM_SEOUL },
  { re: /부산에서\s*어떻게|부산에서\s*가/, id: MOONI_CHIP_IDS.FROM_BUSAN },
  { re: /인천에서\s*어떻게|인천에서\s*가/, id: MOONI_CHIP_IDS.FROM_INCHEON },
  { re: /.+\s*에서\s*어떻게\s*가/, id: MOONI_CHIP_IDS.ACCESS_ORIGIN },
  { re: /페리\s*예약|^페리/, id: MOONI_CHIP_IDS.FERRY },
  { re: /이곳은\s*어떤\s*곳|어떤\s*곳이야/, id: MOONI_CHIP_IDS.PLACE_OVERVIEW },
  { re: /분위기.*치안|치안.*분위기/, id: MOONI_CHIP_IDS.SAFETY_VIBE },
  { re: /역사|문화/, id: MOONI_CHIP_IDS.HISTORY },
  { re: /왜\s*가볼\s*만|가볼\s*만한/, id: MOONI_CHIP_IDS.WHY_GO },
  { re: /액티비티/, id: MOONI_CHIP_IDS.ACTIVITIES },
  { re: /맛집/, id: MOONI_CHIP_IDS.FOOD },
  { re: /2\s*[~\-]\s*3일\s*일정|일정\s*짜/, id: MOONI_CHIP_IDS.ITINERARY },
  { re: /동행별|누구와\s*가/, id: MOONI_CHIP_IDS.COMPANION },
];

const TEXT_TO_CHIP_EN = [
  { re: /how\s+should\s+i\s+book\s+flights?|flight\s+booking|book\s+flights?/i, id: MOONI_CHIP_IDS.PREP_FLIGHT },
  { re: /where\s+should\s+i\s+stay|stay\s+recommend|accommodation|hotel/i, id: MOONI_CHIP_IDS.PREP_HOTEL },
  { re: /local\s+transport|rental\s*car|pickup|airport\s+transfer|get\s+around/i, id: MOONI_CHIP_IDS.PREP_TRANSPORT },
  { re: /visa|entry\s+require|tourist\s+tax|immigration|documents?/i, id: MOONI_CHIP_IDS.VISA_DOCS },
  { re: /from\s+seoul|seoul\s+to/i, id: MOONI_CHIP_IDS.FROM_SEOUL },
  { re: /from\s+busan|busan\s+to/i, id: MOONI_CHIP_IDS.FROM_BUSAN },
  { re: /from\s+incheon|incheon\s+to/i, id: MOONI_CHIP_IDS.FROM_INCHEON },
  { re: /how\s+(?:do\s+)?i\s+get\s+there\s+from\s+.+/i, id: MOONI_CHIP_IDS.ACCESS_ORIGIN },
  { re: /ferry\s+booking|^ferry/i, id: MOONI_CHIP_IDS.FERRY },
  { re: /what\s+kind\s+of\s+place|what\s+is\s+this\s+place/i, id: MOONI_CHIP_IDS.PLACE_OVERVIEW },
  { re: /vibe.*safety|safety.*vibe/i, id: MOONI_CHIP_IDS.SAFETY_VIBE },
  { re: /history|culture/i, id: MOONI_CHIP_IDS.HISTORY },
  { re: /why\s+(?:is\s+)?(?:it\s+)?worth\s+visit|why\s+visit/i, id: MOONI_CHIP_IDS.WHY_GO },
  { re: /activit/i, id: MOONI_CHIP_IDS.ACTIVITIES },
  { re: /restaurant|food|eat/i, id: MOONI_CHIP_IDS.FOOD },
  { re: /2\s*[~\-–]\s*3\s*day|itinerary|plan\s+a/i, id: MOONI_CHIP_IDS.ITINERARY },
  { re: /companion|who\s+is\s+it\s+best\s+for|travel\s+style/i, id: MOONI_CHIP_IDS.COMPANION },
];

function textToChipPatterns() {
  return i18n.language?.startsWith('en')
    ? [...TEXT_TO_CHIP_EN, ...TEXT_TO_CHIP_KO]
    : [...TEXT_TO_CHIP_KO, ...TEXT_TO_CHIP_EN];
}

function hubLabel(iata) {
  const code = String(iata ?? '').trim().toUpperCase();
  if (!code) return null;
  const hub = RENTAL_AIRPORT_HUBS.find((h) => h.iata === code);
  if (!hub) return code;
  if (i18n.language?.startsWith('en')) {
    const enAlias = (hub.aliases || []).find((a) => /^[a-z]/i.test(a) && a.length > 2);
    const name = enAlias ? enAlias.charAt(0).toUpperCase() + enAlias.slice(1) : code;
    return `${name} (${code})`;
  }
  return `${hub.officialKo}(${code})`;
}

function buildLocation(slug, destinationName) {
  const name = String(destinationName ?? '').trim();
  const s = String(slug ?? '').trim().toLowerCase();
  if (!s && !name) return null;
  return { slug: s || undefined, name: name || s };
}

function summarizeJourneyTimeline(essentialGuide) {
  const timeline = essentialGuide?.journey_timeline ?? essentialGuide?.categories?.journey_timeline;
  if (!Array.isArray(timeline) || timeline.length === 0) return null;
  const lines = timeline
    .slice(0, 6)
    .map((step, i) => {
      const title = step?.title ?? step?.name ?? '';
      const desc = step?.description ?? step?.desc ?? '';
      const text = [title, desc].filter(Boolean).join(' — ');
      return text ? `${i + 1}. ${text}` : null;
    })
    .filter(Boolean);
  return lines.length ? lines.join('\n') : null;
}

function buildFlightSsotContext(location, essentialGuide, chatHistory, userText, ssot) {
  if (!location) return [];

  const lines = [];
  const banner = resolveRentalPickupBannerInfo(location, { essentialGuide });
  const arrivalIata = getPlannerFlightArrivalIata(location, { essentialGuide });
  const searchHint = getFlightDestinationSearchHint(location, { essentialGuide });
  const plannerIatas = extractArrivalIataCodesFromEssentialGuide(essentialGuide);
  const departure = resolveDepartureFromChat(userText, chatHistory ?? []);

  if (arrivalIata) {
    lines.push(
      fillMooniPromptTemplate(ssot.arrivalIata, {
        label: hubLabel(arrivalIata) ?? arrivalIata,
      }),
    );
  }
  if (plannerIatas?.length) {
    lines.push(
      fillMooniPromptTemplate(ssot.toolkitIatas, {
        labels: plannerIatas.map((c) => hubLabel(c) ?? c).join(', '),
      }),
    );
  }
  if (searchHint) {
    lines.push(fillMooniPromptTemplate(ssot.flightSearch, { hint: searchHint }));
  }
  if (banner?.bannerNote) {
    lines.push(fillMooniPromptTemplate(ssot.routeNote, { note: banner.bannerNote }));
  }

  const journey = summarizeJourneyTimeline(essentialGuide);
  if (journey) {
    lines.push(fillMooniPromptTemplate(ssot.journeyTimeline, { timeline: journey }));
  }

  const flightAdvice =
    essentialGuide?.categories?.flight?.advice ?? essentialGuide?.flight?.advice ?? null;
  if (typeof flightAdvice === 'string' && flightAdvice.trim()) {
    lines.push(
      fillMooniPromptTemplate(ssot.flightAdvice, {
        advice: flightAdvice.trim().slice(0, 400),
      }),
    );
  }

  if (departure?.iata) {
    lines.push(
      fillMooniPromptTemplate(ssot.departureKnown, {
        label: hubLabel(departure.iata) ?? departure.iata,
        extra: departure.label ? ` (${departure.label})` : '',
      }),
    );
  } else {
    lines.push(ssot.departureDefault);
  }

  return lines;
}

function buildProfileContext(slug, essentialGuide, ssot) {
  const profile = getDestinationBookingProfile(slug);
  const lines = [];
  if (profile.ferryRequired) {
    lines.push(ssot.ferryRequired);
  }
  if (profile.noCarOnIsland) {
    lines.push(ssot.noCarOnIsland);
  }
  if (profile.defaultFerryStep) {
    lines.push(fillMooniPromptTemplate(ssot.ferryStep, { step: profile.defaultFerryStep }));
  }
  const preTravel = essentialGuide?.categories?.pre_travel;
  if (Array.isArray(preTravel) && preTravel.length > 0) {
    const titles = preTravel
      .map((item) => item?.title)
      .filter(Boolean)
      .slice(0, 4);
    if (titles.length) {
      lines.push(fillMooniPromptTemplate(ssot.preTravel, { titles: titles.join(', ') }));
    }
  }
  return lines;
}

/**
 * chipId 또는 userText로 MOONi 주제 칩 id를 해석한다.
 *
 * @param {{ chipId?: string | null, userText?: string }} params
 * @returns {string | null}
 */
export function resolveMooniChipId({ chipId = null, userText = '' }) {
  const id = String(chipId ?? '').trim();
  const bundle = getMooniPromptBundle();
  if (id && bundle.chips[id]) return id;

  const t = String(userText ?? '');
  for (const { re, id: mappedId } of textToChipPatterns()) {
    if (re.test(t)) return mappedId;
  }
  return null;
}

/**
 * MOONi 칩·발화별 system prompt 보조 지시 — getSystemPrompt에 append.
 *
 * @param {{
 *   chipId?: string | null,
 *   userText?: string,
 *   slug?: string | null,
 *   destinationName?: string,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   essentialGuide?: Record<string, unknown> | null,
 *   locale?: string,
 * }} params
 * @returns {string}
 */
export function getMooniChipPromptHint({
  chipId = null,
  userText = '',
  slug = null,
  destinationName = '',
  chatHistory = [],
  essentialGuide = null,
  locale,
}) {
  const bundle = getMooniPromptBundle(locale);
  const resolvedChipId = resolveMooniChipId({ chipId, userText });
  if (!resolvedChipId) return '';

  const guide = bundle.chips[resolvedChipId];
  if (!guide) return '';

  const location = buildLocation(slug, destinationName);
  const lines = [
    '',
    fillMooniPromptTemplate(bundle.chipTopicHeader, { title: guide.title }),
    bundle.chipPriority,
    ...guide.rules.map((r) => `- ${r}`),
  ];

  const ssot = bundle.ssot;
  const ssotLines = [];
  if (
    resolvedChipId === MOONI_CHIP_IDS.PREP_FLIGHT ||
    resolvedChipId === MOONI_CHIP_IDS.ACCESS_ORIGIN ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_SEOUL ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_BUSAN ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_INCHEON ||
    resolvedChipId === MOONI_CHIP_IDS.FERRY
  ) {
    ssotLines.push(...buildFlightSsotContext(location, essentialGuide, chatHistory, userText, ssot));
    ssotLines.push(...buildProfileContext(slug, essentialGuide, ssot));
  } else if (
    resolvedChipId === MOONI_CHIP_IDS.PREP_TRANSPORT ||
    resolvedChipId === MOONI_CHIP_IDS.PREP_HOTEL ||
    resolvedChipId === MOONI_CHIP_IDS.VISA_DOCS
  ) {
    ssotLines.push(...buildProfileContext(slug, essentialGuide, ssot));
    if (resolvedChipId === MOONI_CHIP_IDS.PREP_TRANSPORT && location) {
      const arrivalIata = getPlannerFlightArrivalIata(location, { essentialGuide });
      if (arrivalIata) {
        ssotLines.push(
          fillMooniPromptTemplate(ssot.arrivalAirport, {
            label: hubLabel(arrivalIata) ?? arrivalIata,
          }),
        );
      }
    }
  }

  if (ssotLines.length > 0) {
    lines.push('', bundle.ssotHeader, ...ssotLines);
  }

  return lines.join('\n');
}
