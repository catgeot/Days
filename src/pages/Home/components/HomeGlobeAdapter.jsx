import React, {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
const HomeGlobeMapbox = lazy(() => import('./HomeGlobeMapbox'));
const HomeGlobeLegacy = lazy(() => import('./HomeGlobe'));
import { resolveHomeGlobeEngine } from './resolveHomeGlobeEngine';
import {
  createGlobeAdapterCameraQueue,
  flushGlobeAdapterCameraQueue,
  registerGlobeApi,
  unregisterGlobeApi,
} from '../lib/globeApiRegistry.js';
import { flushCurationGlobeSyncIfPending } from '../lib/curationPlaceBridge.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const CAMERA_QUEUE_KINDS = new Set(['flyToAndPin', 'flyToRegion', 'immerseToPin']);

function queueCameraCommand(queueRef, kind, args) {
  if (!CAMERA_QUEUE_KINDS.has(kind)) return;
  queueRef.current.set(kind, args);
}

function childCanRunCamera(child) {
  if (!child) return false;
  const ready = child.isGlobeFocusReady;
  if (typeof ready !== 'function') return true;
  return Boolean(ready());
}

function delegateCamera(child, kind, args) {
  const fn = child?.[kind];
  if (typeof fn !== 'function') {
    if (kind === 'flyToRegion' || kind === 'immerseToPin') return false;
    return undefined;
  }
  return fn(...args);
}

const HomeGlobeAdapter = forwardRef((props, ref) => {
  const initialEngine = useMemo(
    () => resolveHomeGlobeEngine({
      mapboxToken: MAPBOX_TOKEN,
      search: typeof window !== 'undefined' ? window.location.search : '',
    }),
    []
  );
  const [activeEngine, setActiveEngine] = useState(initialEngine);
  const childRef = useRef(null);
  const cameraQueueRef = useRef(createGlobeAdapterCameraQueue());
  const globeApiPublishedRef = useRef(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN && import.meta.env.DEV) {
      console.warn('[HomeGlobeAdapter] mapbox token missing. Falling back to legacy.');
      return;
    }
    if (import.meta.env.DEV && initialEngine === 'mapbox') {
      console.info(
        '[HomeGlobeAdapter] DEV Mapbox — LAN 모바일 QA는 URL 제한 없는 토큰(.env.local) 필요. legacy 강제: ?globe=legacy'
      );
    }
  }, [initialEngine]);

  const globeApiRef = useRef(null);

  const flushPendingCameraWhenReady = useCallback(() => {
    const child = childRef.current;
    if (!childCanRunCamera(child) || !cameraQueueRef.current.peek()) return false;
    flushGlobeAdapterCameraQueue(cameraQueueRef.current, child);
    return true;
  }, []);

  const runWhenGlobeFocusReady = useCallback((options) => {
    const child = childRef.current;
    if (child?.whenGlobeFocusReady) {
      return child.whenGlobeFocusReady(options);
    }
    const timeoutMs = options?.timeoutMs ?? 4000;
    const intervalMs = options?.intervalMs ?? 80;
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const current = childRef.current;
        if (current?.whenGlobeFocusReady) {
          current.whenGlobeFocusReady(options).then(resolve);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }
        window.setTimeout(tick, intervalMs);
      };
      window.setTimeout(tick, intervalMs);
    });
  }, []);

  const scheduleFlushPendingCamera = useCallback(() => {
    if (flushPendingCameraWhenReady()) return;
    runWhenGlobeFocusReady({ timeoutMs: 8_000 }).then((ok) => {
      if (ok) flushPendingCameraWhenReady();
    });
  }, [flushPendingCameraWhenReady, runWhenGlobeFocusReady]);

  const publishGlobeApiWhenReady = useCallback(() => {
    if (globeApiPublishedRef.current) return;
    const child = childRef.current;
    if (!child) return;

    globeApiPublishedRef.current = true;
    if (globeApiRef.current) {
      registerGlobeApi(globeApiRef.current);
      flushCurationGlobeSyncIfPending();
      scheduleFlushPendingCamera();
    }
  }, [scheduleFlushPendingCamera]);

  const handleGlobeReady = useCallback(() => {
    publishGlobeApiWhenReady();
    scheduleFlushPendingCamera();
  }, [publishGlobeApiWhenReady, scheduleFlushPendingCamera]);

  const assignChildRef = useCallback(
    (node) => {
      childRef.current = node;
      if (node && activeEngine !== 'mapbox') {
        publishGlobeApiWhenReady();
      }
    },
    [activeEngine, publishGlobeApiWhenReady],
  );

  const runCameraMethod = useCallback((kind, args) => {
    const child = childRef.current;
    if (childCanRunCamera(child)) {
      return delegateCamera(child, kind, args);
    }
    queueCameraCommand(cameraQueueRef, kind, args);
    scheduleFlushPendingCamera();
    if (kind === 'flyToRegion' || kind === 'immerseToPin') return false;
    return undefined;
  }, [scheduleFlushPendingCamera]);

  useImperativeHandle(ref, () => {
    const api = {
      pauseRotation: () => childRef.current?.pauseRotation?.(),
      resumeRotation: () => childRef.current?.resumeRotation?.(),
      wakeAfterOverlay: () => childRef.current?.wakeAfterOverlay?.(),
      requestGateoMarkerReveal: () => childRef.current?.requestGateoMarkerReveal?.(),
      markCameraBusy: () => childRef.current?.markCameraBusy?.(),
      flyToAndPin: (lat, lng, name, category, options) =>
        runCameraMethod('flyToAndPin', [lat, lng, name, category, options]),
      flyToRegion: (lat, lng, zoom) => runCameraMethod('flyToRegion', [lat, lng, zoom]),
      clearRegionFocus: () => childRef.current?.clearRegionFocus?.(),
      immerseToPin: (lat, lng, options) => runCameraMethod('immerseToPin', [lat, lng, options]),
      exitImmerse: (lat, lng) => childRef.current?.exitImmerse?.(lat, lng) ?? false,
      clearImmerseState: () => childRef.current?.clearImmerseState?.(),
      isImmersed: () => childRef.current?.isImmersed?.() ?? false,
      getMapView: () => childRef.current?.getMapView?.() ?? null,
      updateLastPinName: (...args) => childRef.current?.updateLastPinName?.(...args),
      triggerRipple: (lat, lng) => childRef.current?.triggerRipple?.(lat, lng),
      resetPins: () => childRef.current?.resetPins?.(),
      startTour: (location) => childRef.current?.startTour?.(location),
      skipTour: () => childRef.current?.skipTour?.(),
      endTour: () => childRef.current?.endTour?.(),
      pivotTourExplore: (location) => childRef.current?.pivotTourExplore?.(location),
      startFlightCinema: (params) => childRef.current?.startFlightCinema?.(params),
      closeFlightCinema: () => childRef.current?.closeFlightCinema?.(),
      isFlightCinemaReady: () => childRef.current?.isFlightCinemaReady?.() ?? false,
      waitForFlightCinemaReady: (options) =>
        childRef.current?.waitForFlightCinemaReady?.(options) ?? Promise.resolve(false),
      isGlobeFocusReady: () => childRef.current?.isGlobeFocusReady?.() ?? false,
      whenGlobeFocusReady: (options) => runWhenGlobeFocusReady(options),
      getGlobeMode: () => childRef.current?.getGlobeMode?.(),
      suppressOverlayClick: (ms) => childRef.current?.suppressOverlayClick?.(ms),
    };
    globeApiRef.current = api;
    return api;
  }, [runCameraMethod, runWhenGlobeFocusReady]);

  useLayoutEffect(() => {
    return () => {
      cameraQueueRef.current.clear();
      globeApiPublishedRef.current = false;
      if (globeApiRef.current) unregisterGlobeApi(globeApiRef.current);
    };
  }, []);

  if (activeEngine === 'mapbox') {
    return (
      <Suspense fallback={null}>
        <HomeGlobeMapbox
          ref={assignChildRef}
          {...props}
          onGlobeReady={handleGlobeReady}
          onFatalError={(error) => {
            if (import.meta.env.DEV) {
              console.warn('[HomeGlobeAdapter] mapbox fatal error:', error);
            }
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
      <HomeGlobeLegacy ref={assignChildRef} {...props} />
    </Suspense>
  );
});

HomeGlobeAdapter.displayName = 'HomeGlobeAdapter';

export default HomeGlobeAdapter;
