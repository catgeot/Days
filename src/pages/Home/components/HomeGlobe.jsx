import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { getMarkerDesign } from '../data/markers';
import { citiesData } from '../data/citiesData';

const GLOBE_CAMERA_CONFIG = {
  DEFAULT_ALT: 2.5,
  ZOOM_THRESHOLD: 2.2,
  AUTO_ROTATE_DISABLE_ALT: 2.2,
  FLY_DISABLE_ALT: 1.8,
  FLY_DURATION: 3000,
  IDLE_DELAY_ZOOMED_OUT: 4000,
  AUTO_ROTATE_SPEED: 0.5,
  LABEL_RESOLUTION: 2
};

const HomeGlobe = React.memo(forwardRef(({
  onGlobeClick, onMarkerClick, isChatOpen, savedTrips = [],
  tempPinsData = [],
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'deep',
  isZenMode = false
}, ref) => {
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const rotationTimer = useRef(null);
  const [ripples, setRipples] = useState([]);

  const isHoveringMarker = useRef(false);

  const [lodLevel, setLodLevel] = useState(0);
  const lodLevelRef = useRef(0);

  const themeConfig = useMemo(() => {
    switch(globeTheme) {
      case 'deep':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#000000",
          atmAlt: 0.00
        };
      case 'bright':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-day.jpg",
          atmColor: "#ffffff",
          atmAlt: 0.3
        };
      case 'neon':
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#00ffff",
          atmAlt: 0.25
        };
      default:
        return {
          imageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          atmColor: "#000000",
          atmAlt: 0.00
        };
    }
  }, [globeTheme]);

  const handleInteraction = () => {
    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    if (globeEl.current) globeEl.current.controls().autoRotate = false;
  };

  useImperativeHandle(ref, () => ({
    pauseRotation: () => {
      if(globeEl.current) globeEl.current.controls().autoRotate = false;
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => {
      if (pauseRender) return;
      if(globeEl.current) globeEl.current.controls().autoRotate = true;
    },
    flyToAndPin: (lat, lng, name, category) => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);

      if (globeEl.current) {
        const currentAlt = globeEl.current.pointOfView().altitude;

        if (currentAlt <= GLOBE_CAMERA_CONFIG.FLY_DISABLE_ALT) {
          globeEl.current.controls().autoRotate = false;
          return;
        }

        globeEl.current.controls().autoRotate = false;

        const isZoomedIn = currentAlt < GLOBE_CAMERA_CONFIG.ZOOM_THRESHOLD;
        const targetAlt = isZoomedIn ? currentAlt : GLOBE_CAMERA_CONFIG.DEFAULT_ALT;

        globeEl.current.pointOfView({ lat, lng, altitude: targetAlt }, GLOBE_CAMERA_CONFIG.FLY_DURATION);

        const newRipple = { lat, lng, maxR: 8, propagationSpeed: 3, repeatPeriod: 800 };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 2000);

        if (isZoomedIn) {
        } else {
          const totalWaitTime = GLOBE_CAMERA_CONFIG.FLY_DURATION + GLOBE_CAMERA_CONFIG.IDLE_DELAY_ZOOMED_OUT;
          rotationTimer.current = setTimeout(() => {
            const checkAlt = globeEl.current ? globeEl.current.pointOfView().altitude : 99;
            if (globeEl.current && !pauseRender && checkAlt > GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
               globeEl.current.controls().autoRotate = true;
            }
          }, totalWaitTime);
        }
      }
    },
    updateLastPinName: () => {},
    triggerRipple: (lat, lng) => {
      const newRipple = { lat, lng, maxR: 5, propagationSpeed: 4, repeatPeriod: 500 };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r !== newRipple)), 1500);
    },
    resetPins: () => {
        setRipples([]);
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT }, 1500);
        }
        if (rotationTimer.current) {
            clearTimeout(rotationTimer.current);
            rotationTimer.current = null;
        }
    },
  }));

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    if (!globeEl.current || !globeEl.current.controls) return;
    const controls = globeEl.current.controls();
    if (!controls) return;

    const isMobile = dimensions.width < 768;
    try {
      const R = globeEl.current.getGlobeRadius();
      controls.minDistance = isMobile ? R * (1 + 1.5) : R * 1.01;
    } catch (e) {
      controls.minDistance = isMobile ? 250 : 101;
    }
  }, [dimensions.width, pauseRender]);

  useEffect(() => {
    const initCameraListener = () => {
      if (!globeEl.current || !globeEl.current.controls) return;
      const controls = globeEl.current.controls();
      if (!controls) return;

      const handleCameraChange = () => {
        if (!globeEl.current) return;
        const alt = globeEl.current.pointOfView().altitude;

        const newLevel = alt <= 1.75 ? 1 : 0;
        if (newLevel !== lodLevelRef.current) {
          lodLevelRef.current = newLevel;
          setLodLevel(newLevel);
        }

        if (!pauseRender && globeEl.current.controls) {
          if (alt <= GLOBE_CAMERA_CONFIG.AUTO_ROTATE_DISABLE_ALT) {
            globeEl.current.controls().autoRotate = false;
          } else {
            globeEl.current.controls().autoRotate = true;
          }
        }
      };

      controls.addEventListener('change', handleCameraChange);
      return () => controls.removeEventListener('change', handleCameraChange);
    };

    const timeoutId = setTimeout(initCameraListener, 500);
    return () => clearTimeout(timeoutId);
  }, [pauseRender]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = isZenMode ? 0.3 : GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED;
      if (pauseRender && rotationTimer.current) clearTimeout(rotationTimer.current);
    }
  }, [pauseRender, isZenMode]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = !pauseRender;
      globeEl.current.controls().autoRotateSpeed = GLOBE_CAMERA_CONFIG.AUTO_ROTATE_SPEED;
      globeEl.current.pointOfView({ altitude: GLOBE_CAMERA_CONFIG.DEFAULT_ALT });
    }
  }, []);

  const handleGlobeClickInternal = ({ lat, lng }) => {
    if (isZenMode) return;

    if (isHoveringMarker.current) return;

    if (pauseRender) return;
    if (onGlobeClick) onGlobeClick({ lat, lng });
  };

  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    travelSpots.forEach(spot => { result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false }); });

    let chatCount = 0;
    savedTrips.forEach(trip => {
        const isBookmarked = trip.is_bookmarked;
        if (!isBookmarked) { if (chatCount >= 5) return; chatCount++; }
        const idx = findMatchIndex(trip.lat, trip.lng);
        const fixedName = trip.name || trip.destination || "Saved Place";

        if (idx !== -1) {
            if (isBookmarked) result[idx].isBookmarked = true;
            else result[idx].hasChat = true;
            result[idx].tripId = trip.id;
        } else {
            result.push({
                ...trip,
                name: fixedName,
                type: 'temp-base',
                priority: isBookmarked ? 4 : 3,
                isBookmarked: isBookmarked,
                hasChat: !isBookmarked
            });
        }
    });

    const activePin = tempPinsData.find(p => p.id === activePinId);

    if (tempPinsData && tempPinsData.length > 0) {
        tempPinsData.forEach(pin => {
            const isActive = (pin.id === activePinId);
            if (!isActive && activePin) { if (Math.abs(pin.lat - activePin.lat) < threshold && Math.abs(pin.lng - activePin.lng) < threshold) return; }
            const idx = findMatchIndex(pin.lat, pin.lng);
            if (idx !== -1) {
                if (isActive) { result[idx].isActive = true; result[idx].isGhost = false; }
                else { result[idx].isGhost = true; }
            } else {
                result.push({ ...pin, type: 'temp-base', name: pin.name || "Searching...", isActive: isActive, isGhost: !isActive });
            }
        });
    }

    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

  const visibleLabels = useMemo(() => {
    return lodLevel === 1 ? citiesData : [];
  }, [lodLevel]);

  const renderElement = (d) => {
    const el = document.createElement('div');
    el.className = 'globe-marker-wrapper';
    el.style.position = 'absolute';
    el.style.pointerEvents = 'auto';
    el.style.transition = 'opacity 0.4s ease';

    const { html, zIndex, offsetY } = getMarkerDesign(d);
    el.innerHTML = html;
    el.style.zIndex = zIndex;

    el.ontouchstart = (e) => {
      e.stopPropagation();
    };

    el.onpointerdown = (e) => {
      if (e.pointerType === 'touch') {
        e.stopPropagation();
      }
    };

    el.onclick = (e) => {
      e.stopPropagation();
      if (onMarkerClick) onMarkerClick(d, 'globe');
    };

    el.onmouseenter = () => {
      isHoveringMarker.current = true;
      const innerDiv = el.querySelector('div');
      if(innerDiv) innerDiv.style.transform = `translate(-50%, ${offsetY}) scale(1.5)`;
    };
    el.onmouseleave = () => {
      isHoveringMarker.current = false;
      const innerDiv = el.querySelector('div');
      if(innerDiv) innerDiv.style.transform = `translate(-50%, ${offsetY}) scale(1)`;
    };
    return el;
  };

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'} ${lodLevel > 0 ? 'hide-markers' : ''}`}
      onPointerDown={handleInteraction}
      style={{ display: pauseRender ? 'none' : 'block', touchAction: 'none' }}
    >
      <style>{`
        .hide-markers .globe-marker-wrapper {
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}

        globeImageUrl={themeConfig.imageUrl}
        atmosphereColor={themeConfig.atmColor}
        atmosphereAltitude={themeConfig.atmAlt}

        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        onGlobeClick={handleGlobeClickInternal}

        ringsData={ripples}
        ringColor={() => '#60a5fa'}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"

        htmlElementsData={lodLevel > 0 ? [] : (isZenMode ? [] : allMarkers)}
        htmlElement={renderElement}
        htmlTransitionDuration={0}

        labelsData={isZenMode ? [] : visibleLabels}
        labelLat={d => d.lat + (d.offLat || 0)}
        labelLng={d => d.lng + (d.offLng || 0)}
        labelText={d => d.name_en}
        labelSize={d => d.priority === 1 ? 1.2 : 0.7}
        labelDotRadius={0.15}
        labelColor={d => d.priority === 1 ? 'rgba(0, 247, 255, 1)' : 'rgba(103, 232, 249, 0.85)'}
        labelResolution={dimensions.width < 768 ? 1 : GLOBE_CAMERA_CONFIG.LABEL_RESOLUTION}
        labelAltitude={0.01}

        onLabelClick={(d, event) => {
          if (onMarkerClick) onMarkerClick({ ...d, type: 'city-label' }, 'globe');
        }}
      />
    </div>
  );
}));

export default HomeGlobe;
