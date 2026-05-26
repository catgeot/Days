import { buildTripcomPlannerFlightUrl } from './affiliate.js';
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
  resolveSlugFromDestination,
} from './bookingIntentResolver.js';

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
      plannerUrl: slug ? `/place/${slug}?tab=planner` : null,
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
        label: departureIata
          ? `${departureIata} → ${profile.arrivalIata || '도착'} 항공권`
          : `${destinationName || '항공권'} 검색`,
        url: flightUrl,
        provider: 'trip_com',
      });
    }
  }

  if (legs.includes('ferry')) {
    const legacy = resolveLegacyBookingActions({
      userText,
      destinationName,
      slug,
      location,
      chatHistory,
      chatSource,
      aiReplyText: '',
    });
    const ferryActions = legacy.actions.filter((a) => a.provider === 'twelve_go' || a.provider === 'direct');
    actions.push(...ferryActions);
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
    actions: actions.slice(0, 4),
    slug,
    plannerUrl: `/place/${slug}?tab=planner`,
    intent: intentResult.primary,
  };
}

export { classifyChatIntent, shouldShowChatBookingCta };
