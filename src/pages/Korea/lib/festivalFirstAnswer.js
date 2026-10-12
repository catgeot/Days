import { apiClient } from '../../Home/lib/apiClient.js';
import { polishFestivalModelReply } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import {
  acceptFestivalModelOpening,
  buildFestivalFirstAnswerFacts,
} from './festivalMooniContext.js';

const FIRST_ANSWER_TIMEOUT_MS = 8000;

/**
 * Model first answer. Empty string means the caller keeps the template.
 * @param {object | null | undefined} festivalContext
 * @param {{ locale?: string, now?: Date, timeoutMs?: number }} [options]
 */
export async function requestFestivalFirstAnswer(festivalContext, options = {}) {
  const facts = buildFestivalFirstAnswerFacts(festivalContext, options);
  if (!facts?.title) return '';
  const banned = [festivalContext?.address, festivalContext?.timeText, festivalContext?.feeText];
  let timer;
  try {
    const raw = await Promise.race([
      apiClient.invokeGeminiTask('festival_first_answer', {
        locale: facts.locale,
        facts,
      }),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), options.timeoutMs || FIRST_ANSWER_TIMEOUT_MS);
      }),
    ]);
    const text = polishFestivalModelReply(String(raw?.text || ''), {
      contentId: festivalContext?.contentId,
      locale: facts.locale,
      homepage: festivalContext?.homepage,
      tel: festivalContext?.tel,
      parking: festivalContext?.parking,
      venue: festivalContext?.venue,
      address: festivalContext?.address,
      overview: festivalContext?.sceneOverview || festivalContext?.overview,
      program: festivalContext?.program,
      sceneOverview: festivalContext?.sceneOverview,
      feeText: festivalContext?.feeText,
    });
    return acceptFestivalModelOpening(text, facts, banned);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
