import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import HomeGlobeLegacy from './HomeGlobe';
import HomeGlobeMapbox from './HomeGlobeMapbox';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HomeGlobeAdapter = forwardRef((props, ref) => {
  const initialEngine = useMemo(() => {
    if (!MAPBOX_TOKEN) return 'legacy';
    if (!import.meta.env.DEV) return 'mapbox';
    try {
      const ua = window.navigator?.userAgent || '';
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
      // For local-device QA, mobile dev sessions default to legacy globe.
      if (isMobile) return 'legacy';
    } catch {
      // Keep mapbox default on detection failure.
    }
    return 'mapbox';
  }, []);
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
    resetPins: () => childRef.current?.resetPins?.()
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
