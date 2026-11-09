import { isGateoSelfReelsEnabled } from '../../shared/gateoFeatureFlags.js';

export function isSelfReelsRouteEnabled() {
  return isGateoSelfReelsEnabled();
}
