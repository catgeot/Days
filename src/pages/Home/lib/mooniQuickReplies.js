import { PERSONA_TYPES } from './prompts';
import { getDestinationBookingProfile } from '../../../utils/destinationBookingProfile';
import { getPreTravelItemsFromGuide } from '../../../utils/chatPrepBookingLinks';
import { i18n } from '../../../i18n/config';
import { getFlightOriginDisplayLabel } from './flightCinemaOriginOptions.js';

/** @deprecated — use mooni.chat.topicHint */
export const MOONI_TOPIC_HINT = 'mooni.chat.topicHint';

/** @deprecated — use mooni.chat.accessDeparturePlaceholder */
export const ACCESS_DEPARTURE_INPUT_PLACEHOLDER = 'mooni.chat.accessDeparturePlaceholder';

/** i18next returnEmptyString:false — 빈 default면 키 경로가 그대로 노출됨 */
function chipTranslation(key) {
  const value = i18n.t(key, { defaultValue: '__missing__' });
  if (!value || value === key || value === '__missing__') return '';
  return value;
}

/**
 * 출발 IATA → MOONi access_route 발화
 * @param {string} iata
 * @param {{ label?: string } | null} [option]
 */
export function buildAccessRouteAskText(iata, option = null) {
  const code = String(iata ?? '').trim().toUpperCase();
  const label =
    getFlightOriginDisplayLabel(code, i18n.language) ||
    String(option?.label ?? '').trim();
  const place = label || code;
  if (!place) return i18n.t('mooni.chat.accessRouteAskFallback');
  return i18n.t('mooni.chat.accessRouteAsk', { place });
}

const L1_DEFS = [
  {
    id: 'explore',
    drillDown: true,
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'access',
    drillDown: true,
    persona: PERSONA_TYPES.PLANNER,
  },
  {
    id: 'prep',
    drillDown: true,
    persona: PERSONA_TYPES.PLANNER,
  },
  {
    id: 'enjoy',
    drillDown: true,
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'planner',
    action: 'planner',
  },
];

const L2_EXPLORE = [
  { id: 'place_overview' },
  { id: 'safety_vibe' },
  { id: 'history' },
];

const L2_ACCESS_EXTRAS = [
  {
    id: 'ferry',
    requiresFerry: true,
  },
];

const L2_PREP = [
  { id: 'visa_docs' },
  { id: 'prep_hotel' },
  { id: 'prep_transport' },
];

const L2_ENJOY = [
  { id: 'activities' },
  { id: 'food' },
  {
    id: 'itinerary',
    mobileLabel: true,
  },
  { id: 'companion' },
];

const GENERAL_DISCOVERY_CHIP_DEFS = [
  {
    id: 'warm_resort',
    label: '🌴 따뜻한 휴양지 추천해줘',
    sendText: '따뜻한 휴양지 추천해줘',
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'healing_weekend',
    label: '✨ 2박 3일 힐링 코스',
    sendText: '2박 3일 힐링 코스 추천해줘',
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'short_flight',
    label: '✈️ 비행시간 5시간 이내 여행지',
    sendText: '비행시간 5시간 이내 여행지 추천해줘',
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'family_trip',
    label: '👨‍👩‍👧 가족과 함께 가기 좋은 곳',
    sendText: '가족과 함께 가기 좋은 여행지 추천해줘',
    persona: PERSONA_TYPES.INSPIRER,
  },
];

/** Domestic cities and airports for festival 「가는 법」. Default IATA is ICN (서울 / ICN). */
export const FESTIVAL_DOMESTIC_ORIGINS = [
  { iata: 'ICN', ko: '서울', en: 'ICN' },
  { iata: 'GMP', ko: '김포', en: 'GMP' },
  { iata: 'PUS', ko: '부산', en: 'PUS' },
  { iata: 'TAE', ko: '대구', en: 'TAE' },
  { iata: 'CJJ', ko: '청주', en: 'CJJ' },
  { iata: 'KWJ', ko: '광주', en: 'KWJ' },
  { iata: 'CJU', ko: '제주', en: 'CJU' },
  { iata: 'WJU', ko: '원주', en: 'WJU' },
  { iata: 'KAG', ko: '강릉', en: 'KAG' },
  { iata: 'RSU', ko: '여수', en: 'RSU' },
];

