import { isGateoPlaceCrosslinkEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolvePlaceCrossLinks } from './resolvePlaceCrossLinks.js';

export { isGateoPlaceCrosslinkEnabled };

export function resolvePlaceCrossLinksIfEnabled(location, options) {
  if (!isGateoPlaceCrosslinkEnabled()) {
    return { festivals: [], events: [], collections: [] };
  }
  return resolvePlaceCrossLinks(location, options);
}
