/**
 * 카이로 시범 카드 — plans 원문 표만 옮김 (2026-10-11).
 * 표에 없는 운영 사실·요금·링크는 넣지 않는다.
 */
import {
  emptySlot,
  verifiedSlot,
} from './schema.js';

const VISA = {
  name: 'visa2egypt.gov.eg',
  url: 'https://www.visa2egypt.gov.eg/eVisa/FAQ?VISTK=',
};
// URL unreachable as of 2026-10-21 (WAF 500 / incomplete cert chain): https://www.cairo-airport.com/en-us/Services/Passenger-Guide/Move-From-To-Airport
const AIRPORT = {
  name: '카이로국제공항 교통 안내',
};
const PYRAMIDS_TICKET = {
  name: 'egymonuments.com',
  url: 'https://egymonuments.com/details/Pyramids',
};
const GIZA_INFO = {
  name: '관광유물부',
  url: 'https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau',
};
const GEM_HOURS = {
  name: 'gem.eg',
  url: 'https://gem.eg/en/visit/plan-your-visit/opening-hours/',
};
const GEM_TICKETS = {
  name: 'GEM 공식 예매처',
  url: 'https://tickets.gem.eg/',
};
const GEM_ADMISSION = {
  name: 'tickets.gem.eg Admission',
  url: 'https://tickets.gem.eg/en/AdmissionTkt',
};
const EM_INFO = {
  name: '관광유물부',
  url: 'https://egymonuments.gov.eg/en/museums/egyptian-museum/',
};
const EM_TICKET = {
  name: '관광유물부 예매',
  url: 'https://egymonuments.com/details/EgyptianMuseum',
};
const SH_INFO = {
  name: '관광유물부',
  url: 'https://egymonuments.gov.eg/en/monuments/mosque-and-madrasa-of-sultan-hasan/',
};
const SH_TICKET = {
  name: '관광유물부 예매',
  url: 'https://egymonuments.com/details/Mosque-MadrassaSultanHassan',
};
const SAFETY = {
  name: '외교부 여행경보',
  url: 'https://0404.go.kr/ntnSafetyInfo/178/detail',
};
const EMBASSY_NOTICES = {
  name: '대사관 공지',
  url: 'https://www.0404.go.kr/bbs/embsyNtc/list?ntnCd=178',
};
const LOGBOOK = {
  name: 'GATEO 로그북 (2026-10-03)',
  url: '',
};

const DAY = '2026-10-11';

const GIZA_MAP = 'https://www.google.com/maps/search/?api=1&query=Giza%20Plateau%2C%20Al%20Haram%2C%20Giza&query_place_id=ChIJ1-7Ki31PWBQRbbfEc4MNCJk';
const GEM_MAP = 'https://www.google.com/maps/search/?api=1&query=Grand%20Egyptian%20Museum%2C%20Cairo%20-%20Alexandria%20Desert%20Rd%2C%20Giza&query_place_id=ChIJ0YpKmDRFWBQRGibsxFtMdkU';
const EM_MAP = 'https://www.google.com/maps/search/?api=1&query=The%20Egyptian%20Museum%20in%20Cairo%2C%20El-Tahrir%20Square%2C%20Cairo&query_place_id=ChIJKfCtck2xWBQR5L_ttrv5OJo';
const SH_MAP = 'https://www.google.com/maps/search/?api=1&query=Mosque-Madrasa%20of%20Sultan%20Hassan%2C%20Cairo&query_place_id=ChIJdRfpCqxAWBQR5IwPTJC5xnQ';

