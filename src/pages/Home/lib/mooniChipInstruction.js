/**
 * Chip send-text is a model instruction. It must never be interpolated into a
 * user-visible festival search template (region / window / «겹치는 행사» sentence).
 */

export const FESTIVAL_CHIP_BUBBLES = [
  {
    sendKo: '이 축제에서 볼 수 있는 것과 현장 분위기를 알려줘. 확인된 프로그램과 시간만 말하고, 데이터에 없는 붐비는 시간은 지어내지 마.',
    sendEn: 'What can I actually see and do at this festival, and what is the on-site feel? Use only confirmed programs and hours. Do not invent crowd times.',
    bubbleKo: '볼거리·분위기 알려 줘',
    bubbleEn: 'Tell me the sights and atmosphere',
  },
  {
    sendKo: '축제장 근처에서 먹을 곳과 함께 들를 곳을 알려줘. 먹을 곳은 GATEO 주변 맛집 목록만 말하고, 생활문화센터·복지·목욕·터널은 넣지 마. 없는 맛집은 지어내지 마.',
    sendEn: 'What can I eat and where else can I stop near this festival? For food, use only the nearby restaurant list on this festival page. Do not mention community centers, welfare centers, bathhouses, or tunnels. Do not invent restaurants.',
    bubbleKo: '근처 먹고 둘러볼 곳 알려 줘',
    bubbleEn: 'What to eat and where to stop nearby',
  },
  {
    sendKo: '이 축제를 넣어 하루 동선을 짜줘. 확인된 일정과 장소만 쓰고, 없는 프로그램은 지어내지 마.',
    sendEn: 'Plan a one-day route that includes this festival. Use only confirmed dates and places. Do not invent programs.',
    bubbleKo: '하루 동선 짜 줘',
    bubbleEn: 'Plan a one-day route',
  },
  {
    sendKo: '이 축제에 오려면 입국과 비자, 준비 서류를 알려줘. 확인되지 않은 면제나 금액은 단정하지 마.',
    sendEn: 'What entry, visa, and documents do I need for this festival? Do not assert exemptions or fees that are not confirmed.',
    bubbleKo: '입국·비자 알려 줘',
    bubbleEn: 'Tell me about entry and visas',
  },
  {
    sendKo: '이 축제에 오는 항공권은 GATEO 화면의 항공권 검색으로 어떻게 찾는지 알려줘. 링크 없는 외부 사이트로 보내지 마.',
    sendEn: 'How do I find flights for this festival using GATEO\'s on-screen flight search? Do not send me to an outside site without a link.',
    bubbleKo: '항공권 찾는 법 알려 줘',
    bubbleEn: 'How do I find flights',
  },
  {
    sendKo: '공항에서 이 축제장까지 가는 법을 알려줘. 확인되지 않은 셔틀은 말하지 마.',
    sendEn: 'How do I get from the airport to this festival? Use airport codes. Do not invent shuttles.',
    bubbleKo: '공항에서 축제장까지 알려 줘',
    bubbleEn: 'How do I get from the airport',
  },
];

/** Place / home L2 send texts. These are the visible ask, not a hidden prompt. */
const PLACE_CHIP_SENDS = [
  '이곳은 어떤 곳이야?',
  '분위기와 치안은 어때?',
  '역사나 문화적으로 특징이 뭐야?',
  '왜 가볼 만한 여행지야?',
  '페리 예약',
  '비자, 입국 필수 준비 사항을 설명해줘',
  '항공권 예약을 어떻게 해야 하지?',
  '여행지의 숙소는 어디가 좋을까?',
  '현지 교통은 어떻게 이용하는 것이 좋을까?',
  '추천 액티비티 알려줘',
  '맛집 추천해줘',
  '무리 없는 추천 일정과 동선 짜줘',
  '누구와 가기 좋아? 동행별 추천해줘',
  '따뜻한 휴양지 추천해줘',
  '2박 3일 힐링 코스 추천해줘',
  '비행시간 5시간 이내 여행지 추천해줘',
  '가족과 함께 가기 좋은 여행지 추천해줘',
  'What kind of place is this?',
  "What's the vibe and safety like?",
  "What's special historically or culturally?",
  'Why is this worth visiting?',
  'Ferry booking',
  'Explain visa and entry requirements',
  'How should I book flights?',
  'Where should I stay?',
  'How should I get around locally?',
  'Suggest activities',
  'Recommend restaurants',
  'Plan a realistic and flexible itinerary',
  'Who is it best for? Suggest by companion type',
];

