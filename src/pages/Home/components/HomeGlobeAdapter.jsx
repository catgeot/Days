import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import HomeGlobeLegacy from './HomeGlobe';
import HomeGlobeMapbox from './HomeGlobeMapbox';
import { resolveHomeGlobeEngine } from './resolveHomeGlobeEngine';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HomeGlobeAdapter = forwardRef((props, ref) => {
  const initialEngine = useMemo(
    () => resolveHomeGlobeEngine({ mapboxToken: MAPBOX_TOKEN }),
    []
  );
  const [activeEngine, setActiveEngine] = useState(initialEngine);
  const childRef = useRef(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN && import.meta.env.DEV) {
      console.warn('[HomeGlobeAdapter] mapbox token missing. Falling back to legacy.');
    }
  }, []);

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
