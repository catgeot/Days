import { HIGH_ZOOM_FULL_REVEAL } from './globeZoomPolicy';
import { GLOBE_MODE, isTourMode } from './globeMode';

/** 줌 ≥ 3 — 여행지 flyTo(2.35) 직후 한 단계만 더 확대하면 노출 */
export const EXPLORE_NAV_MIN_ZOOM = HIGH_ZOOM_FULL_REVEAL;

/**
 * @param {{ zoom?: number, globeMode?: string, isZenMode?: boolean, hideTourControls?: boolean }} opts
 */
export function shouldShowGlobeExploreNav({
  zoom,
  globeMode = GLOBE_MODE.GLOBE_2D,
  isZenMode = false,
  hideTourControls = false
} = {}) {
  if (isZenMode || hideTourControls) return false;
  if (isTourMode(globeMode)) return false;
  if (!Number.isFinite(zoom) || zoom < EXPLORE_NAV_MIN_ZOOM) return false;
  return true;
}

/** Pause globe auto-rotate once the user is in flat-map explore territory. */
export function shouldPauseGlobeAutoRotateForExplore(zoom) {
  return Number.isFinite(zoom) && zoom >= EXPLORE_NAV_MIN_ZOOM;
}

/**
 * Read ?lat=&lng=&zoom= share params written by handleShareCurrentView.
 * @returns {{ lat: number, lng: number, zoom: number } | null}
 */
export function readGlobeShareViewFromUrl(search = '') {
  try {
    const params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
    const lat = Number.parseFloat(params.get('lat') ?? '');
    const lng = Number.parseFloat(params.get('lng') ?? '');
    const zoom = Number.parseFloat(params.get('zoom') ?? '');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      zoom: Number.isFinite(zoom) ? zoom : EXPLORE_NAV_MIN_ZOOM
    };
  } catch {
    return null;
  }
}
