import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';
import { fetchDomesticTourOverviewForLocation } from '../../../utils/tourKeywordPick.js';
import { needsPlaceChatIntroHydration } from './placeDescText.js';
import { fetchPlaceChatIntroSummaryForLocation } from './placeChatIntro.js';

/** @type {Map<string, string>} */
const overviewMemory = new Map();
/** @type {Map<string, Promise<string>>} */
const overviewInflight = new Map();

function overviewCacheKey(location, lng = 'ko') {
  const locale = String(lng || 'ko').slice(0, 2);
  return [
    locale,
    String(location?.slug || '').trim().toLowerCase(),
    String(location?.name || '').trim(),
    String(location?.id || '').trim(),
  ].join('|');
}

export function resetPlaceGalleryOverviewCacheForTests() {
  overviewMemory.clear();
  overviewInflight.clear();
}

/**
 * 갤러리 overview — **읽기 전용**: place_chat_intro 조회 → Tour detailCommon.
 * AI·DB intro persist 없음.
 * @param {object} location
 * @param {{ lng?: string, readIntro?: typeof fetchPlaceChatIntroSummaryForLocation, readTour?: typeof fetchDomesticTourOverviewForLocation }} [options]
 * @returns {Promise<string>}
 */
export async function hydratePlaceGalleryOverview(location, options = {}) {
  const {
    lng = 'ko',
    readIntro = fetchPlaceChatIntroSummaryForLocation,
    readTour = fetchDomesticTourOverviewForLocation,
  } = options;
  if (!location || !needsPlaceChatIntroHydration(location)) return '';

  const key = overviewCacheKey(location, lng);
  if (overviewMemory.has(key)) {
    return overviewMemory.get(key) || '';
  }

  const existing = overviewInflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const cachedIntro = await readIntro(location, lng);
      if (cachedIntro) {
        overviewMemory.set(key, cachedIntro);
        return cachedIntro;
      }

      if (isDomesticKoreaLocation(location)) {
        const tourOverview = await readTour(location);
        if (tourOverview) {
          overviewMemory.set(key, tourOverview);
          return tourOverview;
        }
      }

      overviewMemory.set(key, '');
      return '';
    } finally {
      overviewInflight.delete(key);
    }
  })();

  overviewInflight.set(key, promise);
  return promise;
}