export const CAIRO_CITY_FACTS = {
  kind: 'city',
  slug: 'cairo',
  name: '카이로',
  nameEn: 'Cairo',
  aliases: ['카이로', 'Cairo', 'cairo'],
  slots: [
    verifiedSlot(
      '입국',
      '한국 여권은 전자비자(e-Visa) 대상이에요.\n정부 포털에서 신청하고 카드로 결제해요.\n관광 단수는 25달러, 복수 60달러예요.\n여권은 도착일 기준 6개월 이상 남아 있어야 하고, e-Visa 출력본·여행 일정·숙소 예약 정보를 가져가요.',
      [VISA],
      DAY,
      { id: 'entry' },
    ),
    verifiedSlot(
      '공항→시내',
      '미터가 있는 흰색 택시를 타요.\n구형 흑백 택시는 미터가 없으니, 타기 전에 요금을 합의해요.\n입국장에서 호객하는 기사는 조심해요.\n터미널 앞 연석 «리무진»은 목적지와 차종 A~D별로 정액이에요.\n시내버스는 1터미널 앞 주차장 버스 정류장에서만 출발해요.',
      [AIRPORT],
      DAY,
      { id: 'airport' },
    ),
    emptySlot('stay-area', '머물 지역'),
    verifiedSlot(
      '1·2·3일 동선',
      'D1 도착하면 위 ‘공항→시내’ 방법으로 시내에 들어가 쉬어요.\nD2 기자 고원은 07:00 개장에 맞춰 이른 아침에 가요. GEM은 시간대를 지정해 예매해야 하고, 전시관은 수·토 21:00, 그 외에는 18:00까지예요. 마지막 입장은 마감 1시간 전이에요. 저녁은 다운타운 코샤리 아부 타렉이에요.\nD3 09:00에 타흐리르 이집트 박물관에 가요. 매표는 16:00에 마감해요. 오후에는 술탄 하산 모스크에 가고, 마지막 입장은 16:00이에요.',
      [LOGBOOK],
      '2026-10-11(시간) · 2026-10-03(동선)',
      { id: 'itinerary' },
    ),
    verifiedSlot(
      '돈',
      '통화는 이집트 파운드(EGP)예요.',
      [LOGBOOK],
      DAY,
      { id: 'money-safety', kind: 'standing' },
    ),
    verifiedSlot(
      '치안',
      '외교부 여행경보에서 카이로 등 나일강 유역 도시지역은 여행유의예요.\n서부사막과 시나이 남부 일부는 여행자제, 중·북부 시나이와 리비아 국경 30km는 출국권고예요.\n대사관 최근 공지(2026-09-22)는 중동 군사적 긴장에 안전을 유의하고, 개인 간 환전 사기를 조심하라고 해요.\n영사콜센터는 +82-2-3210-0404예요.',
      [LOGBOOK, SAFETY, EMBASSY_NOTICES],
      DAY,
      { id: 'safety', kind: 'standing', checkedOn: DAY },
    ),
    emptySlot('season', '시즌'),
  ],
};

function attractionCard({
  slug,
  name,
  nameEn,
  aliases,
  hours,
  hourSources,
  fee,
  feeSources,
  bookingUrl,
  bookingSource,
  bookingLinkLabel,
  mapUrl,
  mapSource,
  notes,
  noteSources,
  notesCheckedAt = DAY,
}) {
  return {
    kind: 'attraction',
    slug,
    name,
    nameEn,
    aliases,
    bookingUrl,
    bookingLinkLabel,
    mapUrl,
    slots: [
      verifiedSlot('운영시간', hours, hourSources, DAY, { id: 'hours' }),
      verifiedSlot('요금', fee, feeSources, DAY, { id: 'fee' }),
      verifiedSlot('예매 링크', bookingUrl, [bookingSource], DAY, {
        id: 'booking',
        linkRole: 'booking',
        linkLabel: bookingLinkLabel,
      }),
      verifiedSlot('지도 링크', mapUrl, [mapSource], DAY, {
        id: 'map',
        linkRole: 'map',
        linkLabel: 'Google 지도',
      }),
      emptySlot('duration', '소요 시간'),
      emptySlot('nearby-food', '주변 식당'),
      verifiedSlot('주의사항', notes, noteSources, notesCheckedAt, { id: 'notes' }),
    ],
  };
}