const CHIP_IDS_NOT_FESTIVAL_SEARCH = new Set([
  'festival_sights',
  'festival_access',
  'festival_nearby',
  'festival_day',
  'festival_overseas_visa',
  'festival_overseas_flight',
  'festival_overseas_airport',
  'place_overview',
  'safety_vibe',
  'history',
  'why_go',
  'activities',
  'food',
  'itinerary',
  'companion',
  'visa_docs',
  'prep_flight',
  'prep_hotel',
  'prep_transport',
  'ferry',
  'access_origin',
  'from_seoul',
  'from_busan',
  'from_incheon',
  'warm_resort',
  'healing_weekend',
  'short_flight',
  'family_trip',
]);

const FESTIVAL_ACCESS_ASK_RE = /에서\s*이\s*축제장까지\s*대중교통|to this festival by public transit/i;

const FRAGMENT_RES = [
  /지어\s*내지\s*마/,
  /데이터에\s*없는/,
  /확인된\s*프로그램과\s*시간만/,
  /시간만\s*말하고/,
  /없는\s*(?:맛집|프로그램)은\s*지어/,
  /확인되지\s*않은\s*(?:면제|셔틀)/,
  /링크\s*없는\s*외부/,
  /GATEO\s*주변\s*맛집\s*목록만/,
  /생활문화센터·복지·목욕·터널은\s*넣지/,
  /넣지\s*마/,
  /단정하지\s*마/,
  /말하지\s*마/,
  /do not invent/i,
  /use only confirmed/i,
  /do not assert/i,
  /do not mention community/i,
  /do not send me to an outside/i,
  /on-site feel/i,
];

const EXACT_SENDS = new Set(
  [
    ...FESTIVAL_CHIP_BUBBLES.flatMap((row) => [row.sendKo, row.sendEn]),
    ...PLACE_CHIP_SENDS,
  ].map((text) => compact(text)),
);

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function mooniFestivalChipSendTexts() {
  return FESTIVAL_CHIP_BUBBLES.flatMap((row) => [row.sendKo, row.sendEn]);
}

export function mooniPlaceChipSendTexts() {
  return [...PLACE_CHIP_SENDS];
}

/** Imperative chip/prompt wording that must not appear in a user-facing sentence. */
export function isMooniInstructionFragment(text) {
  const raw = String(text || '');
  if (!raw.trim()) return false;
  return FRAGMENT_RES.some((re) => re.test(raw));
}

/**
 * Festival content chips, place chips, and their send strings are not
 * "which festivals overlap this window" searches.
 * @param {string} userText
 * @param {string} [chipId]
 */
export function isMooniChipInstructionTurn(userText, chipId = '') {
  const id = String(chipId || '').trim();
  if (CHIP_IDS_NOT_FESTIVAL_SEARCH.has(id)) return true;
  const text = compact(userText);
  if (!text) return false;
  if (EXACT_SENDS.has(text)) return true;
  if (FESTIVAL_ACCESS_ASK_RE.test(text)) return true;
  return isMooniInstructionFragment(text);
}

/**
 * 18 in a row, or the whole sentence (16+) is itself a slice of an instruction.
 * "Confirmed programs include …" shares only 17 characters with "confirmed programs and".
 */
const LEAK_SPAN_MIN = 18;
const LEAK_SENTENCE_MIN = 16;

const EXTRA_INSTRUCTION_SPANS = [
  '에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
  'to this festival by public transit and by car',
];

function normalizedLeakKey(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

let leakSpanCache = null;

function instructionLeakSpans() {
  if (leakSpanCache) return leakSpanCache;
  const spans = [];
  for (const raw of [...mooniFestivalChipSendTexts(), ...EXTRA_INSTRUCTION_SPANS]) {
    const key = normalizedLeakKey(raw);
    if (key.length >= LEAK_SENTENCE_MIN) spans.push(key);
  }
  leakSpanCache = spans;
  return spans;
}

/**
 * @param {string} sentence
 */
export function replySentenceLeaksChipInstruction(sentence) {
  const key = normalizedLeakKey(sentence);
  if (key.length < LEAK_SENTENCE_MIN) return false;
  for (const span of instructionLeakSpans()) {
    if (span.includes(key)) return true;
    if (key.length < LEAK_SPAN_MIN || span.length < LEAK_SPAN_MIN) continue;
    const last = span.length - LEAK_SPAN_MIN;
    for (let i = 0; i <= last; i += 1) {
      if (key.includes(span.slice(i, i + LEAK_SPAN_MIN))) return true;
    }
  }
  return false;
}

/**
 * @param {string} place
 * @param {string} [fallback]
 */
export function scrubMooniFestivalTemplatePlace(place, fallback = '') {
  const text = compact(place);
  const fb = compact(fallback);
  const safeFb = fb && !isMooniInstructionFragment(fb) && !EXACT_SENDS.has(fb) ? fb : '';
  if (!text || isMooniInstructionFragment(text) || EXACT_SENDS.has(text) || FESTIVAL_ACCESS_ASK_RE.test(text)) {
    return safeFb;
  }
  return text;
}
