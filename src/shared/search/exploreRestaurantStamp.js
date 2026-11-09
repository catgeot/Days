import { isCatalogOrHubExplorePlace } from './poiRestaurantCategory.js';
import {
  EXPLORE_BADGE_RESTAURANT,
  EXPLORE_KIND_RESTAURANT,
  isExploreRestaurantItem,
} from './tourRestaurantDetect.js';
import { buildRestaurantMapSearchUrl } from './restaurantMapSearchUrl.js';

/**
 * 식당으로 판별된 탐색 제안에 배지·외부 지도 URL·카드 차단 플래그를 붙인다.
 * @param {object | null | undefined} item
 * @returns {object | null | undefined}
 */
export function stampExploreRestaurantSuggestion(item) {
  if (!item || typeof item !== 'object') return item;
  if (isCatalogOrHubExplorePlace(item)) return item;
  if (item.exploreRestaurant === true && item.kind === EXPLORE_KIND_RESTAURANT) return item;
  if (!isExploreRestaurantItem(item)) return item;

  const name = String(item.name || '').trim();
  const region =
    String(item.parentCity || item.areaLabel || '').trim() ||
    String(item.locality || '').split(/\s+/)[0] ||
    '';

  return {
    ...item,
    kind: EXPLORE_KIND_RESTAURANT,
    badge: EXPLORE_BADGE_RESTAURANT,
    exploreRestaurant: true,
    uiPlace: false,
    skipScenicGateway: true,
    poiAttraction: false,
    restaurantMapSearchUrl:
      String(item.restaurantMapSearchUrl || '').trim() ||
      buildRestaurantMapSearchUrl({ item, name, region }),
  };
}
