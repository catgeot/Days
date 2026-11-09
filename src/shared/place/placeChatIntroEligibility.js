import { isExploreRestaurantItem } from '../search/tourRestaurantDetect.js';
import { isClientAutomatedSession } from './placePlannerEligibility.js';

const SEARCH_COORD_PLACE_ID = /^search-\d+(?:\.\d+)?-\d+(?:\.\d+)?$/i;

/**
 * Mapbox · 좌표 핀 ephemeral id (예: search-37.54496525-127.05632469).
 * @param {string} raw
 */
export function isSearchCoordinatePlaceId(raw) {
  return SEARCH_COORD_PLACE_ID.test(String(raw ?? '').trim());
}

export function resolvePlaceChatIntroSubjectKey(location) {
  if (!location || typeof location !== 'object') return '';
  return String(
    location.id ?? location.place_id ?? location.placeId ?? location.slug ?? '',
  ).trim();
}

/**
 * search-좌표 음식점 · Tour 음식점 — intro AI 자동 생성 금지 (조회는 별도).
 * @param {object | null | undefined} location
 */
export function isPlaceChatIntroGenerationBlocked(location) {
  if (!location || typeof location !== 'object') return true;
  if (isExploreRestaurantItem(location)) return true;
  const subjectKey = resolvePlaceChatIntroSubjectKey(location);
  if (
    isSearchCoordinatePlaceId(subjectKey) &&
    (location.kind === 'restaurant' ||
      location.exploreRestaurant ||
      String(location.badge || '').trim() === '식당' ||
      isExploreRestaurantItem(location))
  ) {
    return true;
  }
  return false;
}

/** @param {object | null | undefined} location */
export function shouldAutoGeneratePlaceChatIntro(location) {
  if (!location?.name) return false;
  if (isPlaceChatIntroGenerationBlocked(location)) return false;
  if (isClientAutomatedSession()) return false;
  return true;
}

/**
 * 라우트 진입 ensure 스케줄 — 일반 여행지 유지, 음식점·봇 제외.
 * @param {object | null | undefined} location
 */
export function shouldEnsurePlaceChatIntroForLocation(location) {
  if (!location?.name) return false;
  if (isPlaceChatIntroGenerationBlocked(location)) return false;
  if (isClientAutomatedSession()) return false;
  return true;
}
