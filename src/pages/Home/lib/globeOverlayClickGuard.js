/** Android Chrome: overlay unmount on pointerdown → ghost click hits Mapbox. */
export const OVERLAY_CLICK_GUARD_MS = 500;

export const GLOBE_MAP_HIT_SELECTOR = '.gateo-globe-map, .gateo-mapbox-map';

export function nextOverlayClickGuardUntil(now = Date.now(), ms = OVERLAY_CLICK_GUARD_MS) {
  return now + ms;
}

export function isGlobeClickSuppressed(now, until) {
  return Number(now) < Number(until);
}

export function eventTargetIsGlobeMap(target, queryRoot) {
  if (!target || !queryRoot?.querySelector) return false;
  const mapRoot = queryRoot.querySelector(GLOBE_MAP_HIT_SELECTOR);
  return Boolean(mapRoot && (target === mapRoot || mapRoot.contains?.(target)));
}