export const FESTIVAL_ACCESS_PARENT = 'festival_access';
export const FESTIVAL_OVERSEAS_PARENT = 'festival_overseas';

const FESTIVAL_CORE_L1 = [
  { id: 'festival_sights' },
  { id: 'festival_access', drillDown: true },
  { id: 'festival_nearby' },
  { id: 'festival_day' },
];

const FESTIVAL_OVERSEAS_L1 = { id: 'festival_overseas', drillDown: true };

const FESTIVAL_OVERSEAS_L2 = [
  { id: 'festival_overseas_visa' },
  { id: 'festival_overseas_flight' },
  { id: 'festival_overseas_airport' },
];

/** @param {string} [locale] */
export function festivalQuickReplyOrder(locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const core = FESTIVAL_CORE_L1.map((def) => def.id);
  return en ? [FESTIVAL_OVERSEAS_L1.id, ...core] : [...core, FESTIVAL_OVERSEAS_L1.id];
}

export function festivalOriginLabel(iata, locale = 'ko') {
  const code = String(iata || 'ICN').trim().toUpperCase();
  const row = FESTIVAL_DOMESTIC_ORIGINS.find((item) => item.iata === code);
  const en = String(locale || '').slice(0, 2) === 'en';
  if (!row) return en ? code : code;
  return en ? row.en : row.ko;
}

export function buildFestivalAccessAskText(iata, locale = 'ko') {
  const place = festivalOriginLabel(iata, locale);
  const en = String(locale || '').slice(0, 2) === 'en';
  if (en) return `How do I get from ${place} to this festival by public transit and by car?`;
  return `${place}에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘`;
}

export function withGroupChipCaret(label, drillDown) {
  const text = String(label || '').trim();
  if (!drillDown || !text || text.includes('▾')) return text;
  return `${text} ▾`;
}

function localizeFestivalDef(def) {
  const base = `mooni.chips.festival.${def.id}`;
  const chip = {
    ...def,
    label: i18n.t(`${base}.label`),
    persona: PERSONA_TYPES.PLANNER,
  };
  if (!def.drillDown) chip.sendText = i18n.t(`${base}.sendText`);
  return chip;
}

function festivalL1Defs(locale) {
  const en = String(locale || '').slice(0, 2) === 'en';
  return en ? [FESTIVAL_OVERSEAS_L1, ...FESTIVAL_CORE_L1] : [...FESTIVAL_CORE_L1, FESTIVAL_OVERSEAS_L1];
}

function localizeL1Def(def) {
  const base = `mooni.chips.l1.${def.id}`;
  const mobileLabel = chipTranslation(`${base}.mobileLabel`);
  return {
    ...def,
    label: i18n.t(`${base}.label`),
    ...(mobileLabel ? { mobileLabel } : {}),
  };
}

function localizeL2Def(parentId, def) {
  const base = `mooni.chips.l2.${parentId}.${def.id}`;
  const { mobileLabel: wantsMobileLabel, ...defRest } = def;
  const extras = {};
  if (wantsMobileLabel === true) {
    const mobileLabel = chipTranslation(`${base}.mobileLabel`);
    if (mobileLabel) extras.mobileLabel = mobileLabel;
  }
  return {
    ...defRest,
    label: i18n.t(`${base}.label`),
    sendText: i18n.t(`${base}.sendText`),
    ...extras,
  };
}

/**
 * @param {import('../../../utils/destinationBookingProfile.js').ReturnType<typeof getDestinationBookingProfile>} profile
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
function filterChipDefs(defs, profile, essentialGuide) {
  const legs = new Set(profile.legs || []);
  const hasPreTravel = getPreTravelItemsFromGuide(essentialGuide).length > 0;

  return defs.filter((def) => {
    if (def.action === 'planner') return true;
    if (def.requiresFerry && !profile.ferryRequired) return false;
    if (def.requiresLeg && !legs.has(def.requiresLeg)) return false;
    if (def.requiresPreTravel && !hasPreTravel) return false;
    return true;
  });
}

/**
 * @param {string | null | undefined} slug
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 * @param {boolean} [allowNameBound] — SSOT 없는 uiPlace도 대화형 L2 허용
 */