export const CAIRO_ATTRACTION_FACTS = [
  attractionCard({
    slug: 'giza-pyramids',
    name: '기자 피라미드',
    nameEn: 'Giza Pyramids',
    aliases: [
      '기자 피라미드',
      '기자 고원',
      '기자피라미드',
      '카이로 기자피라미드',
      'Giza Pyramids',
      'Giza Plateau',
      'giza-pyramids',
    ],
    hours: '매일 07:00에 열고, 마지막 입장은 16:00이에요.\n라마단에는 08:00에 열고, 마지막 입장은 15:30이에요.\n관광유물부 정보 페이지는 08:00~16:00으로 적혀 있어요.',
    hourSources: [PYRAMIDS_TICKET, GIZA_INFO],
    fee: '외국인 성인은 700 EGP, 학생은 350 EGP예요. 고원 입장 요금이에요.\n대피라미드, 카프레, 멘카우레 피라미드 내부와 메레산크 3세 무덤, 노동자 묘역은 포함되지 않아요.\n차량 입장은 승용차·택시 25 EGP예요.',
    feeSources: [PYRAMIDS_TICKET, GIZA_INFO],
    bookingUrl: PYRAMIDS_TICKET.url,
    bookingSource: { name: '관광유물부 예매(egymonuments.com)', url: PYRAMIDS_TICKET.url },
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: GIZA_MAP,
    mapSource: { name: 'Google 지도', url: GIZA_MAP },
    notes: '마감 1시간 전까지 도착해요.\n표는 끝까지 가지고 있어요.\n휴대폰 촬영은 무료예요.\n학생 할인은 유효한 학생증이 있고 24세 이하일 때 받아요.',
    noteSources: [PYRAMIDS_TICKET],
  }),
  attractionCard({
    slug: 'grand-egyptian-museum',
    name: '대이집트박물관',
    nameEn: 'Grand Egyptian Museum',
    aliases: [
      '대이집트박물관',
      '대이집트 박물관',
      '그랜드 이집트 박물관',
      'GEM',
      'Grand Egyptian Museum',
      '카이로 대이집트박물관',
      'grand-egyptian-museum',
    ],
    hours: '일·월·화·목·금은 전시관 09:00~18:00(단지 08:30~19:00)이고, 마지막 입장은 17:00이에요.\n수·토는 전시관 09:00~21:00(단지 08:30~22:00)이고, 마지막 입장은 20:00이에요.',
    hourSources: [GEM_HOURS, GEM_TICKETS],
    fee: '외국인 성인은 1,590 EGP, 어린이·학생은 800 EGP예요.\n6세 미만은 무료예요.\n입장 시간대는 08:30–11:00, 11:00–13:00, 13:00–15:00, 15:00–17:00 중에서 골라요.',
    feeSources: [GEM_ADMISSION],
    bookingUrl: 'https://tickets.gem.eg/',
    bookingSource: GEM_TICKETS,
    bookingLinkLabel: 'GEM 공식 예매',
    mapUrl: GEM_MAP,
    mapSource: { name: 'Google 지도', url: GEM_MAP },
    notes: '환불은 안 돼요.\n지정한 날짜와 시간만 유효해요.\n한 번만 입장할 수 있고, 다시 들어갈 수 없어요.\n기명·양도는 안 돼요.\n40×40cm보다 큰 가방과 우산은 보관소에 맡기세요.\n외부 음식과 음료는 가져올 수 없고, 전시관 안에서는 작은 물병만 돼요.\n삼각대, 셀카봉, 드론, 외부 조명, 플래시는 금지예요.',
    noteSources: [{ name: 'tickets.gem.eg (약관)', url: 'https://tickets.gem.eg/' }],
  }),
  attractionCard({
    slug: 'egyptian-museum-cairo',
    name: '타흐리르 이집트박물관',
    nameEn: 'Egyptian Museum Cairo',
    aliases: [
      '타흐리르 이집트박물관',
      '타흐리르 이집트 박물관',
      '이집트박물관',
      '카이로 이집트박물관',
      'Egyptian Museum Cairo',
      'The Egyptian Museum',
      'egyptian-museum-cairo',
    ],
    hours: '매일 09:00~17:00에 열어요.\n매표는 16:00에 마감해요.\n라마단 마지막 입장은 15:00이에요.',
    hourSources: [EM_INFO, EM_TICKET],
    fee: '외국인 성인은 550 EGP, 학생은 275 EGP예요.\n오디오 투어는 외국인 75 EGP예요.',
    feeSources: [EM_INFO, EM_TICKET],
    bookingUrl: EM_TICKET.url,
    bookingSource: EM_TICKET,
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: EM_MAP,
    mapSource: { name: 'Google 지도', url: EM_MAP },
    notes: '휴대폰 촬영은 무료예요.\n플래시는 금지예요.\n손전등과 레이저 포인터는 금지예요.\n전시실 안에서는 음식과 음료를 먹을 수 없고, 작은 물병만 돼요.\n마감 1시간 전까지 도착해요.',
    noteSources: [EM_INFO, EM_TICKET],
  }),
  attractionCard({
    slug: 'sultan-hassan-mosque',
    name: '술탄 하산 모스크',
    nameEn: 'Sultan Hassan Mosque',
    aliases: [
      '술탄 하산 모스크',
      '술탄 하산 모스크·마드라사',
      '술탄하산',
      '카이로 술탄하산모스크',
      'Sultan Hassan Mosque',
      'Mosque-Madrasa of Sultan Hassan',
      'sultan-hassan-mosque',
    ],
    hours: '매일 09:00~17:00에 열어요.\n마지막 입장은 16:00이에요.\n라마단 마지막 입장은 15:00이에요.',
    hourSources: [SH_INFO, SH_TICKET],
    fee: '외국인 성인은 220 EGP, 학생은 110 EGP예요.\n맞은편 알리파이 모스크 입장이 포함돼요.',
    feeSources: [SH_INFO, SH_TICKET],
    bookingUrl: SH_TICKET.url,
    bookingSource: SH_TICKET,
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: SH_MAP,
    mapSource: { name: 'Google 지도', url: SH_MAP },
    notes: '휴대폰 촬영은 무료예요.\n마감 1시간 전까지 도착해요.\n위치는 살라딘 광장, 알리파이 모스크 맞은편이에요.',
    noteSources: [SH_TICKET, LOGBOOK],
    notesCheckedAt: '2026-10-11 / 2026-10-03',
  }),
];

