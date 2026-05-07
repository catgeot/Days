import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import HomeGlobeLegacy from './HomeGlobe';
import HomeGlobeMapbox from './HomeGlobeMapbox';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ENV_ENGINE = import.meta.env.VITE_HOME_GLOBE_ENGINE;

const normalizeEngine = (value) => (value === 'mapbox' ? 'mapbox' : 'legacy');

const resolvePreferredEngine = () => {
  let preferred = ENV_ENGINE ? normalizeEngine(ENV_ENGINE) : 'mapbox';
  try {
    const urlEngine = new URLSearchParams(window.location.search).get('globeEngine');
    const localEngine = window.localStorage.getItem('home_globe_engine');
    if (localEngine) preferred = normalizeEngine(localEngine);
    if (urlEngine) preferred = normalizeEngine(urlEngine);
  } catch {
    // keep env default only
  }
  return preferred;
};

const HomeGlobeAdapter = forwardRef((props, ref) => {
  const preferred = useMemo(resolvePreferredEngine, []);
  const initialEngine = preferred === 'mapbox' && MAPBOX_TOKEN ? 'mapbox' : 'legacy';
  const [activeEngine, setActiveEngine] = useState(initialEngine);
  const childRef = useRef(null);

  useEffect(() => {
    if (preferred === 'mapbox' && !MAPBOX_TOKEN && import.meta.env.DEV) {
      console.warn('[HomeGlobeAdapter] mapbox requested but token missing. Falling back to legacy.');
    }
  }, [preferred]);

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
        onFatalError={() => {
          setActiveEngine('legacy');
        }}
      />
    );
  }

  return <HomeGlobeLegacy ref={childRef} {...props} />;
});

HomeGlobeAdapter.displayName = 'HomeGlobeAdapter';

export default HomeGlobeAdapter;
