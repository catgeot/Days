import globeLandmarks from '../data/globeLandmarks.json';
import { mergeCanonicalTravelSpot, getPlaceStableKey } from '../../../utils/travelSpotResolve.js';
import { bootstrapGlobe3d, teardownGlobe3d } from './globe3dBootstrap';
import { GLOBE_MODE, transitionGlobeMode } from './globeMode';
import { TOUR_TEMPLATE_BY_NAME, landmarkOrbit } from './globeTourTemplates';

export function resolveGlobeTourSlug(locationOrSlug) {
  if (!locationOrSlug) return null;
  if (typeof locationOrSlug === 'string') {
    const key = String(locationOrSlug).trim().toLowerCase();
    return key || null;
  }
  const merged = mergeCanonicalTravelSpot(locationOrSlug);
  const stable = getPlaceStableKey(merged);
  return stable ? String(stable).toLowerCase() : null;
}

export function hasGlobeTourLandmark(locationOrSlug) {
  const slug = resolveGlobeTourSlug(locationOrSlug);
  if (!slug) return false;
  return Boolean(globeLandmarks[slug]);
}

/** Summary 카드 3D 투어 버튼 — QA: 유효 좌표면 전 여행지 노출 (tourReady gate 없음) */
export function canStartGlobeTour(location) {
  if (!location || location.isScanning) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

export function resolveTourKeyframes(slug, fallbackLng, fallbackLat) {
  const key = String(slug || resolveGlobeTourSlug({ slug, lat: fallbackLat, lng: fallbackLng }) || '').toLowerCase();
  const landmark = globeLandmarks[key];
  const center = landmark?.center || [fallbackLng, fallbackLat];
  if (landmark?.keyframes?.length) return landmark.keyframes;
  const templateFn = TOUR_TEMPLATE_BY_NAME[landmark?.template] || landmarkOrbit;
  return templateFn(center, landmark?.orbit || {});
}

function waitForMoveEnd(map) {
  return new Promise((resolve) => {
    map.once('moveend', resolve);
  });
}

function applyKeyframe(map, frame, { immediate = false } = {}) {
  const camera = {
    center: frame.center,
    zoom: frame.zoom,
    pitch: frame.pitch ?? 0,
    bearing: frame.bearing ?? 0,
    essential: true
  };

  if (immediate || !frame.duration) {
    map.jumpTo(camera);
    return Promise.resolve();
  }

  if (frame.ease || frame.orbit) {
    map.easeTo({
      ...camera,
      duration: frame.duration,
      easing: (t) => t
    });
  } else {
    map.flyTo({ ...camera, duration: frame.duration });
  }
  return waitForMoveEnd(map);
}

export function createGlobeTourEngine(map, { onModeChange, onTourUiChange, defaultView } = {}) {
  let active = false;
  let cancelled = false;
  let keyframes = [];
  let currentMode = GLOBE_MODE.GLOBE_2D;

  const setMode = (next) => {
    currentMode = transitionGlobeMode(currentMode, next);
    onModeChange?.(currentMode);
    return currentMode;
  };

  const playKeyframes = async (frames, { startIndex = 0 } = {}) => {
    for (let i = startIndex; i < frames.length; i += 1) {
      if (cancelled) return;
      const frame = frames[i];
      await applyKeyframe(map, frame, { immediate: i === startIndex && !frame.duration });
    }
  };

  return {
    getMode: () => currentMode,

    async start({ slug, lat, lng, location } = {}) {
      if (!map || map._removed || active) return false;
      active = true;
      cancelled = false;

      const resolvedSlug = resolveGlobeTourSlug(location || { slug, lat, lng });
      const landmark = resolvedSlug ? globeLandmarks[resolvedSlug] : null;
      keyframes = resolveTourKeyframes(resolvedSlug, lng, lat);

      setMode(GLOBE_MODE.TOUR_BOOTSTRAPPING);
      onTourUiChange?.(true);
      map.stop();

      // Snap near landmark before terrain load (no globe-scale flyTo).
      await applyKeyframe(map, keyframes[0], { immediate: true });

      try {
        await bootstrapGlobe3d(map, {
          exaggeration: landmark?.exaggeration ?? 1.5,
          buildings: Boolean(landmark?.buildings)
        });
      } catch {
        active = false;
        onTourUiChange?.(false);
        setMode(GLOBE_MODE.GLOBE_2D);
        teardownGlobe3d(map);
        return false;
      }

      if (cancelled) {
        active = false;
        onTourUiChange?.(false);
        return false;
      }

      setMode(GLOBE_MODE.TOUR_PLAYING);
      await playKeyframes(keyframes, { startIndex: 1 });

      if (!cancelled) {
        setMode(GLOBE_MODE.TOUR_READY);
      }
      active = false;
      return !cancelled;
    },

    skip() {
      if (!map) return;
      cancelled = true;
      active = false;
      map.stop();

      if (keyframes.length > 1) {
        const last = keyframes[keyframes.length - 1];
        applyKeyframe(map, last, { immediate: true });
        setMode(GLOBE_MODE.TOUR_READY);
        return;
      }

      teardownGlobe3d(map);
      onTourUiChange?.(false);
      setMode(GLOBE_MODE.GLOBE_2D);
      keyframes = [];
    },

    async end() {
      if (!map || map._removed) return;
      cancelled = true;
      active = false;
      map.stop();

      const fallback = defaultView || {
        center: [0, 20],
        zoom: 1.25,
        pitch: 0,
        bearing: 0
      };

      teardownGlobe3d(map);
      onTourUiChange?.(false);
      setMode(GLOBE_MODE.GLOBE_2D);

      map.flyTo({
        ...fallback,
        duration: 1400,
        essential: true
      });
      await waitForMoveEnd(map);
      keyframes = [];
    }
  };
}
