import { HIGH_ZOOM_FULL_REVEAL } from './globeZoomPolicy';

/** 공유 URL에 zoom 파라미터 없을 때 기본값 */
export const EXPLORE_NAV_MIN_ZOOM = HIGH_ZOOM_FULL_REVEAL;

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
