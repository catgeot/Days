import transportData from '../pages/Home/data/travelSpotTransport.json';
import {
  resolveFerryProfile,
  resolveFerryBookings,
  resolveTwelveGoBannerLabel,
  shouldShowFerryCard,
} from './ferryBookingMatch.js';
import { get12GoAffiliateUrl, get12GoHomeUrl } from './affiliate.js';
import { resolveTravelSpotFromLocation } from './travelSpotResolve.js';

const BOOKING_KEYWORDS = [
  '예약',
  '티켓',
  '시간표',
  'book',
  'booking',
  'how to book',
  '어떻게 예약',
  '예약 방법',
  '표 살',
  '표 사',
  '표 구매',
  '승차권',
  '구매',
  'buy ticket',
  'reserve',
];

const TRANSPORT_TYPE_KEYWORDS = {
  ferry: ['페리', 'ferry', '쾌속선', '스피드보트', 'speedboat', '보트', 'boat'],
  bus: ['버스', 'bus', '미니버스', 'minivan', 'van'],
  train: ['기차', 'train', 'rail', '철도', '열차'],
  flight: ['항공', 'flight', '비행', 'fly', '항공편', 'airplane'],
};

/**
 * @param {string} text
 * @param {Array<{ role?: string, text?: string }>} [chatHistory]
 */
