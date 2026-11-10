import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { resolveKoreaTourContentId } from './koreaTourAttractions.js';
import {
  EXPLORE_BADGE_RESTAURANT,
  EXPLORE_KIND_RESTAURANT,
  isExploreRestaurantItem,
} from '../../../shared/search/tourRestaurantDetect.js';
import { buildRestaurantMapSearchUrl } from '../../../shared/search/restaurantMapSearchUrl.js';

/**
 * @param {object | null | undefined} spot
 * @param {{ query?: string }} [opts]
 */
export function tourRestaurantToExploreSuggestion(spot, opts = {}) {
  if (!spot) return null;
  const lat = Number(spot?.lat ?? spot?.mapy);
  const lng = Number(spot?.lng ?? spot?.mapx);
  const name = String(spot?.name || spot?.title || '').trim();
  if (!name) return null;

  const hub = spot.hubId
    ? resolveCityAttractionHub(spot.hubId)
    : resolveHubFromTourSpot(spot);
  const sigungu = extractTourAttractionSigungu(spot.addr1, spot.addr2);
  const parentCity =
    hub?.name ||
    String(sigungu || '')
      .replace(/(시|군|구)$/u, '')
      .trim() ||
    String(spot.locality || '').split(/\s+/)[0] ||
    '';

  const contentId = resolveKoreaTourContentId(spot.contentId || spot.id || '');
  const thumb = String(spot.firstImage || spot.imageUrl || spot.thumbUrl || '').trim() || null;
  const regionLabel = parentCity || spot.areaLabel || '';

  return {
    id: `tour-restaurant-${contentId || `${lat}-${lng}`}`,
    kind: EXPLORE_KIND_RESTAURANT,
    badge: EXPLORE_BADGE_RESTAURANT,
    exploreRestaurant: true,
    domesticRestaurantMap: true,
    name,
    name_en: String(spot.attractionNameEn || spot.name_en || '').trim() || name,
    country: '대한민국',
    country_en: 'South Korea',
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    hubId: hub?.hubId || spot.hubId || undefined,
    source: 'tourapi',
    uiPlace: false,
    parentCity: parentCity || undefined,
    locality: spot.locality || undefined,
    areaLabel: spot.areaLabel || undefined,
    addr1: spot.addr1 || undefined,
    addr2: spot.addr2 || undefined,
    ...(contentId ? { contentId, contentTypeId: spot.contentTypeId || '39' } : {}),
    cat1: spot.cat1 || 'A05',
    cat2: spot.cat2 || null,
    cat3: spot.cat3 || null,
    ...(thumb ? { firstImage: thumb, imageUrl: thumb, thumbUrl: thumb } : {}),
    desc: String(spot.blurb || spot.addr1 || '').trim() || undefined,
    restaurantMapSearchUrl: buildRestaurantMapSearchUrl({ name, region: regionLabel, item: spot }),
    originalQuery: opts.query || undefined,
    skipScenicGateway: true,
  };
}

function resolveHubFromTourSpot(spot) {
  const sigungu = extractTourAttractionSigungu(spot?.addr1, spot?.addr2);
  if (!sigungu) return null;
  return (
    resolveCityAttractionHub(sigungu) ||
    resolveCityAttractionHub(String(sigungu).replace(/(시|군|구)$/u, ''))
  );
}

/**
 * Tour 행이 음식점이면 explore suggestion으로, 아니면 null.
 * @param {object | null | undefined} spot
 * @param {{ query?: string }} [opts]
 */
export function maybeTourRestaurantExploreSuggestion(spot, opts = {}) {
  if (!isExploreRestaurantItem(spot)) return null;
  return tourRestaurantToExploreSuggestion(spot, opts);
}
