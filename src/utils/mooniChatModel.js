import { PERSONA_TYPES } from '../pages/Home/lib/prompts';
import { detectBookingIntent } from './bookingIntentResolver';
import { classifyChatIntent } from './chatIntentClassifier';

/** MOONi·장소 채팅 Gemini 모델 SSOT */
export const MOONI_GEMINI = {
  /** 본문 대화 기본 — 비용·속도 */
  CHAT: 'gemini-3.1-flash-lite',
  /** 복잡 예약·교통·PLANNER persona */
  CHAT_QUALITY: 'gemini-2.5-flash',
  /** 여행지 첫인상 intro (단발 호출) */
  INTRO: 'gemini-2.5-flash',
};

const COMPLEX_INTENTS = new Set([
  'access_route',
  'book_flight',
  'book_ferry',
  'book_transfer',
  'book_general',
  'info_visa',
  'info_fees',
]);

/**
 * MOONi 채팅 턴별 모델.
 * Gemini 호출은 stateless — 대화 기록 JSON만 넘기므로 턴마다 모델을 바꿔도 세션은 유지된다.
 *
 * @param {{ userText: string, chatHistory?: Array<{ role?: string, text?: string }>, persona?: string | null }} params
 */
export function resolveMooniChatModel({ userText, chatHistory = [], persona = null }) {
  if (persona === PERSONA_TYPES.PLANNER) {
    return MOONI_GEMINI.CHAT_QUALITY;
  }

  if (detectBookingIntent(userText, chatHistory)) {
    return MOONI_GEMINI.CHAT_QUALITY;
  }

  const { primary, confidence } = classifyChatIntent(userText, chatHistory);
  if (COMPLEX_INTENTS.has(primary) && confidence !== 'low') {
    return MOONI_GEMINI.CHAT_QUALITY;
  }

  return MOONI_GEMINI.CHAT;
}
