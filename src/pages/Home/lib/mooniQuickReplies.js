import { PERSONA_TYPES } from './prompts';
import { getDestinationBookingProfile } from '../../../utils/destinationBookingProfile';
import { getPreTravelItemsFromGuide } from '../../../utils/chatPrepBookingLinks';

/** §2.11 — bound slug 주제 칩 L1/L2 SSOT */
export const MOONI_TOPIC_HINT =
  '이곳이 어떤 곳인지부터, 가는 방법·준비·즐길거리까지 골라보셔도 좋아요. 예약은 답변 아래 버튼으로 이어질 수 있어요.';

const L1_DEFS = [
  {
    id: 'explore',
    label: '🌍 이곳이 궁금해',
    drillDown: true,
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'access',
    label: '✈️ 가는 방법',
    drillDown: true,
    persona: PERSONA_TYPES.PLANNER,
  },
  {
    id: 'prep',
    label: '🛫 출발 전 준비',
    drillDown: true,
    persona: PERSONA_TYPES.PLANNER,
  },
  {
    id: 'enjoy',
    label: '🌴 즐길거리·일정',
    drillDown: true,
    persona: PERSONA_TYPES.INSPIRER,
  },
  {
    id: 'planner',
    label: '📋 플래너 보기',
    action: 'planner',
  },
];

const L2_EXPLORE = [
  { id: 'place_overview', label: '어떤 곳?', sendText: '이곳은 어떤 곳이야?' },
  { id: 'safety_vibe', label: '분위기·치안', sendText: '분위기와 치안은 어때?' },
  { id: 'history', label: '역사·문화', sendText: '역사나 문화적으로 특징이 뭐야?' },
  { id: 'why_go', label: '왜 가볼 만해?', sendText: '왜 가볼 만한 여행지야?' },
];

const L2_ACCESS_DEPARTURES = [
  { id: 'from_seoul', label: '서울에서', sendText: '서울에서 어떻게 가?', requiresLeg: 'flight' },
  { id: 'from_busan', label: '부산에서', sendText: '부산에서 어떻게 가?', requiresLeg: 'flight' },
  { id: 'from_incheon', label: '인천에서', sendText: '인천에서 어떻게 가?', requiresLeg: 'flight' },
  {
    id: 'ferry',
    label: '🚢 페리·배',
    sendText: '페리 예약',
    requiresFerry: true,
  },
  {
    id: 'access_custom',
    label: '✏️ 직접 입력하기',
    action: 'focus_input',
    inputPlaceholder: '어디서 출발하시나요? (예: 서울, 광주)',
  },
];

const L2_PREP = [
  { id: 'visa', label: '비자·입국', sendText: '비자 필요해?' },
  {
    id: 'fees',
    label: '관광세·준비물',
    sendText: '관광세?',
    requiresPreTravel: true,
  },
  { id: 'safety_insurance', label: '안전·보험', sendText: '여행 보험과 안전 준비는?' },
];

const L2_ENJOY = [
  { id: 'activities', label: '액티비티', sendText: '추천 액티비티 알려줘' },
  { id: 'food', label: '맛집', sendText: '맛집 추천해줘' },
  { id: 'itinerary', label: '2~3일 일정', sendText: '2~3일 일정 짜줘' },
  { id: 'companion', label: '동행별 추천', sendText: '누구와 가기 좋아? 동행별 추천해줘' },
];

/**
 * @param {import('../../../utils/destinationBookingProfile.js').ReturnType<typeof getDestinationBookingProfile>} profile
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
function filterChipDefs(defs, profile, essentialGuide) {
  const legs = new Set(profile.legs || []);
  const hasPreTravel = getPreTravelItemsFromGuide(essentialGuide).length > 0;

  return defs.filter((def) => {
    if (def.action === 'focus_input' || def.action === 'planner') return true;
    if (def.requiresFerry && !profile.ferryRequired) return false;
    if (def.requiresLeg && !legs.has(def.requiresLeg)) return false;
    if (def.requiresPreTravel && !hasPreTravel) return false;
    return true;
  });
}

/**
 * @param {string | null | undefined} slug
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
function getL2ForParent(slug, parentId, essentialGuide) {
  if (!slug || !parentId) return [];

  const profile = getDestinationBookingProfile(slug);
  const parent = L1_DEFS.find((d) => d.id === parentId);
  const persona = parent?.persona ?? PERSONA_TYPES.GENERAL;

  let defs = [];
  switch (parentId) {
    case 'explore':
      defs = L2_EXPLORE;
      break;
    case 'access':
      defs = L2_ACCESS_DEPARTURES;
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

  return filterChipDefs(defs, profile, essentialGuide).map((def) => ({
    ...def,
    persona,
  }));
}

/**
 * @param {string | null | undefined} slug
 * @param {1 | 2} [level]
 * @param {string | null} [parentId]
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {Array<{ id: string, label: string, sendText?: string, action?: string, drillDown?: boolean, persona?: string }>}
 */
export function getMooniQuickReplies(slug, level = 1, parentId = null, options = {}) {
  if (!slug) return [];

  const { essentialGuide = null } = options;
  const profile = getDestinationBookingProfile(slug);

  if (level === 2 && parentId) {
    return getL2ForParent(slug, parentId, essentialGuide);
  }

  return L1_DEFS.filter((def) => {
    if (def.action === 'planner') return true;
    if (!def.drillDown) return true;
    return getL2ForParent(slug, def.id, essentialGuide).length > 0;
  }).map(({ drillDown, persona, ...rest }) => ({
    ...rest,
    ...(drillDown ? { drillDown: true } : {}),
    ...(persona ? { persona } : {}),
  }));
}

export function buildMooniIntroWithHint(introText, placeName) {
  const body = String(introText ?? '').trim();
  if (body) {
    return `${body}\n\n${MOONI_TOPIC_HINT}`;
  }
  if (placeName) {
    return `${placeName} 여행, 이곳이 어떤 곳인지부터 가는 방법·준비·즐길거리까지 도와드릴게요.\n\n${MOONI_TOPIC_HINT}`;
  }
  return `안녕하세요! 저는 MOONi예요. 가고 싶은 여행지, 일정, 교통·예약 궁금한 점 무엇이든 물어보세요.`;
}

/** @deprecated — use MOONI_TOPIC_HINT */
export const BOOKING_HINT = MOONI_TOPIC_HINT;
