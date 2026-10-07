import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import { resolveMooniChatKoreaFestivalHint } from '../../../shared/korea/mooniKoreaFestivalAssist.js';

/**
 * usePlaceChat · ChatModal 공통 mooni_chat koreaFestivalHint.
 * @param {{
 *   userText: string,
 *   festivalContext?: Record<string, unknown> | null,
 *   boundPlaceName?: string,
 *   locale?: string,
 * }} input
 */
export async function resolvePlaceChatKoreaFestivalHint(input = {}) {
  const locale = input.locale || 'ko';
  return resolveMooniChatKoreaFestivalHint({
    userText: input.userText,
    festivalContext: input.festivalContext ?? null,
    boundPlaceName: input.boundPlaceName,
    locale,
    loadFestivalItems: async () => {
      const festWindow = await fetchKoreaFestivalsRolling12({ locale });
      return festWindow?.items ?? [];
    },
  });
}
