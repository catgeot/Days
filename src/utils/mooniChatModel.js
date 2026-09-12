import { PERSONA_TYPES } from '../pages/Home/lib/prompts';
import { detectBookingIntent } from './bookingIntentResolver';
import { classifyChatIntent } from './chatIntentClassifier';
import { GEMINI_MODELS } from './geminiModels';

/** MOONi·장소 채팅 Gemini 모델 SSOT */
export const MOONI_GEMINI = {
  CHAT: GEMINI_MODELS.FAST,
  CHAT_QUALITY: GEMINI_MODELS.QUALITY,
  INTRO: GEMINI_MODELS.QUALITY,
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
