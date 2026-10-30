import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';
import { fetchDomesticTourOverviewForLocation } from '../../../utils/tourKeywordPick.js';
import { needsPlaceChatIntroHydration } from './placeDescText.js';
import {
  ensurePlaceChatIntroForLocation,
  fetchPlaceChatIntroSummaryForLocation,
} from './placeChatIntro.js';

/**
 * 갤러리 overview — place_chat_intro 캐시 → Tour detailCommon → AI intro.
 * @param {object} location
 * @param {{ lng?: string, generateIfMissing?: boolean }} [options]
 * @returns {Promise<string>}
 */
export async function hydratePlaceGalleryOverview(location, options = {}) {
  const { lng = 'ko', generateIfMissing = true } = options;
  if (!location || !needsPlaceChatIntroHydration(location)) return '';

  const cachedIntro = await fetchPlaceChatIntroSummaryForLocation(location, lng);
  if (cachedIntro) return cachedIntro;

  if (isDomesticKoreaLocation(location)) {
    const tourOverview = await fetchDomesticTourOverviewForLocation(location);
    if (tourOverview) return tourOverview;
  }

  if (!generateIfMissing) return '';

  const generated = await ensurePlaceChatIntroForLocation(location, {
    generateIfMissing: true,
    lng,
  });
  return generated || '';
}
