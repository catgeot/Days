import { getDestinationBookingProfile } from '../../../utils/destinationBookingProfile';

/** slug bound 후 MOONi 주제 칩 SSOT — §2.9·§2.10 handoff */
const QUICK_REPLY_DEFS = [
  {
    id: 'access',
    label: '✈️ 어떻게 가?',
    sendText: '서울에서 어떻게 가?',
    requiresLeg: 'flight',
  },
  {
    id: 'ferry',
    label: '🚢 페리·배',
    sendText: '페리 예약',
    requiresFerry: true,
  },
  {
    id: 'visa',
    label: '🛂 비자·입국',
    sendText: '비자 필요해?',
  },
  {
    id: 'transfer',
    label: '🚐 공항 픽업',
    sendText: '공항 픽업',
    requiresLeg: 'transfer',
  },
  {
    id: 'fees',
    label: '💰 관광세·준비',
    sendText: '관광세?',
  },
  {
    id: 'planner',
    label: '📋 플래너 보기',
    action: 'planner',
  },
];

const BOOKING_HINT = '교통·비자·예약은 아래에서 골라보셔도 좋아요.';

/**
 * @param {string | null | undefined} slug
 * @returns {Array<{ id: string, label: string, sendText?: string, action?: string }>}
 */
export function getMooniQuickReplies(slug) {
  if (!slug) return [];

  const profile = getDestinationBookingProfile(slug);
  const legs = new Set(profile.legs || []);

  return QUICK_REPLY_DEFS.filter((def) => {
    if (def.requiresFerry && !profile.ferryRequired) return false;
    if (def.requiresLeg && !legs.has(def.requiresLeg)) return false;
    return true;
  }).slice(0, 6);
}

export function buildMooniIntroWithHint(introText, placeName) {
  const body = String(introText ?? '').trim();
  if (body) {
    return `${body}\n\n${BOOKING_HINT}`;
  }
  if (placeName) {
    return `${placeName} 여행, 교통·예약·일정 무엇이든 도와드릴게요.\n\n${BOOKING_HINT}`;
  }
  return `안녕하세요! 저는 MOONi예요. 가고 싶은 여행지, 일정, 교통·예약 궁금한 점 무엇이든 물어보세요.`;
}

export { BOOKING_HINT };
