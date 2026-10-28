import { isGateoPlaceCrosslinkEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolvePlaceCrossLinks } from './resolvePlaceCrossLinks.js';

export { isGateoPlaceCrosslinkEnabled };

export function resolvePlaceCrossLinksIfEnabled(location, options) {
  if (!isGateoPlaceCrosslinkEnabled()) {
    return { festivals: [], events: [], collections: [] };
  }
  return resolvePlaceCrossLinks(location, options);
}

/** When ON, 행사는 PlaceCrossLinksSection에서만 노출(PlaceWorldEventsSection 중복 방지). */
export function usePlaceCrosslinkWorldEventsRail() {
  return isGateoPlaceCrosslinkEnabled();
}
