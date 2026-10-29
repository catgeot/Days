import { fetchKoreaFestivalsRolling12, ensureKoreaFestivalItemsTitleEnForMooni } from '../../Korea/fetchKoreaFestivalsWindow.js';
import { resolveMooniChatKoreaFestivalHint } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import { isGateoMooniScopedFestivalEnabled } from '../../../shared/gateoFeatureFlags.js';

/** @type {typeof fetchKoreaFestivalsRolling12} */
let fetchRolling12Impl = fetchKoreaFestivalsRolling12;

/** @param {typeof fetchKoreaFestivalsRolling12 | null} fn */
export function __testSetFetchKoreaFestivalsRolling12(fn) {
  fetchRolling12Impl = fn ?? fetchKoreaFestivalsRolling12;
}

export function __testResetFetchKoreaFestivalsRolling12() {
  fetchRolling12Impl = fetchKoreaFestivalsRolling12;
}

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
  const scopedFestivalEnabled = isGateoMooniScopedFestivalEnabled();
  return resolveMooniChatKoreaFestivalHint({
    userText: input.userText,
    chipId: input.chipId ?? null,
    festivalContext: input.festivalContext ?? null,
    boundPlaceName: input.boundPlaceName,
    departureLabel: input.departureLabel ?? '',
    locale,
    scopedFestivalEnabled,
    loadFestivalItems: async () => {
      const festWindow = await fetchRolling12Impl({ locale });
      const items = festWindow?.items ?? [];
      return ensureKoreaFestivalItemsTitleEnForMooni(items, {
        scopedFestivalEnabled,
        locale,
      });
    },
  });
}
