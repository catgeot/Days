import {
  getEssentialGuide,
  hasUsableToolkit,
  resolveEssentialGuideRaw,
  toolkitRowMatchesLocation,
} from '../../../../utils/toolkitPlaceIdResolve.js';
import { isPlacePlannerEligible } from '../../../../shared/place/placePlannerEligibility.js';
import { getPlannerToolkitLocation } from '../../../../shared/place/restaurantPlannerCity.js';

/** 플래너 UI — 지리 검증이 빡빡할 때도 place_id가 맞는 DB 행은 표시 */
export function resolvePlannerGuideForDisplay(row, location, locale) {
  if (!row || !isPlacePlannerEligible(location)) return null;
  const toolkitLoc = getPlannerToolkitLocation(location);
  const strict = getEssentialGuide(row, toolkitLoc, locale);
  if (strict) return strict;
  if (toolkitRowMatchesLocation(row, toolkitLoc) && hasUsableToolkit(row, locale)) {
    return resolveEssentialGuideRaw(row, locale);
  }
  return null;
}

export function hasStoredToolkitRow(row, location, locale) {
  if (!row || !isPlacePlannerEligible(location)) return false;
  const toolkitLoc = getPlannerToolkitLocation(location);
  if (!toolkitRowMatchesLocation(row, toolkitLoc)) return false;
  return hasUsableToolkit(row, locale);
}
