import {
  getEssentialGuide,
  hasUsableToolkit,
  resolveEssentialGuideRaw,
  toolkitRowMatchesLocation,
} from '../../../../utils/toolkitPlaceIdResolve';

/** 플래너 UI — 지리 검증이 빡빡할 때도 place_id가 맞는 DB 행은 표시 */
export function resolvePlannerGuideForDisplay(row, location, locale) {
  if (!row) return null;
  const strict = getEssentialGuide(row, location, locale);
  if (strict) return strict;
  if (toolkitRowMatchesLocation(row, location) && hasUsableToolkit(row, locale)) {
    return resolveEssentialGuideRaw(row, locale);
  }
  return null;
}

export function hasStoredToolkitRow(row, location, locale) {
  if (!row || !toolkitRowMatchesLocation(row, location)) return false;
  return hasUsableToolkit(row, locale);
}
