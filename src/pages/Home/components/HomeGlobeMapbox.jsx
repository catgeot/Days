import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMarkerDesign } from '../data/markers';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_STYLES = {
  deep: 'mapbox://styles/mapbox/satellite-streets-v12',
  bright: 'mapbox://styles/mapbox/light-v11',
  neon: 'mapbox://styles/mapbox/navigation-night-v1'
};

const FOG_BY_THEME = {
  deep: {
    range: [0.8, 8],
    color: '#142043',
    'horizon-blend': 0.1,
    'high-color': '#1a2e63',
    'space-color': '#01030a',
    'star-intensity': 0.32
  },
  bright: {
    range: [0.9, 8.5],
    color: '#9fc4ff',
    'horizon-blend': 0.24,
    'high-color': '#dbeafe',
    'space-color': '#0f172a',
    'star-intensity': 0.35
  },
  neon: {
    range: [0.7, 7.8],
    color: '#2d2a66',
    'horizon-blend': 0.12,
    'high-color': '#4f46e5',
    'space-color': '#030014',
    'star-intensity': 0.95
  }
};

const WATER_COLOR_BY_THEME = {
  deep: '#0b1f52',
  bright: '#3b82f6',
  neon: '#1d4ed8'
};

const GLOBE_VIEW = {
  default: { longitude: 0, latitude: 20, zoom: 1.25, pitch: 0, bearing: 0 },
  flyZoom: 2.35,
  maxZoom: 5,
  rotateZoomThreshold: 2.4,
  flyDuration: 3000
};

