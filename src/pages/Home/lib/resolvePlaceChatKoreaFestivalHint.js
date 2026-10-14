import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import { resolveMooniChatKoreaFestivalHint } from '../../../shared/korea/mooniKoreaFestivalAssist.js';

/**
 * usePlaceChat · ChatModal 공통 mooni_chat koreaFestivalHint.
 * @param {{
 *   userText: string,
 *   chipId?: string | null,
 *   festivalContext?: Record<string, unknown> | null,
 *   boundPlaceName?: string,
 *   locale?: string,
 * }} input
 */
export async function resolvePlaceChatKoreaFestivalHint(input = {}) {
  const locale = input.locale || 'ko';
  return resolveMooniChatKoreaFestivalHint({
    userText: input.userText,
    chipId: input.chipId ?? null,
    festivalContext: input.festivalContext ?? null,
    boundPlaceName: input.boundPlaceName,
    departureLabel: input.departureLabel ?? '',
    locale,
    loadFestivalItems: async () => {
      const festWindow = await fetchKoreaFestivalsRolling12({ locale });
      return festWindow?.items ?? [];
    },
  });
}
