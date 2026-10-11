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
const AIRPORT = {
  name: '카이로국제공항 교통 안내 (접속 불가)',
  url: '',
};
const UBER_CAI = {
  name: 'Uber CAI pickup',
  url: 'https://www.uber.com/global/en/r/airports/cai/pickup/',
};
const PYRAMIDS_TICKET = {
  name: 'egymonuments.com',
  url: 'https://egymonuments.com/details/Pyramids',
};
const GIZA_INFO = {
  name: '관광유물부 giza-plateau',
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
  name: '관광유물부 egyptian-museum',
  url: 'https://egymonuments.gov.eg/en/museums/egyptian-museum/',
};
const EM_TICKET = {
  name: '관광유물부 예매',
  url: 'https://egymonuments.com/details/EgyptianMuseum',
};
const SH_INFO = {
  name: '관광유물부 sultan-hasan',
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
      '한국(Korea (South))은 e-Visa 대상국. 정부 포털에서 신청·카드 결제. 관광 단수 25$ · 복수 60$. 여권 도착일 기준 6개월 이상, e-Visa 출력본·여행 일정·숙소 예약 정보 지참',
      [VISA],
      DAY,
      { id: 'entry' },
    ),
    verifiedSlot(
      '공항→시내',
      'CAI 공식 안내: 미터 있는 흰색 택시 · 구형 흑백 택시는 미터 없음(타기 전 요금 합의) · 입국장 호객 기사 주의 · 터미널 앞 연석 «리무진» 정액(목적지·차종 A~D별) · 시내버스는 1터미널 앞 주차장 버스 정류장에서만 출발. 차량 호출 앱(Uber) CAI 승차 안내 페이지 있음',
      [AIRPORT, UBER_CAI],
      DAY,
      { id: 'airport' },
    ),
    emptySlot('stay-area', '머물 지역'),
    verifiedSlot(
      '1·2·3일 동선',
      'D1 도착 → 공항→시내(위 칸) · 시내 휴식. D2 기자 고원 07:00 개장에 맞춰 이른 아침 → GEM(시간대 지정 예매 필수, 전시관 수·토 21:00·그 외 18:00까지, 마지막 입장 마감 1시간 전) → 저녁 코샤리 아부 타렉(다운타운). D3 09:00 타흐리르 이집트 박물관(매표 16:00 마감) → 오후 술탄 하산 모스크(마지막 입장 16:00)',
      [LOGBOOK],
      '2026-10-11(시간) · 2026-10-03(동선)',
      { id: 'itinerary' },
    ),
    verifiedSlot(
      '돈·치안',
      '통화 이집트 파운드(EGP). 외교부 여행경보: 카이로 등 나일강 유역 도시지역 = 여행유의(서부사막·시나이 남부 일부 = 여행자제, 중·북부 시나이·리비아 국경 30km = 출국권고). 대사관 최근 공지(2026-09-22): 중동 군사적 긴장 관련 안전 유의 · 개인 간 환전 거래 사기 주의. 영사콜센터 +82-2-3210-0404',
      [LOGBOOK, SAFETY, EMBASSY_NOTICES],
      DAY,
      { id: 'money-safety' },
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
    hours: '매일 07:00~, 마지막 입장 16:00 · 라마단 08:00~, 마지막 입장 15:30 (관광유물부 정보 페이지는 08:00~16:00 표기 — 병기)',
    hourSources: [PYRAMIDS_TICKET, GIZA_INFO],
    fee: '외국인 성인 700 EGP · 학생 350 EGP(고원 입장). 대피라미드·카프레·멘카우레 피라미드 내부, 메레산크 3세 무덤, 노동자 묘역은 미포함. 차량 입장 승용차·택시 25 EGP',
    feeSources: [PYRAMIDS_TICKET, GIZA_INFO],
    bookingUrl: PYRAMIDS_TICKET.url,
    bookingSource: { name: '관광유물부 예매(egymonuments.com)', url: PYRAMIDS_TICKET.url },
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: GIZA_MAP,
    mapSource: { name: 'Google 지도', url: GIZA_MAP },
    notes: '마감 1시간 전까지 도착 · 표는 끝까지 소지 · 휴대폰 촬영 무료 · 학생 할인은 유효 학생증·24세 이하',
    noteSources: [PYRAMIDS_TICKET],
  }),
  attractionCard({
    slug: 'grand-egyptian-museum',
    name: '대이집트박물관',
    nameEn: 'Grand Egyptian Museum',
    aliases: [
      '대이집트박물관',
      '그랜드 이집트 박물관',
      'GEM',
      'Grand Egyptian Museum',
      '카이로 대이집트박물관',
      'grand-egyptian-museum',
    ],
    hours: '일·월·화·목·금: 전시관 09:00~18:00(단지 08:30~19:00), 마지막 입장 17:00 · 수·토: 전시관 09:00~21:00(단지 08:30~22:00), 마지막 입장 20:00',
    hourSources: [GEM_HOURS, GEM_TICKETS],
    fee: '외국인(Arabs or Other Nationalities) 성인 1,590 EGP · 어린이·학생 800 EGP · 6세 미만 무료. 입장 시간대 08:30–11:00 / 11:00–13:00 / 13:00–15:00 / 15:00–17:00 중 선택',
    feeSources: [GEM_ADMISSION],
    bookingUrl: 'https://tickets.gem.eg/',
    bookingSource: GEM_TICKETS,
    bookingLinkLabel: 'GEM 공식 예매',
    mapUrl: GEM_MAP,
    mapSource: { name: 'Google 지도', url: GEM_MAP },
    notes: '환불 불가 · 지정 날짜·시간만 유효 · 1회 입장(재입장 불가) · 기명·양도 불가 / 40×40cm 넘는 가방·우산은 보관소 / 외부 음식·음료 반입 불가(전시관 안 작은 물병만) · 삼각대·셀카봉·드론·외부 조명·플래시 금지',
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
    hours: '매일 09:00~17:00 · 매표 16:00 마감 · 라마단 마지막 입장 15:00',
    hourSources: [EM_INFO, EM_TICKET],
    fee: '외국인 성인 550 EGP · 학생 275 EGP · 오디오 투어 외국인 75 EGP',
    feeSources: [EM_INFO, EM_TICKET],
    bookingUrl: EM_TICKET.url,
    bookingSource: EM_TICKET,
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: EM_MAP,
    mapSource: { name: 'Google 지도', url: EM_MAP },
    notes: '휴대폰 촬영 무료 · 플래시 금지 · 손전등·레이저 포인터 금지 · 전시실 안 음식·음료 불가(작은 물병만) · 마감 1시간 전까지 도착',
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
    hours: '매일 09:00~17:00 · 마지막 입장 16:00 · 라마단 마지막 입장 15:00',
    hourSources: [SH_INFO, SH_TICKET],
    fee: '외국인 성인 220 EGP · 학생 110 EGP — 맞은편 알리파이 모스크 입장 포함',
    feeSources: [SH_INFO, SH_TICKET],
    bookingUrl: SH_TICKET.url,
    bookingSource: SH_TICKET,
    bookingLinkLabel: '관광유물부 공식 예매',
    mapUrl: SH_MAP,
    mapSource: { name: 'Google 지도', url: SH_MAP },
    notes: '휴대폰 촬영 무료 · 마감 1시간 전까지 도착 · 위치: 살라딘 광장, 알리파이 모스크 맞은편',
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

function mentionScore(mention, target) {
  const needle = norm(mention);
  if (!needle) return 0;
  const aliases = [target.name, target.nameEn, target.slug, ...(target.aliases || [])];
  let best = 0;
  for (const alias of aliases) {
    const key = norm(alias);
    if (!key) continue;
    if (key === needle) best = Math.max(best, 1000 + key.length);
    else if (needle.length >= 4 && key.length >= 4 && needle.includes(key)) best = Math.max(best, key.length);
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
