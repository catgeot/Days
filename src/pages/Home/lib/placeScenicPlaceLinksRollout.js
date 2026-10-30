import { isGateoScenicPlaceLinksEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolveKoreaScenicGalleryUrlsForPlace } from './placeScenicGateway.js';
import { resolvePlaceTargetFromSlug } from './placeRouteHydrate.js';
import { listRegionalScenicPlaceCardsForLocation } from './resolvePlaceCrossLinks.js';

export { isGateoScenicPlaceLinksEnabled };

export function listRegionalScenicPlaceCardsIfEnabled(location) {
  if (!isGateoScenicPlaceLinksEnabled()) return null;
  return listRegionalScenicPlaceCardsForLocation(location);
}

export function resolveScenicGalleryUrlsIfEnabled(loc) {
  if (!isGateoScenicPlaceLinksEnabled()) return [];
  return resolveKoreaScenicGalleryUrlsForPlace(loc);
}

export function isPlaceSlugResolvableForPlaceRoute(placeSlug) {
  const normalized = String(placeSlug || '').trim().toLowerCase();
  if (!normalized) return false;
  return Boolean(resolvePlaceTargetFromSlug(normalized));
}

export function listKoreaScenicSpotsWithUnresolvablePlaceRoute(scenicSpots) {
  const rows = Array.isArray(scenicSpots) ? scenicSpots : [];
  return rows
    .map((spot) => {
      const placeSlug = String(spot?.placeSlug || '').trim().toLowerCase();
      if (isPlaceSlugResolvableForPlaceRoute(placeSlug)) return null;
      return { id: String(spot?.id || '').trim(), placeSlug };
    })
    .filter(Boolean);
}

export function showThemeSpotPlaceCardLink(placeSlug) {
  return isGateoScenicPlaceLinksEnabled() && isPlaceSlugResolvableForPlaceRoute(placeSlug);
}
