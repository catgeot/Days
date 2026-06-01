import { getDestinationBookingProfile } from '../../../utils/destinationBookingProfile.js';
import { getPlannerFlightArrivalIata } from '../../../utils/affiliate.js';
import {
  getFlightDestinationSearchHint,
  resolveRentalPickupBannerInfo,
  extractArrivalIataCodesFromEssentialGuide,
} from '../../../utils/rentalAirportMatch.js';
import { resolveDepartureFromChat } from '../../../utils/resolveDepartureIataFromChat.js';
import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';

/** MOONi L2 칩 id — mooniQuickReplies.js SSOT와 동기화 */
export const MOONI_CHIP_IDS = {
  VISA_DOCS: 'visa_docs',
  PREP_FLIGHT: 'prep_flight',
  PREP_HOTEL: 'prep_hotel',
  PREP_TRANSPORT: 'prep_transport',
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

/**
 * 칩별 답변 지침 — 플래너·버튼만 안내하는 패턴을 막고 주제별 깊이를 분리 관리.
 * @type {Record<string, { title: string, rules: string[] }>}
 */
const MOONI_CHIP_ANSWER_GUIDES = {
  [MOONI_CHIP_IDS.PREP_FLIGHT]: {
    title: '항공권 예약',
    rules: [
      '플래너·버튼만 안내하고 끝내지 말 것. 본문은 **실질적인 항공권 예약 가이드**여야 한다.',
      '아래 [GATEO 여행지 데이터]가 있으면 반드시 반영하고, 없으면 해당 여행지에 맞는 일반적 패턴으로 보완한다.',
      '다음 항목을 **가능한 범위에서 모두** 다룬다 (모를 때는 「시기·노선에 따라 다르므로 확인 권장」으로 처리, 구체 요금·운항 단정 금지):',
      '  1) **최종 도착 공항** — 공식명·IATA 3자리 코드. 검색 시 이 코드를 도착지로 입력하라고 안내.',
      '  2) **한국(또는 사용자 출발지)에서 가는 일반 경로** — 직항 여부, 대표 환승지(유럽·미국·중동·동남아 등), 대략적 소요·경유 횟수.',
      '  3) **환승·입국 비자** — 경유국·입국(트랜짓) 시 ESTA·쉥겐·transit visa 등 필요 여부를 **단정하지 말고** 확인·준비를 권고.',
      '  4) **요금·시기** — 성수기·비수기·주말·연휴·학교 방학 등 요금이 오르는 시기, 변동 요인.',
      '  5) **예약 팁** — 조기 예약·유연한 날짜·경유 vs 직항·오픈 jaw·환불 규정 확인 등 실용 팁 2~3가지.',
      '  6) **출발 공항 도착 시간** — 국제선 체크인·보안·환승 여유(직항 2~3시간 전, 경유 시 더 여유 등).',
      '  7) **도착 공항 현지 정보** — 규모·입국 심사·세관·픽업·대중교통·ATM·시차 등 여행자에게 유용한 참고.',
      '마지막 **1~2문장**만 답변 아래 「교통 · 티켓」·플래너·헤더 「플래너 보기」로 연결한다. 항공은 Trip.com **직접 링크가 아니라 검색 위젯**으로 열린다고 안내한다. 본문 대부분을 UI 안내로 채우지 않는다.',
    ],
  },
  [MOONI_CHIP_IDS.VISA_DOCS]: {
    title: '비자·입국·서류',
    rules: [
      '입국·비자·증빙 서류를 **항목별로** 짧게 나열한다 (비자 면제/필요, 여권 유효기간, 왕복 항공·숙소 확인증, 보험, 관광세 등).',
      '금액·면제 여부·최신 규정을 **단정하지 말고** 공식·플래너에서 확인하라고 안내한다.',
      '항공권 예약 방법을 대신 설명하지 않는다.',
      '마지막 1문장으로 「출발 전 준비」·플래너 비자 섹션을 언급할 수 있다.',
    ],
  },
  [MOONI_CHIP_IDS.PREP_HOTEL]: {
    title: '숙소',
    rules: [
      '추천 **숙박 지역·동네** 2~4곳과 각각의 장단점(교통·치안·가격대·동선)을 설명한다.',
      '입국 증빙용 숙소 예약 확인서·취소 규정·성수기 예약 시기를 짧게 언급한다.',
      '구체 호텔명·가격을 단정하지 않는다.',
      '마지막 1문장으로 플래너 「숙박 지역 추천」·숙소 검색 버튼을 안내할 수 있다.',
    ],
  },
  [MOONI_CHIP_IDS.PREP_TRANSPORT]: {
    title: '현지 교통·픽업',
    rules: [
      '공항→시내·관광지 이동 수단(택시·버스·셔틀·렌터카·페리 등)과 **현지에서 쓰기 좋은 교통**을 구분해 설명한다.',
      '렌터카 필요 여부·좌측/우측 통행·유류·주차·앱(그랩 등)을 해당 여행지에 맞게 언급한다.',
      '섬·도심 등 **차량 제한**이 있으면 명시한다.',
      '마지막 1~2문장으로 플래너 「공항→목적지 이동」·「교통·패스」 카드(답변 아래 cyan·회색 버튼 2개)를 안내할 수 있다.',
    ],
  },
  [MOONI_CHIP_IDS.FROM_SEOUL]: {
    title: '서울에서 가는 방법',
    rules: [
      '출발지 **서울(인천 ICN·김포 GMP)** 기준으로 목적지까지의 **실제 경로**를 단계별로 설명한다.',
      '항공·페리·기차·버스 등 수단별 장단점·환승·소요·주의사항을 포함한다.',
      '페리가 필요한 여행지면 항공 후 페리 구간을 명시한다.',
      '마지막 1~2문장으로 「교통 · 티켓」·플래너를 연결한다.',
    ],
  },
  [MOONI_CHIP_IDS.FROM_BUSAN]: {
    title: '부산에서 가는 방법',
    rules: [
      '출발지 **부산(PUS)** 기준 경로·환승·국내선 연결을 설명한다.',
      '부산 직항이 없을 때 서울·다른 허브 경유 패턴을 안내한다.',
      '마지막 1~2문장으로 「교통 · 티켓」·플래너를 연결한다.',
    ],
  },
  [MOONI_CHIP_IDS.FROM_INCHEON]: {
    title: '인천에서 가는 방법',
    rules: [
      '출발지 **인천(ICN)** 기준 경로·환승을 설명한다.',
      '마지막 1~2문장으로 「교통 · 티켓」·플래너를 연결한다.',
    ],
  },
  [MOONI_CHIP_IDS.FERRY]: {
    title: '페리·배',
    rules: [
      '해당 여행지에 필요한 **페리 구간·항구·운항 시즌·예약 채널(12Go 등)** 을 설명한다.',
      '항공과의 연결(어느 공항 도착 후 어느 항구)을 명시한다.',
      '운항·요금·시간을 단정하지 않는다.',
      '마지막 1문장으로 「교통 · 티켓」 페리 버튼을 안내할 수 있다.',
    ],
  },
  [MOONI_CHIP_IDS.PLACE_OVERVIEW]: {
    title: '여행지 개요',
    rules: [
      '지리·분위기·대표 이미지·누구에게 맞는지를 **감성과 사실**을 섞어 3~5문단으로 설명한다.',
      '예약·플래너 안내는 마지막 1문장 이하로만.',
    ],
  },
  [MOONI_CHIP_IDS.SAFETY_VIBE]: {
    title: '분위기·치안',
    rules: [
      '치안·분위기·계절감·야간·동행별 느낌을 구체적으로 설명한다.',
      '과장·단정적 경고는 피하고, 확인이 필요한 부분은 「현지·공식 정보 확인」으로 처리한다.',
    ],
  },
  [MOONI_CHIP_IDS.HISTORY]: {
    title: '역사·문화',
    rules: ['역사·문화적 특징을 여행자 관점에서 흥미롭게 설명한다.', '예약 안내는 하지 않는다.'],
  },
  [MOONI_CHIP_IDS.WHY_GO]: {
    title: '방문 이유',
    rules: ['왜 가볼 만한지 매력·차별점을 설득력 있게 설명한다.', '예약 안내는 마지막 1문장 이하로만.'],
  },
  [MOONI_CHIP_IDS.ACTIVITIES]: {
    title: '액티비티',
    rules: [
      '대표 액티비티·체험 3~6가지와 소요·준비물·예약 필요 여부를 설명한다.',
      '마지막 1문장으로 플래너·지도 POI를 언급할 수 있다.',
    ],
  },
  [MOONI_CHIP_IDS.FOOD]: {
    title: '맛집',
    rules: [
      '현지 음식·대표 메뉴·식당가·식습관 팁을 설명한다.',
      '구체 상호·가격 단정 금지.',
    ],
  },
  [MOONI_CHIP_IDS.ITINERARY]: {
    title: '2~3일 일정',
    rules: [
      '2~3일 **동선 중심 일정**을 아침~저녁 또는 Day1/Day2 형식으로 제안한다.',
      '이동·휴식·예약 필요 항목을 포함한다.',
    ],
  },
  [MOONI_CHIP_IDS.COMPANION]: {
    title: '동행별 추천',
    rules: ['커플·가족·친구·솔로·시니어 등 동행 유형별 추천·주의를 설명한다.'],
  },
};

/** chipId 없을 때 userText로 prep·access 칩 추론 */
const TEXT_TO_CHIP = [
  { re: /항공권\s*예약을\s*어떻게|항공권\s*예약|항공\s*예약\s*방법/, id: MOONI_CHIP_IDS.PREP_FLIGHT },
  { re: /숙소는\s*어디가\s*좋|숙소\s*추천|숙박\s*지역/, id: MOONI_CHIP_IDS.PREP_HOTEL },
  { re: /현지\s*교통|렌터카|픽업|공항\s*픽/, id: MOONI_CHIP_IDS.PREP_TRANSPORT },
  { re: /비자|입국\s*필수|입국\s*준비|관광세|입국\s*심사|필수\s*서류/, id: MOONI_CHIP_IDS.VISA_DOCS },
  { re: /서울에서\s*어떻게|서울에서\s*가/, id: MOONI_CHIP_IDS.FROM_SEOUL },
  { re: /부산에서\s*어떻게|부산에서\s*가/, id: MOONI_CHIP_IDS.FROM_BUSAN },
  { re: /인천에서\s*어떻게|인천에서\s*가/, id: MOONI_CHIP_IDS.FROM_INCHEON },
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

function hubLabel(iata) {
  const code = String(iata ?? '').trim().toUpperCase();
  if (!code) return null;
  const hub = RENTAL_AIRPORT_HUBS.find((h) => h.iata === code);
  if (!hub) return code;
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

function buildFlightSsotContext(location, essentialGuide, chatHistory, userText) {
  if (!location) return [];

  const lines = [];
  const banner = resolveRentalPickupBannerInfo(location, { essentialGuide });
  const arrivalIata = getPlannerFlightArrivalIata(location, { essentialGuide });
  const searchHint = getFlightDestinationSearchHint(location, { essentialGuide });
  const plannerIatas = extractArrivalIataCodesFromEssentialGuide(essentialGuide);
  const departure = resolveDepartureFromChat(userText, chatHistory ?? []);

  if (arrivalIata) {
    lines.push(`- 최종 도착 공항(IATA): ${hubLabel(arrivalIata) ?? arrivalIata}`);
  }
  if (plannerIatas?.length) {
    lines.push(
      `- 툴킷·여정 기준 도착 공항 코드: ${plannerIatas.map((c) => hubLabel(c) ?? c).join(', ')}`
    );
  }
  if (searchHint) {
    lines.push(`- 항공권 검색 안내: ${searchHint}`);
  }
  if (banner?.bannerNote) {
    lines.push(`- 경로·환승 참고(GATEO SSOT): ${banner.bannerNote}`);
  }

  const journey = summarizeJourneyTimeline(essentialGuide);
  if (journey) {
    lines.push(`- 여정 타임라인 요약:\n${journey}`);
  }

  const flightAdvice =
    essentialGuide?.categories?.flight?.advice ?? essentialGuide?.flight?.advice ?? null;
  if (typeof flightAdvice === 'string' && flightAdvice.trim()) {
    lines.push(`- 항공 조언(툴킷): ${flightAdvice.trim().slice(0, 400)}`);
  }

  if (departure?.iata) {
    lines.push(
      `- 대화에서 추정한 출발 공항: ${hubLabel(departure.iata) ?? departure.iata}${departure.label ? ` (${departure.label})` : ''}`
    );
  } else {
    lines.push('- 출발지 미언급 시 한국 출발(인천 ICN) 기준으로 설명해도 된다.');
  }

  return lines;
}

function buildProfileContext(slug, essentialGuide) {
  const profile = getDestinationBookingProfile(slug);
  const lines = [];
  if (profile.ferryRequired) {
    lines.push('- 이 여행지는 **항공 후 페리** 구간이 필요할 수 있다.');
  }
  if (profile.noCarOnIsland) {
    lines.push('- 섬 내 **렌터카·자가용 이용이 제한**되거나 불편할 수 있다.');
  }
  if (profile.defaultFerryStep) {
    lines.push(`- 대표 페리 구간: ${profile.defaultFerryStep}`);
  }
  const preTravel = essentialGuide?.categories?.pre_travel;
  if (Array.isArray(preTravel) && preTravel.length > 0) {
    const titles = preTravel
      .map((item) => item?.title)
      .filter(Boolean)
      .slice(0, 4);
    if (titles.length) {
      lines.push(`- 출발 전 준비 항목(툴킷): ${titles.join(', ')}`);
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
  if (id && MOONI_CHIP_ANSWER_GUIDES[id]) return id;

  const t = String(userText ?? '');
  for (const { re, id: mappedId } of TEXT_TO_CHIP) {
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
}) {
  const resolvedChipId = resolveMooniChipId({ chipId, userText });
  if (!resolvedChipId) return '';

  const guide = MOONI_CHIP_ANSWER_GUIDES[resolvedChipId];
  if (!guide) return '';

  const location = buildLocation(slug, destinationName);
  const lines = [
    '',
    `[이번 턴 주제 — ${guide.title}]`,
    '- 아래 지침이 일반 MOONi 규칙보다 **우선**한다. 플래너·버튼만 안내하고 끝내지 말 것.',
    ...guide.rules.map((r) => `- ${r}`),
  ];

  const ssotLines = [];
  if (
    resolvedChipId === MOONI_CHIP_IDS.PREP_FLIGHT ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_SEOUL ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_BUSAN ||
    resolvedChipId === MOONI_CHIP_IDS.FROM_INCHEON ||
    resolvedChipId === MOONI_CHIP_IDS.FERRY
  ) {
    ssotLines.push(...buildFlightSsotContext(location, essentialGuide, chatHistory, userText));
    ssotLines.push(...buildProfileContext(slug, essentialGuide));
  } else if (
    resolvedChipId === MOONI_CHIP_IDS.PREP_TRANSPORT ||
    resolvedChipId === MOONI_CHIP_IDS.PREP_HOTEL ||
    resolvedChipId === MOONI_CHIP_IDS.VISA_DOCS
  ) {
    ssotLines.push(...buildProfileContext(slug, essentialGuide));
    if (resolvedChipId === MOONI_CHIP_IDS.PREP_TRANSPORT && location) {
      const arrivalIata = getPlannerFlightArrivalIata(location, { essentialGuide });
      if (arrivalIata) {
        ssotLines.push(`- 도착 공항: ${hubLabel(arrivalIata) ?? arrivalIata}`);
      }
    }
  }

  if (ssotLines.length > 0) {
    lines.push('', '[GATEO 여행지 데이터 — 답변에 반영]', ...ssotLines);
  }

  return lines.join('\n');
}
