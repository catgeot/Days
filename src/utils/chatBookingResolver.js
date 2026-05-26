import { buildTripcomPlannerFlightUrl, TRIPCOM_DEFAULT_DEPARTURE_AIRPORT } from './affiliate.js';
import {
  classifyChatIntent,
  shouldShowChatBookingCta,
} from './chatIntentClassifier.js';
import {
  getDestinationBookingProfile,
  resolveBookingLegsForIntent,
} from './destinationBookingProfile.js';
import { resolveDepartureIataFromChat } from './resolveDepartureIataFromChat.js';
import {
  resolveBookingActions as resolveLegacyBookingActions,
  resolveFerryActions,
  resolveSlugFromDestination,
} from './bookingIntentResolver.js';
import { resolveChatPrepActions } from './chatPrepBookingLinks.js';
import { buildPlacePlannerPath } from './placePlannerPath.js';

/** Trip URL(`buildTripcomPlannerFlightUrl`)과 동일 SSOT — 출발 미언급 시 ICN */
export function formatChatFlightLabel({ departureIata, arrivalIata, destinationName }) {
  const depart = departureIata || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
  if (arrivalIata) {
    return `${depart} → ${arrivalIata} 항공권`;
  }
  return `${destinationName || '항공권'} 검색`;
}

/**
 * DB/localStorage에 저장된 bookingActions — 항공 라벨만 최신 SSOT로 보정 (재진입·새로고침).
 */
export function refreshStoredBookingActionLabels(
  actions,
  { slug, destinationName = '', chatHistory = [], userText = '' } = {}
) {
  if (!actions?.length) return actions;

  const profile = getDestinationBookingProfile(slug);
  const departureIata = resolveDepartureIataFromChat(userText, chatHistory);
  const arrivalIata = profile.arrivalIata;
  if (!arrivalIata) return actions;

  const nextLabel = formatChatFlightLabel({
    departureIata,
    arrivalIata,
    destinationName,
  });

  return actions.map((action) => {
    if (action.provider !== 'trip_com' || action.type !== 'trip_flight') {
      return action;
    }
    if (action.label === nextLabel) return action;
    return { ...action, label: nextLabel };
  });
}

/**
 * Phase 2a S2 — intent + slug 기반 채팅 CTA (플래너 SSOT 재사용).
 *
 * @param {{
 *   userText: string,
 *   destinationName?: string,
 *   slug?: string | null,
 *   location?: object | null,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   chatSource?: 'home' | 'place',
 *   aiReplyText?: string,
 *   essentialGuide?: object | null,
 * }} params
 */
export function resolveChatBookingActions(params) {
  const {
    userText,
    destinationName = '',
    slug: slugInput = null,
    location = null,
    chatHistory = [],
    chatSource = 'home',
    aiReplyText = '',
    essentialGuide = null,
  } = params;

  const slug =
    slugInput ??
    resolveSlugFromDestination(location ?? destinationName) ??
    null;

  const intentResult = classifyChatIntent(userText, chatHistory, slug);
  const profile = getDestinationBookingProfile(slug);
  const showByIntent = shouldShowChatBookingCta(intentResult, userText, chatHistory);

  if (!slug || !showByIntent) {
    return {
      show: false,
      transportType: 'general',
      actions: [],
      slug,
      plannerUrl: buildPlacePlannerPath(slug),
      intent: intentResult.primary,
    };
  }

  const legs = resolveBookingLegsForIntent(
    intentResult.primary,
    profile,
    intentResult.intents
  );

  /** @type {Array<{ type: string, label: string, url: string, provider?: string, routeId?: string }>} */
  const actions = [];

  const locationPayload = { slug, name: destinationName };
  const departureIata = resolveDepartureIataFromChat(userText, chatHistory);

  if (legs.includes('flight')) {
    const flightUrl = buildTripcomPlannerFlightUrl(locationPayload, {
      essentialGuide,
      tracking: 'chat-flight',
      departureIata,
    });
    if (flightUrl) {
      actions.push({
        type: 'trip_flight',
        label: formatChatFlightLabel({
          departureIata,
          arrivalIata: profile.arrivalIata,
          destinationName,
        }),
        url: flightUrl,
        provider: 'trip_com',
      });
    }
  }

  if (legs.includes('ferry')) {
    const subIdPrefix = slug
      ? chatSource === 'home'
        ? `${slug}-home-chat`
        : `${slug}-chat`
      : chatSource === 'home'
        ? 'gateo-home-chat'
        : 'gateo-chat';
    const combinedText = [
      userText,
      ...chatHistory.slice(-4).map((m) => m.text ?? ''),
      aiReplyText,
    ]
      .filter(Boolean)
      .join(' ');

    const legacy = resolveLegacyBookingActions({
      userText,
      destinationName,
      slug,
      location,
      chatHistory,
      chatSource,
      aiReplyText,
    });
    let ferryActions = legacy.actions.filter(
      (a) => a.provider === 'twelve_go' || a.provider === 'direct'
    );
    if (ferryActions.length === 0) {
      ferryActions = resolveFerryActions(slug, combinedText, { subIdPrefix }).filter(
        (a) => a.provider === 'twelve_go' || a.provider === 'direct'
      );
    }
    actions.push(...ferryActions);
  }

  const prepLegs = legs.filter((leg) =>
    ['transfer', 'visa', 'prep_fees'].includes(leg)
  );
  if (prepLegs.length) {
    const locationPayload =
      location && typeof location === 'object'
        ? location
        : { slug, name: destinationName };
    actions.push(
      ...resolveChatPrepActions({
        legs: prepLegs,
        essentialGuide,
        location: locationPayload,
        destinationName,
      })
    );
  }

  if (actions.length === 0 && intentResult.primary === 'book_general') {
    const legacy = resolveLegacyBookingActions({
      userText,
      destinationName,
      slug,
      location,
      chatHistory,
      chatSource,
      aiReplyText: '',
    });
    return {
      ...legacy,
      show: legacy.actions.length > 0,
      intent: intentResult.primary,
    };
  }

  return {
    show: actions.length > 0,
    transportType: legs.includes('ferry') ? 'ferry' : legs.includes('flight') ? 'flight' : 'general',
    actions: actions.slice(0, 6),
    slug,
    plannerUrl: buildPlacePlannerPath(slug),
    intent: intentResult.primary,
  };
}

export { classifyChatIntent, shouldShowChatBookingCta };
