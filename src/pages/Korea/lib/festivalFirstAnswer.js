import { apiClient } from '../../Home/lib/apiClient.js';
import {
  GEMINI_PROXY_ERROR_KIND,
  GeminiProxyError,
  formatGeminiProxyUserMessage,
  getGeminiProxyErrorMessage,
} from '../../Home/lib/geminiProxyError.js';
import { polishFestivalModelReply } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import {
  acceptFestivalModelOpening,
  buildFestivalFirstAnswerFacts,
  festivalRunsIntoEvening,
} from './festivalMooniContext.js';

const FIRST_ANSWER_TIMEOUT_MS = 8000;

/**
 * Visible guidance when the opening call fails. rate_limited uses the limit copy.
 * @param {unknown} error
 */
export function festivalFirstAnswerFailureGuidance(error) {
  if (error instanceof GeminiProxyError) return getGeminiProxyErrorMessage(error);
  return formatGeminiProxyUserMessage(GEMINI_PROXY_ERROR_KIND.GENERIC);
}

/**
 * Model first answer. `{ text: '' , guidance: '' }` keeps the template.
 * A failure sets `guidance` (rate_limited → limit message) instead of failing silent.
 * @param {object | null | undefined} festivalContext
 * @param {{ locale?: string, now?: Date, timeoutMs?: number, invoke?: Function }} [options]
 * @returns {Promise<{ text: string, guidance: string, kind?: string }>}
 */
export async function requestFestivalFirstAnswer(festivalContext, options = {}) {
  const facts = buildFestivalFirstAnswerFacts(festivalContext, options);
  if (!facts?.title) return { text: '', guidance: '' };
  const banned = [festivalContext?.address, festivalContext?.timeText, festivalContext?.feeText];
  const invoke = options.invoke || ((task, params) => apiClient.invokeGeminiTask(task, params));
  let timer;
  try {
    const raw = await Promise.race([
      invoke('festival_first_answer', {
        locale: facts.locale,
        facts,
      }),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), options.timeoutMs || FIRST_ANSWER_TIMEOUT_MS);
      }),
    ]);
    if (raw == null) {
      return {
        text: '',
        guidance: formatGeminiProxyUserMessage(GEMINI_PROXY_ERROR_KIND.BUSY),
        kind: GEMINI_PROXY_ERROR_KIND.BUSY,
      };
    }
    const text = polishFestivalModelReply(String(raw?.text || ''), {
      contentId: festivalContext?.contentId,
      locale: facts.locale,
      homepage: festivalContext?.homepage,
      tel: festivalContext?.tel,
      parking: festivalContext?.parking,
      venue: festivalContext?.venue,
      address: festivalContext?.address,
      nearbyPlaces: festivalContext?.nearbyPlaces,
      overview: festivalContext?.sceneOverview || festivalContext?.overview,
      program: festivalContext?.program,
      sceneOverview: festivalContext?.sceneOverview,
      feeText: festivalContext?.feeText,
      timeText: festivalContext?.timeText,
      evening: festivalRunsIntoEvening(festivalContext),
    });
    return {
      text: acceptFestivalModelOpening(text, facts, banned),
      guidance: '',
    };
  } catch (error) {
    return {
      text: '',
      guidance: festivalFirstAnswerFailureGuidance(error),
      kind: error instanceof GeminiProxyError ? error.kind : GEMINI_PROXY_ERROR_KIND.GENERIC,
    };
  } finally {
    clearTimeout(timer);
  }
}
