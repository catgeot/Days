import {
  isGateoSiteSearchAllAssetsEnabled,
  isGateoSiteSearchEnabled,
} from '../../../shared/gateoFeatureFlags.js';

/**
 * Rollout gate: parent site search + all-assets flag (both default off in prod).
 */
export function isSiteSearchAllAssetsRolloutEnabled() {
  return isGateoSiteSearchEnabled() && isGateoSiteSearchAllAssetsEnabled();
}

/**
 * Dynamic import of regionKeyResolve — returns null when rollout flags are off.
 * @returns {Promise<typeof import('./regionKeyResolve.js') | null>}
 */
export async function loadSiteSearchRegionKeyResolve() {
  if (!isSiteSearchAllAssetsRolloutEnabled()) return null;
  return import('./regionKeyResolve.js');
}
