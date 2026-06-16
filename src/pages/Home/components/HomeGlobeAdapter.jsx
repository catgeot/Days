import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import HomeGlobeLegacy from './HomeGlobe';
import HomeGlobeMapbox from './HomeGlobeMapbox';
import { resolveHomeGlobeEngine } from './resolveHomeGlobeEngine';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

  useImperativeHandle(ref, () => ({
    pauseRotation: () => childRef.current?.pauseRotation?.(),
    resumeRotation: () => childRef.current?.resumeRotation?.(),
    flyToAndPin: (lat, lng, name, category, options) => childRef.current?.flyToAndPin?.(lat, lng, name, category, options),
    updateLastPinName: (...args) => childRef.current?.updateLastPinName?.(...args),
    triggerRipple: (lat, lng) => childRef.current?.triggerRipple?.(lat, lng),
    resetPins: () => childRef.current?.resetPins?.(),
    startTour: (location) => childRef.current?.startTour?.(location),
    skipTour: () => childRef.current?.skipTour?.(),
    endTour: () => childRef.current?.endTour?.(),
    pivotTourExplore: (location) => childRef.current?.pivotTourExplore?.(location),
    startFlightCinema: (params) => childRef.current?.startFlightCinema?.(params),
    skipFlightCinema: () => childRef.current?.skipFlightCinema?.(),
    closeFlightCinema: () => childRef.current?.closeFlightCinema?.(),
    getGlobeMode: () => childRef.current?.getGlobeMode?.()
  }), []);

  if (activeEngine === 'mapbox') {
    return (
      <HomeGlobeMapbox
        ref={childRef}
        {...props}
        onFatalError={(error) => {
          if (import.meta.env.DEV) {
            console.warn('[HomeGlobeAdapter] mapbox fatal error:', error);
          }
        }}
      />
    );
  }

  return <HomeGlobeLegacy ref={childRef} {...props} />;
});

HomeGlobeAdapter.displayName = 'HomeGlobeAdapter';

export default HomeGlobeAdapter;