function getL2ForParent(slug, parentId, essentialGuide, allowNameBound = false) {
  if (!parentId) return [];
  if (!slug && !allowNameBound) return [];

  const profile = getDestinationBookingProfile(slug);
  const parent = L1_DEFS.find((d) => d.id === parentId);
  const persona = parent?.persona ?? PERSONA_TYPES.GENERAL;

  let defs = [];
  switch (parentId) {
    case 'explore':
      defs = L2_EXPLORE;
      break;
    case 'access':
      defs = L2_ACCESS_EXTRAS;
      break;
    case 'prep':
      defs = L2_PREP;
      break;
    case 'enjoy':
      defs = L2_ENJOY;
      break;
    default:
      return [];
  }

  const filtered = filterChipDefs(defs, profile, essentialGuide);

  return filtered.map((def) => ({
    ...localizeL2Def(parentId, def),
    persona,
  }));
}

/**
 * @param {string | null | undefined} slug — SSOT catalog slug (플래너·페리 프로필)
 * @param {1 | 2} [level]
 * @param {string | null} [parentId]
 * @param {{ essentialGuide?: Record<string, unknown> | null, omitPlanner?: boolean, allowNameBound?: boolean }} [options]
 * @returns {Array<{ id: string, label: string, sendText?: string, action?: string, drillDown?: boolean, persona?: string }>}
 */
/** 장소 미선택 MOONi 세션 — 범용 탐색 질문 칩 */
export function getMooniGeneralDiscoveryChips() {
  return GENERAL_DISCOVERY_CHIP_DEFS.map(({ id, label, sendText, persona }) => ({
    id,
    label,
    sendText,
    persona,
  }));
}

export function getMooniQuickReplies(slug, level = 1, parentId = null, options = {}) {
  const { essentialGuide = null, omitPlanner = false, allowNameBound = false, festivalSession = false } = options;
  if (festivalSession) {
    if (level === 2 && parentId === FESTIVAL_OVERSEAS_PARENT) {
      return FESTIVAL_OVERSEAS_L2.map((def) => localizeFestivalDef(def));
    }
    if (level === 2) return [];
    return festivalL1Defs(i18n.language).map((def) => localizeFestivalDef(def));
  }
  if (!slug && !allowNameBound) return [];

  if (level === 2 && parentId) {
    return getL2ForParent(slug, parentId, essentialGuide, allowNameBound);
  }

  return L1_DEFS.filter((def) => {
    if (def.action === 'planner') {
      if (omitPlanner || !slug) return false;
      return true;
    }
    if (def.id === 'access') return true;
    if (!def.drillDown) return true;
    return getL2ForParent(slug, def.id, essentialGuide, allowNameBound).length > 0;
  }).map((def) => {
    const { drillDown, persona, ...rest } = localizeL1Def(def);
    return {
      ...rest,
      ...(drillDown ? { drillDown: true } : {}),
      ...(persona ? { persona } : {}),
    };
  });
}

/** L2 dock — 「다른 주제」 옆에 표시할 1단 주제 라벨(맥락) */
export function getMooniL1ChipLabel(parentId, { mobile = false } = {}) {
  if (String(parentId || '').startsWith('festival_')) {
    return chipTranslation(`mooni.chips.festival.${parentId}.label`) || i18n.t(`mooni.chips.festival.${parentId}.label`);
  }
  const base = `mooni.chips.l1.${parentId}`;
  if (mobile) {
    const mobileLabel = chipTranslation(`${base}.mobileLabel`);
    if (mobileLabel) return mobileLabel;
  }
  return chipTranslation(`${base}.label`) || i18n.t(`${base}.label`);
}

export function buildMooniIntroWithHint(introText, placeName) {
  const body = String(introText ?? '').trim();
  const hint = i18n.t('mooni.chat.topicHint');
  if (body) {
    return `${body}\n\n${hint}`;
  }
  if (placeName) {
    return `${i18n.t('mooni.chat.introWithPlace', { placeName })}\n\n${hint}`;
  }
  return i18n.t('mooni.chat.introDefault');
}

/** @deprecated — use mooni.chat.topicHint */
export const BOOKING_HINT = MOONI_TOPIC_HINT;
