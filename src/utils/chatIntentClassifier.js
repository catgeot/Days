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

const INFO_VISA_PATTERNS = [/비자/, /visa/i, /e-?voa/i, /입국/];

const INFO_FEES_PATTERNS = [/관광세/, /입국\s*세/, /tourist\s*levy/i, /lovebali/i];

const BOOK_GENERAL_PATTERNS = [
  /예약\s*(?:방법|하)/,
  /티켓\s*(?:살|사|구매|예약)/,
  /book(?:ing)?/i,
  /reserve/i,
  /12go/i,
  /12\s*go/i,
];

/**
 * @typedef {'access_route'|'book_flight'|'book_ferry'|'book_transfer'|'book_ground'|'book_hotel'|'book_rental'|'info_visa'|'info_fees'|'book_general'|'none'} ChatIntent
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

  // 이번 턴 발화만 — 이전 「어떻게 가」 등이 페리·비자 단독 질문 CTA를 오염시키지 않음
  if (matchAny(ACCESS_ROUTE_PATTERNS, current)) intents.push('access_route');
  if (matchAny(BOOK_FERRY_PATTERNS, current)) intents.push('book_ferry');
  if (matchAny(BOOK_FLIGHT_PATTERNS, current)) intents.push('book_flight');
  if (matchAny(BOOK_TRANSFER_PATTERNS, current)) intents.push('book_transfer');
  if (matchAny(INFO_VISA_PATTERNS, current)) intents.push('info_visa');
  if (matchAny(INFO_FEES_PATTERNS, current)) intents.push('info_fees');
  if (matchAny(BOOK_GENERAL_PATTERNS, current)) intents.push('book_general');

  if (
    INFO_ONLY_PATTERNS.test(current) &&
    !matchAny(BOOKING_SIGNAL_PATTERNS, current)
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
  if (primary !== 'none' && matchAny(
    [...ACCESS_ROUTE_PATTERNS, ...BOOK_FERRY_PATTERNS, ...BOOK_FLIGHT_PATTERNS, ...BOOK_GENERAL_PATTERNS],
    current
  )) {
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
    ].includes(i)
  );
}