export function detectBookingIntent(text, chatHistory = []) {
  const recent = chatHistory.slice(-6).map((m) => m.text ?? '').filter(Boolean);
  const combined = [text, ...recent].join(' ');
  const lower = combined.toLowerCase();

  if (BOOKING_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return true;
  if (/12go|12\s*go|twelve\s*go/i.test(combined)) return true;
  return false;
}

/**
 * @param {string} text
 * @param {Array<{ text?: string }>} [chatHistory]
 * @returns {'ferry' | 'bus' | 'train' | 'flight' | 'general'}
 */
export function detectTransportType(text, chatHistory = []) {
  const recent = chatHistory.slice(-4).map((m) => m.text ?? '').filter(Boolean);
  const combined = [text, ...recent].join(' ').toLowerCase();

  for (const [type, keywords] of Object.entries(TRANSPORT_TYPE_KEYWORDS)) {
    if (keywords.some((k) => combined.includes(k.toLowerCase()))) {
      return type;
    }
  }
  return 'general';
}

/**
 * @param {string | { slug?: string, name?: string, lat?: number, lng?: number } | null | undefined} destination
 * @returns {string | null}
 */
export function resolveSlugFromDestination(destination) {
  if (!destination) return null;
  if (typeof destination === 'object' && destination.slug) {
    return String(destination.slug).trim().toLowerCase();
  }
  const resolved = resolveTravelSpotFromLocation(destination);
  return resolved?.spot?.slug ?? null;
}

/**
 * @param {string} haystack
 * @param {string} needle
 */
function textIncludesPlace(haystack, needle) {
  if (!needle || !haystack) return false;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.includes(n);
}

/**
 * @param {string} combinedText
 * @param {{ id: string, label: string, keywords?: string[] }} route
 */
function routeMatchesText(combinedText, route) {
  const lower = combinedText.toLowerCase();
  if (textIncludesPlace(lower, route.label)) return true;
  for (const kw of route.keywords ?? []) {
    if (textIncludesPlace(lower, kw)) return true;
  }
  if (route.id) {
    const parts = route.id.split('-');
    if (parts.length >= 2 && parts.every((p) => lower.includes(p))) return true;
  }
  return false;
}

/**
 * @param {string | null | undefined} slug
 * @param {string} combinedText
 * @param {{ subIdPrefix: string }} context
 * @returns {Array<{ type: string, label: string, url: string, provider?: string, routeId?: string }>}
 */
function resolveTransportRoutes(slug, combinedText, context) {
  if (!slug) return [];
  const profile = transportData.spots?.[slug];
  if (!profile?.routes?.length) return [];

  const matched = profile.routes.filter((r) => routeMatchesText(combinedText, r));
  const routes = matched.length > 0 ? matched : profile.routes.slice(0, 2);

  return routes
    .filter((r) => r.twelveGoUrl)
    .map((r) => ({
      type: 'twelve_go',
      label: r.label,
      url: get12GoAffiliateUrl(r.twelveGoUrl, {
        subId: `${context.subIdPrefix}-route-${r.id}`,
      }),
      provider: 'twelve_go',
      routeId: r.id,
    }));
}

/**
 * @param {string | null | undefined} slug
 * @param {string} stepTitle
 * @param {{ subIdPrefix: string }} context
 */
function resolveFerryActions(slug, stepTitle, context) {
  if (!slug || !shouldShowFerryCard(slug)) return [];

  const profile = resolveFerryProfile(slug);
  const subId = context.subIdPrefix;
  const { route, bookings } = resolveFerryBookings(slug, stepTitle, {
    campaign: 'chat',
    subId,
  });

  return bookings.map((b) => ({
    type: b.provider === 'twelve_go' ? 'twelve_go' : b.provider,
    label: b.provider === 'twelve_go' ? resolveTwelveGoBannerLabel(route, profile) : b.name,
    url: b.url,
    provider: b.provider,
    routeId: route?.id,
  })).filter((a) => a.url);
}

/**
 * @param {{
 *   userText: string,
 *   destinationName?: string,
 *   slug?: string | null,
 *   location?: object | null,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   chatSource?: 'home' | 'place',
 *   aiReplyText?: string,
 * }} params
 * @returns {{
 *   show: boolean,
 *   transportType: string,
 *   actions: Array<{ type: string, label: string, url: string, provider?: string, routeId?: string }>,
 *   slug: string | null,
 *   plannerUrl: string | null,
 * }}
 */
export function resolveBookingActions({
  userText,
  destinationName = '',
  slug: slugInput = null,
  location = null,
  chatHistory = [],
  chatSource = 'place',
  aiReplyText = '',
}) {
  const slug =
    slugInput ??
    resolveSlugFromDestination(location ?? destinationName) ??
    null;

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

  const userIntent = detectBookingIntent(userText, chatHistory);
  const aiMentions12Go = /12go|12\s*go|twelve\s*go/i.test(aiReplyText);
  const show = userIntent || aiMentions12Go;

  if (!show) {
    return {
      show: false,
      transportType: 'general',
      actions: [],
      slug,
      plannerUrl: slug ? `/place/${slug}?tab=planner` : null,
    };
  }

  const transportType = detectTransportType(combinedText, chatHistory);
  const context = { subIdPrefix };

  let actions = [];

  if (transportType === 'bus' || transportType === 'train') {
    actions = resolveTransportRoutes(slug, combinedText, context);
  }

  if (actions.length === 0 && (transportType === 'ferry' || transportType === 'general')) {
    actions = resolveFerryActions(slug, combinedText, context);
  }

  if (actions.length === 0) {
    actions = resolveTransportRoutes(slug, combinedText, context);
  }

  if (actions.length === 0 && transportType !== 'flight') {
    actions = [
      {
        type: 'twelve_go',
        label: destinationName
          ? `${destinationName} 교통·페리 검색`
          : '12Go 교통·페리 검색',
        url: get12GoHomeUrl({ subId: subIdPrefix }),
        provider: 'twelve_go',
      },
    ];
  }

  const twelveGoFirst = [
    ...actions.filter((a) => a.provider === 'twelve_go'),
    ...actions.filter((a) => a.provider !== 'twelve_go'),
  ];

  return {
    show: true,
    transportType,
    actions: twelveGoFirst.slice(0, 4),
    slug,
    plannerUrl: slug ? `/place/${slug}?tab=planner` : null,
  };
}

/**
 * @param {string} text
 * @param {Array<{ text?: string }>} [chatHistory]
 */
export function shouldUsePlannerPersona(text, chatHistory = []) {
  return detectBookingIntent(text, chatHistory);
}
