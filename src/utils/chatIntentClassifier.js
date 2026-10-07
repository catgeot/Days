const ACCESS_ROUTE_PATTERNS = [
  /어떻게\s*가/,
  /가는\s*(?:길|방법|법)/,
  /어떻게\s*가(?:요|나|지)/,
  /how\s*to\s*get/i,
  /how\s*do\s*i\s*get/i,
  /route\s*to/i,
  /교통편/,
  /이동\s*(?:방법|수단)/,
];

/** 입국 심사·증빙 — 「항공」이 있어도 항공권 **예약** intent로 보지 않음 */
const ENTRY_PROOF_PATTERNS = [
  /입국\s*심사/,
  /숙소.*증빙/,
  /항공.*증빙/,
  /증빙.*(?:숙소|항공)/,
  /왕복\s*항공/,
  /예약\s*확인증/,
  /숙박.*(?:확인|증빙)/,
];

const BOOK_FLIGHT_PATTERNS = [
  /항공/,
  /비행/,
  /flight/i,
  /airplane/i,
  /항공편/,
  /비행기/,
];

const BOOK_FERRY_PATTERNS = [
  /페리/,
  /ferry/i,
  /쾌속선/,
  /스피드\s*보트/i,
  /speedboat/i,
  /보트\s*티켓/,
  /배\s*티켓/,
  /(?:에서|→)\s*배(?:\s|$|[?!.])/,
];

const BOOK_TRANSFER_PATTERNS = [
  /픽업/,
  /공항\s*픽/,
  /airport\s*transfer/i,
  /공항\s*셔틀/,
];

const INFO_VISA_PATTERNS = [
  /비자/,
  /visa/i,
  /e-?voa/i,
  /입국/,
  /필수\s*서류/,
  /증빙/,
  /입국\s*심사/,
  /eta/i,
  /uk\s*eta/i,
];

const INFO_FEES_PATTERNS = [
  /관광세/,
  /입국\s*세/,
  /tourist\s*levy/i,
  /lovebali/i,
  /수수료/,
  /환경세/,
];

const BOOK_GENERAL_PATTERNS = [
  /예약\s*(?:방법|하)/,
  /티켓\s*(?:살|사|구매|예약)/,
  /book(?:ing)?/i,
  /reserve/i,
  /12go/i,
  /12\s*go/i,
];

const PLAN_ITINERARY_PATTERNS = [
  /일정\s*(?:짜|만들|추천|잡|계획)/,
  /(?:여행|방문)\s*(?:일정|코스|동선|루트)/,
  /코스\s*추천/,
  /동선\s*(?:짜|추천|잡)/,
  /루트\s*(?:짜|추천|잡)/,
  /\d+\s*박\s*\d*\s*일/,
  /\d+\s*박(?:\s*\d+\s*일)?\s*일정/,
  /숙소.*(?:투어|액티비티)|(?:투어|액티비티).*숙소/,
  /itinerary/i,
  /plan\s+(?:a\s+)?(?:trip|itinerary)/i,
  /suggest\s+(?:a\s+)?(?:route|itinerary)/i,
];

/** @param {string} text */
export function isPlanItineraryIntentText(text) {
  const current = String(text ?? '').toLowerCase();
  return PLAN_ITINERARY_PATTERNS.some((re) => re.test(current));
}

/**
 * @typedef {'access_route'|'book_flight'|'book_ferry'|'book_transfer'|'book_ground'|'book_hotel'|'book_rental'|'info_visa'|'info_fees'|'book_general'|'plan_itinerary'|'none'} ChatIntent
 */

/**
 * @param {string} userText
 * @param {Array<{ role?: string, text?: string }>} [chatHistory]
 * @param {string | null} [slug]
 * @returns {{ primary: ChatIntent, intents: ChatIntent[], confidence: 'high'|'medium'|'low' }}
 */
const BOOKING_SIGNAL_PATTERNS = [
  ...ACCESS_ROUTE_PATTERNS,
  ...BOOK_FERRY_PATTERNS,
  ...BOOK_FLIGHT_PATTERNS,
  ...BOOK_TRANSFER_PATTERNS,
  ...BOOK_GENERAL_PATTERNS,
];

const INFO_ONLY_PATTERNS = /여행|가고\s*싶|추천|소개|정보/;

