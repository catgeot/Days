import { isExploreRestaurantItem } from '../search/tourRestaurantDetect.js';
import { getPlaceStableKey } from '../../utils/travelSpotResolve.js';

/**
 * TourPOI·음식점 — 여행 플래너·place_toolkit UI·Edge 생성 대상 아님.
 * @param {object | null | undefined} location
 */
export function isPlacePlannerEligible(location) {
  if (!location || typeof location !== 'object') return false;
  if (isExploreRestaurantItem(location)) return false;
  const stable = String(getPlaceStableKey(location) || location.slug || '').toLowerCase();
  if (location.uiPlace === true && location.kind === 'restaurant') return false;
  if (/^tour-\d+$/u.test(stable) && (location.contentTypeId === '39' || location.content_type_id === '39')) {
    return false;
  }
  return true;
}

/** 크롤러 프리뷰·자동화 브라우저 — 툴킷 Edge 생성 호출 금지 */
export function isClientAutomatedToolkitSession() {
  if (typeof window === 'undefined') return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('crawler') === '1') return true;
  } catch {
    /* ignore */
  }
  try {
    if (navigator.webdriver) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * @param {{ location: object | null | undefined, userInitiated: boolean }} opts
 */
export function shouldInvokePlaceToolkitUpdate({ location, userInitiated }) {
  if (!userInitiated) return false;
  if (!isPlacePlannerEligible(location)) return false;
  if (isClientAutomatedToolkitSession()) return false;
  return true;
}
