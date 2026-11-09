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

const BOT_UA =
  /googlebot|google-inspectiontool|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|whatsapp|telegrambot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|yeti|naverbot|kakaotalk-scrap|kakaostory|daumoa|slackbot/i;

/** 크롤러 프리뷰·자동화 브라우저 — 툴킷·intro Edge 생성 호출 금지 */
export function isClientAutomatedSession() {
  if (typeof window === 'undefined') return false;
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
  try {
    const ua = String(navigator.userAgent || '');
    if (BOT_UA.test(ua)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** @deprecated use isClientAutomatedSession */
export function isClientAutomatedToolkitSession() {
  return isClientAutomatedSession();
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