export function classifyChatIntent(userText, chatHistory = [], slug = null) {
  const current = String(userText ?? '').toLowerCase();

  /** @type {ChatIntent[]} */
  const intents = [];

  const matchAny = (patterns, text) => patterns.some((re) => re.test(text));

  const itineraryIntent = isPlanItineraryIntentText(current);

  // 이번 턴 발화만 — 이전 「어떻게 가」 등이 페리·비자 단독 질문 CTA를 오염시키지 않음
  const isEntryProof = matchAny(ENTRY_PROOF_PATTERNS, current);

  if (itineraryIntent) intents.push('plan_itinerary');
  if (matchAny(ACCESS_ROUTE_PATTERNS, current)) intents.push('access_route');
  if (matchAny(BOOK_FERRY_PATTERNS, current)) intents.push('book_ferry');
  if (!isEntryProof && matchAny(BOOK_FLIGHT_PATTERNS, current)) {
    intents.push('book_flight');
  }
  if (matchAny(BOOK_TRANSFER_PATTERNS, current)) intents.push('book_transfer');
  if (isEntryProof || matchAny(INFO_VISA_PATTERNS, current)) {
    intents.push('info_visa');
  }
  if (matchAny(INFO_FEES_PATTERNS, current)) intents.push('info_fees');
  if (matchAny(BOOK_GENERAL_PATTERNS, current)) intents.push('book_general');

  if (
    INFO_ONLY_PATTERNS.test(current) &&
    !matchAny(BOOKING_SIGNAL_PATTERNS, current) &&
    !itineraryIntent
  ) {
    return {
      primary: 'none',
      intents: ['none'],
      confidence: 'high',
      slug,
    };
  }

  if (intents.length === 0 && INFO_ONLY_PATTERNS.test(current)) {
    intents.push('none');
  }

  const unique = [...new Set(intents)];
  const primary = unique[0] ?? 'none';

  let confidence = 'low';
  if (primary !== 'none' && (itineraryIntent || matchAny(
    [...ACCESS_ROUTE_PATTERNS, ...BOOK_FERRY_PATTERNS, ...BOOK_FLIGHT_PATTERNS, ...BOOK_GENERAL_PATTERNS],
    current
  ))) {
    confidence = 'high';
  } else if (primary !== 'none') {
    confidence = 'medium';
  }

  return { primary, intents: unique.length ? unique : ['none'], confidence, slug };
}

export function shouldShowChatBookingCta(intentResult, userText, chatHistory = []) {
  const { primary, intents } = intentResult;
  if (primary === 'none' && intents.length === 1) {
    return false;
  }
  return intents.some((i) =>
    [
      'access_route',
      'book_flight',
      'book_ferry',
      'book_transfer',
      'book_general',
      'info_visa',
      'info_fees',
      'plan_itinerary',
    ].includes(i)
  );
}

function userTurnText(msg) {
  if (!msg || msg.role !== 'user') return '';
  const raw = typeof msg.text === 'object' ? msg.text?.text : msg.text;
  return String(raw ?? '').trim();
}

/** @param {Array<{ role?: string, text?: string }>} chatHistory */
export function countPriorPlanItineraryTurns(chatHistory = []) {
  let count = 0;
  for (const msg of chatHistory) {
    const text = userTurnText(msg);
    if (text && isPlanItineraryIntentText(text)) count += 1;
  }
  return count;
}

/**
 * 이번 턴 이전 일정 질문 횟수 — chatHistory에 현재 user 발화가 이미 들어간 경로 보정.
 * @param {Array<{ role?: string, text?: string }>} chatHistory
 * @param {string} [userText]
 */
export function countItineraryTurnsBeforeCurrent(chatHistory = [], userText = '') {
  let count = countPriorPlanItineraryTurns(chatHistory);
  const current = String(userText ?? '').trim();
  if (!current || !isPlanItineraryIntentText(current)) return count;
  const last = chatHistory[chatHistory.length - 1];
  if (userTurnText(last) === current) {
    count = Math.max(0, count - 1);
  }
  return count;
}

/** @param {Array<{ role?: string, text?: string }>} chatHistory @param {string} [userText] */
/** @param {{ primary?: string, intents?: string[] }} intentResult */
export function shouldUseQuietCtaForItinerary(intentResult) {
  return (
    intentResult?.primary === 'plan_itinerary' ||
    intentResult?.intents?.includes('plan_itinerary')
  );
}

export function shouldCollapseItineraryBooking(chatHistory = [], userText = '') {
  const current = String(userText ?? '').trim();
  if (!current || !isPlanItineraryIntentText(current)) return false;
  return countItineraryTurnsBeforeCurrent(chatHistory, userText) > 0;
}