const CARDS = [CAIRO_CITY_FACTS, ...CAIRO_ATTRACTION_FACTS];

function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

const cardByKey = new Map();
for (const card of CARDS) {
  const keys = [card.slug, card.name, card.nameEn, ...(card.aliases || [])];
  for (const key of keys) {
    const nk = norm(key);
    if (nk && !cardByKey.has(nk)) cardByKey.set(nk, card);
  }
}

const linkTargets = CAIRO_ATTRACTION_FACTS;

export function resolveVerifiedFacts(locationOrName) {
  if (!locationOrName) return null;
  if (typeof locationOrName === 'string') {
    return cardByKey.get(norm(locationOrName)) || null;
  }
  const keys = [
    locationOrName.slug,
    locationOrName.name,
    locationOrName.name_en,
    locationOrName.name_ko,
    locationOrName.id,
  ];
  for (const key of keys) {
    const hit = cardByKey.get(norm(key));
    if (hit) return hit;
  }
  return null;
}

function mentionKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Whole-token exact match. 1–2 character keys are not aliases; no substring or prefix. */
export function mentionScore(mention, target) {
  const needle = mentionKey(mention);
  if (!needle || [...needle].length <= 2) return 0;
  const aliases = [target.name, target.nameEn, target.slug, ...(target.aliases || [])];
  let best = 0;
  for (const alias of aliases) {
    const key = mentionKey(alias);
    if (!key || [...key].length <= 2) continue;
    if (key === needle) best = Math.max(best, 1000 + [...key].length);
  }
  return best;
}

/**
 * 검증 카드 안 [@이름@] — 표에 있는 예매·지도만. 없으면 일반 텍스트.
 * 검증 카드가 아니면 null (기존 검색 버튼 유지).
 */
export function resolveOfficialMention(mention, locationOrName) {
  if (!resolveVerifiedFacts(locationOrName)) return null;
  const chunks = [mention].flat().filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const target of linkTargets) {
    const score = Math.max(0, ...chunks.map((chunk) => mentionScore(chunk, target)));
    if (score > bestScore) {
      bestScore = score;
      best = target;
    }
  }
  if (!best) return { plain: true };
  const links = [];
  if (best.bookingUrl) links.push({ label: best.bookingLinkLabel || '공식 예매', url: best.bookingUrl });
  if (best.mapUrl) links.push({ label: 'Google 지도', url: best.mapUrl });
  if (!links.length) return { plain: true };
  return { links, slug: best.slug };
}
