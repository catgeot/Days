import { isGateoScenicPlaceLinksEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolveKoreaScenicGalleryUrlsForPlace } from './placeScenicGateway.js';
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

export function showThemeSpotPlaceCardLink(placeSlug) {
  return (
    isGateoScenicPlaceLinksEnabled() && Boolean(String(placeSlug || '').trim().toLowerCase())
  );
}