const HomeGlobeMapbox = React.memo(forwardRef(({
  onGlobeClick,
  onMarkerClick,
  isChatOpen,
  savedTrips = [],
  tempPinsData = [],
  travelSpots = [],
  activePinId,
  pauseRender = false,
  globeTheme = 'deep',
  isZenMode = false,
  onFatalError
}, ref) => {
  const mapRef = useRef(null);
  const interactionRef = useRef(false);
  const autoRotateRef = useRef(!pauseRender);
  const rotationFrameRef = useRef(null);
  const rotationTimer = useRef(null);
  const isHoveringMarker = useRef(false);
  const hasRaisedFatalRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [ripples, setRipples] = useState([]);
  const fogConfig = FOG_BY_THEME[globeTheme] || FOG_BY_THEME.deep;

  const applyWaterPaint = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const waterColor = WATER_COLOR_BY_THEME[globeTheme] || WATER_COLOR_BY_THEME.deep;
    const layerIds = ['water', 'water-shadow', 'waterway'];

    layerIds.forEach((layerId) => {
      const layer = map.getLayer(layerId);
      if (!layer) return;
      try {
        if (layer.type === 'fill') {
          map.setPaintProperty(layerId, 'fill-color', waterColor);
          map.setPaintProperty(layerId, 'fill-opacity', 0.92);
        } else if (layer.type === 'line') {
          map.setPaintProperty(layerId, 'line-color', waterColor);
          map.setPaintProperty(layerId, 'line-opacity', 0.85);
        }
      } catch {
        // Ignore style paint errors per-layer.
      }
    });
  }, [globeTheme]);

  const raiseFatal = useCallback((error) => {
    if (hasRaisedFatalRef.current) return;
    hasRaisedFatalRef.current = true;
    if (typeof onFatalError === 'function') onFatalError(error);
  }, [onFatalError]);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      raiseFatal(new Error('VITE_MAPBOX_TOKEN is missing.'));
    }
  }, [raiseFatal]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(
      m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold
    );

    travelSpots
      .filter(spot => spot.showOnGlobe !== false)
      .forEach(spot => {
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
      });

    let chatCount = 0;
    savedTrips.forEach(trip => {
      const isBookmarked = trip.is_bookmarked;
      const hasMessageChat = tripHasPersistedDialogue(trip);
      if (!isBookmarked && !hasMessageChat) return;
      if (hasMessageChat && !isBookmarked) {
        if (chatCount >= 5) return;
        chatCount++;
      }
      const idx = findMatchIndex(trip.lat, trip.lng);
      const fixedName = trip.name || trip.destination || 'Saved Place';

      if (idx !== -1) {
        if (isBookmarked) result[idx].isBookmarked = true;
        if (hasMessageChat) result[idx].hasChat = true;
        result[idx].tripId = trip.id;
      } else {
        result.push({
          ...trip,
          name: fixedName,
          type: 'temp-base',
          priority: isBookmarked ? 4 : 3,
          isBookmarked,
          hasChat: hasMessageChat
        });
      }
    });

    const activePin = tempPinsData.find(p => p.id === activePinId);
    tempPinsData.forEach(pin => {
      const isActive = pin.id === activePinId;
      if (!isActive && activePin) {
        if (Math.abs(pin.lat - activePin.lat) < threshold && Math.abs(pin.lng - activePin.lng) < threshold) return;
      }

      const idx = findMatchIndex(pin.lat, pin.lng);
      if (idx !== -1) {
        if (isActive) {
          result[idx].isActive = true;
          result[idx].isGhost = false;
        } else {
          result[idx].isGhost = true;
        }
      } else {
        result.push({
          ...pin,
          type: 'temp-base',
          name: pin.name || 'Searching...',
          isActive,
          isGhost: !isActive
        });
      }
    });

    return result;
  }, [travelSpots, savedTrips, tempPinsData, activePinId]);

  const addRipple = useCallback((lat, lng, ttl = 1600) => {
    const ripple = { id: `${Date.now()}-${Math.random()}`, lat, lng };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(item => item.id !== ripple.id));
    }, ttl);
  }, []);

  const flyToAndPin = useCallback((lat, lng) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    autoRotateRef.current = false;
    map.flyTo({
      center: [lng, lat],
      zoom: GLOBE_VIEW.flyZoom,
      duration: GLOBE_VIEW.flyDuration,
      essential: true
    });
    addRipple(lat, lng, 2000);

    rotationTimer.current = setTimeout(() => {
      const currentZoom = map.getZoom();
      if (!pauseRender && currentZoom <= GLOBE_VIEW.rotateZoomThreshold) {
        autoRotateRef.current = true;
      }
    }, GLOBE_VIEW.flyDuration + 4000);
  }, [addRipple, pauseRender]);

  useImperativeHandle(ref, () => ({
    pauseRotation: () => {
      autoRotateRef.current = false;
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => {
      if (pauseRender) return;
      autoRotateRef.current = true;
    },
    flyToAndPin,
    updateLastPinName: () => {},
    triggerRipple: (lat, lng) => addRipple(lat, lng, 1500),
    resetPins: () => {
      setRipples([]);
      if (rotationTimer.current) {
        clearTimeout(rotationTimer.current);
        rotationTimer.current = null;
      }
      const map = mapRef.current?.getMap();
      if (map) {
        map.easeTo({ ...GLOBE_VIEW.default, duration: 1500 });
      }
      autoRotateRef.current = true;
    }
  }), [addRipple, flyToAndPin, pauseRender]);

  useEffect(() => {
    autoRotateRef.current = !pauseRender;
    if (pauseRender && rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
  }, [pauseRender]);

  useEffect(() => {
    const tick = (ts) => {
      const map = mapRef.current?.getMap();
      if (!map || pauseRender) {
        rotationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const shouldRotate = autoRotateRef.current && !interactionRef.current && map.getZoom() <= GLOBE_VIEW.rotateZoomThreshold;
      if (shouldRotate) {
        const speed = isZenMode ? 1.8 : 3;
        const center = map.getCenter();
        const lastTs = tick.lastTs || ts;
        const delta = (ts - lastTs) / 1000;
        tick.lastTs = ts;
        map.jumpTo({ center: [center.lng - delta * speed, center.lat] });
      } else {
        tick.lastTs = ts;
      }

      rotationFrameRef.current = requestAnimationFrame(tick);
    };

    rotationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (rotationFrameRef.current) cancelAnimationFrame(rotationFrameRef.current);
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    };
  }, [isZenMode, pauseRender]);

  const handleGlobeClickInternal = useCallback((event) => {
    if (isZenMode || isHoveringMarker.current || pauseRender) return;
    if (!onGlobeClick || !event?.lngLat) return;
    onGlobeClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  }, [isZenMode, onGlobeClick, pauseRender]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'}`}
      style={{ display: pauseRender ? 'none' : 'block', touchAction: 'none' }}
    >
      <Map
        ref={mapRef}
        initialViewState={GLOBE_VIEW.default}
        projection="globe"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[globeTheme] || MAP_STYLES.deep}
        onClick={handleGlobeClickInternal}
        onError={(evt) => raiseFatal(evt?.error || new Error('Mapbox render error'))}
        onLoad={() => applyWaterPaint()}
        onStyleData={() => applyWaterPaint()}
        onDragStart={() => {
          interactionRef.current = true;
          autoRotateRef.current = false;
        }}
        onDragEnd={() => {
          interactionRef.current = false;
        }}
        onZoomStart={() => {
          interactionRef.current = true;
          autoRotateRef.current = false;
        }}
        onZoomEnd={() => {
          interactionRef.current = false;
        }}
        style={{ width: dimensions.width, height: dimensions.height }}
        minZoom={1}
        maxZoom={GLOBE_VIEW.maxZoom}
        attributionControl={false}
        fog={fogConfig}
      >
        {!isZenMode && allMarkers.map((d, idx) => {
          const offsetLat = d._offsetLat || 0;
          const offsetLng = d._offsetLng || 0;
          const { html, zIndex } = getMarkerDesign(d);
          const key = d.id || d.tripId || `${d.lat}-${d.lng}-${idx}`;
          return (
            <Marker
              key={key}
              latitude={d.lat + offsetLat}
              longitude={d.lng + offsetLng}
              anchor="bottom"
            >
              <div
                className="globe-marker-wrapper"
                style={{ position: 'relative', zIndex, pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseEnter={() => { isHoveringMarker.current = true; }}
                onMouseLeave={() => { isHoveringMarker.current = false; }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkerClick) onMarkerClick(d, 'globe');
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Marker>
          );
        })}

        {ripples.map(ripple => (
          <Marker
            key={ripple.id}
            latitude={ripple.lat}
            longitude={ripple.lng}
            anchor="center"
          >
            <div className="relative pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-blue-400/60 animate-ping" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500/70" />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}));

export default HomeGlobeMapbox;
