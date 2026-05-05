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
  // Deep now uses the previous neon globe style as default.
  deep: 'mapbox://styles/mapbox/satellite-streets-v12',
  bright: 'mapbox://styles/mapbox/standard',
  neon: 'mapbox://styles/mapbox/satellite-streets-v12'
};

const GLOBE_SPACE_FOG_BASE = {
  range: [0.8, 8],
  'space-color': '#01030a',
  'star-intensity': 0.32
};

const ATMOSPHERE_BY_THEME = {
  deep: {
    // Subtle blue outline, weaker than neon.
    color: '#1b2f52',
    'high-color': '#2a4a78',
    'horizon-blend': 0.012
  },
  bright: {
    // Legacy HomeGlobe: atmColor "#ffffff", atmAlt 0.3
    color: '#3f4b63',
    'high-color': '#5c6f93',
    'horizon-blend': 0.02
  },
  neon: {
    // Legacy HomeGlobe: atmColor "#00ffff", atmAlt 0.25
    color: '#245563',
    'high-color': '#2f6f80',
    'horizon-blend': 0.018
  }
};

const WATER_COLOR_BY_THEME = {
  deep: '#0b1f52',
  neon: '#1d4ed8'
};

const PLACE_LABEL_MIN_ZOOM = 3.5;
const GLOBE_CLICK_TOLERANCE_PX = 3;
const DRAG_CLICK_GUARD_MS = 180;
const PLACE_LABEL_LAYER_HINTS = [
  'place-label',
  'settlement',
  'country-label',
  'state-label'
];
const HIDDEN_OVERLAY_LAYER_HINTS = [
  'road',
  'street',
  'highway',
  'motorway',
  'admin',
  'boundary',
  'border',
  'disputed',
  'transit',
  'rail',
  'ferry'
];
const ADMIN_BOUNDARY_HINTS = ['admin', 'boundary', 'border', 'disputed'];

const GLOBE_VIEW = {
  default: { longitude: 0, latitude: 20, zoom: 1.25, pitch: 0, bearing: 0 },
  flyZoom: 2.35,
  maxZoom: 22,
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
  const suppressClickUntilRef = useRef(0);
  const placeLabelLayerIdsRef = useRef([]);
  const allSymbolLayerIdsRef = useRef([]);
  const allLineLayerIdsRef = useRef([]);
  const hiddenFillLayerIdsRef = useRef([]);
  const adminBoundaryLayerIdsRef = useRef([]);
  const lastPlaceLabelVisibleRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [ripples, setRipples] = useState([]);
  const fogConfig = useMemo(() => {
    const atmosphere = ATMOSPHERE_BY_THEME[globeTheme] || ATMOSPHERE_BY_THEME.deep;
    return { ...GLOBE_SPACE_FOG_BASE, ...atmosphere };
  }, [globeTheme]);

  const refreshPlaceLabelLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getStyle) return;
    const layers = map.getStyle()?.layers || [];
    const symbolLayers = layers.filter((layer) => layer.type === 'symbol');

    allSymbolLayerIdsRef.current = symbolLayers.map((layer) => layer.id);
    allLineLayerIdsRef.current = layers
      .filter((layer) => layer.type === 'line')
      .map((layer) => layer.id);
    hiddenFillLayerIdsRef.current = layers
      .filter((layer) => layer.type === 'fill' || layer.type === 'fill-extrusion')
      .filter((layer) => {
        const id = layer.id || '';
        const sourceLayer = layer['source-layer'] || '';
        return HIDDEN_OVERLAY_LAYER_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      })
      .map((layer) => layer.id);
    adminBoundaryLayerIdsRef.current = layers
      .filter((layer) => {
        const id = layer.id || '';
        const sourceLayer = layer['source-layer'] || '';
        return ADMIN_BOUNDARY_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      })
      .map((layer) => layer.id);

    placeLabelLayerIdsRef.current = symbolLayers
      .filter((layer) => Boolean(layer.layout && layer.layout['text-field']))
      .filter((layer) => {
        const id = layer.id || '';
        const sourceLayer = layer['source-layer'] || '';
        return PLACE_LABEL_LAYER_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      })
      .map((layer) => layer.id);
  }, []);

  const ensureInteractionReady = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    try {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.touchZoomRotate.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.resize();
      requestAnimationFrame(() => map.resize());
    } catch {
      // Ignore interaction bootstrap errors.
    }
  }, []);

  const applyBasemapConfig = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || typeof map.setConfigProperty !== 'function') return;
    const shouldShowPlaceLabels = map.getZoom() >= PLACE_LABEL_MIN_ZOOM;
    const configEntries = [
      ['showPointOfInterestLabels', false],
      ['showRoadLabels', false],
      ['showTransitLabels', false],
      ['showRoadsAndTransit', false],
      // "Administrative boundaries" key on Mapbox Standard family.
      ['showAdminBoundaries', false],
      // Backward compatibility for previously attempted key.
      ['showAdministrativeBoundaries', false],
      ['showPlaceLabels', shouldShowPlaceLabels]
    ];

    configEntries.forEach(([key, value]) => {
      try {
        map.setConfigProperty('basemap', key, value);
      } catch {
        // Ignore unsupported style config keys per-style.
      }
    });
  }, []);

  const applyPlaceLabelVisibility = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const shouldShowPlaceLabels = map.getZoom() >= PLACE_LABEL_MIN_ZOOM;
    if (lastPlaceLabelVisibleRef.current === shouldShowPlaceLabels) return;

    allSymbolLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      } catch {
        // Ignore layer visibility update failures.
      }
    });

    allLineLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      } catch {
        // Ignore layer visibility update failures.
      }
    });

    hiddenFillLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      } catch {
        // Ignore layer visibility update failures.
      }
    });

    adminBoundaryLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      } catch {
        // Ignore layer visibility update failures.
      }
    });

    placeLabelLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'visibility', shouldShowPlaceLabels ? 'visible' : 'none');
      } catch {
        // Ignore layer visibility update failures.
      }
    });
    applyBasemapConfig();
    lastPlaceLabelVisibleRef.current = shouldShowPlaceLabels;
  }, [applyBasemapConfig]);

  const resetAndApplyPlaceLabelVisibility = useCallback(() => {
    lastPlaceLabelVisibleRef.current = null;
    applyPlaceLabelVisibility();
  }, [applyPlaceLabelVisibility]);

  const applyWaterPaint = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (globeTheme !== 'deep' && globeTheme !== 'neon') return;

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
    if (Date.now() < suppressClickUntilRef.current) return;
    if (isZenMode || isHoveringMarker.current || pauseRender) return;
    if (!onGlobeClick || !event?.lngLat) return;
    onGlobeClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  }, [isZenMode, onGlobeClick, pauseRender]);

  const handleInteractionStart = useCallback(() => {
    interactionRef.current = true;
    autoRotateRef.current = false;
  }, []);

  const handleInteractionEnd = useCallback(() => {
    interactionRef.current = false;
  }, []);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'}`}
      style={{ display: pauseRender ? 'none' : 'block' }}
      onPointerDown={handleInteractionStart}
      onPointerUp={handleInteractionEnd}
      onPointerCancel={handleInteractionEnd}
      onPointerLeave={handleInteractionEnd}
      onWheel={handleInteractionStart}
    >
      <Map
        ref={mapRef}
        initialViewState={GLOBE_VIEW.default}
        projection="globe"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[globeTheme] || MAP_STYLES.deep}
        onClick={handleGlobeClickInternal}
        onError={(evt) => raiseFatal(evt?.error || new Error('Mapbox render error'))}
        onLoad={() => {
          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          resetAndApplyPlaceLabelVisibility();
        }}
        onStyleData={() => {
          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          resetAndApplyPlaceLabelVisibility();
        }}
        onIdle={() => {
          refreshPlaceLabelLayers();
          resetAndApplyPlaceLabelVisibility();
        }}
        onDragStart={() => {
          interactionRef.current = true;
          autoRotateRef.current = false;
          suppressClickUntilRef.current = Date.now() + DRAG_CLICK_GUARD_MS;
        }}
        onDragEnd={() => {
          interactionRef.current = false;
          suppressClickUntilRef.current = Date.now() + DRAG_CLICK_GUARD_MS;
        }}
        onZoomStart={() => {
          interactionRef.current = true;
          autoRotateRef.current = false;
        }}
        onZoomEnd={() => {
          interactionRef.current = false;
        }}
        onZoom={() => {
          applyPlaceLabelVisibility();
        }}
        style={{ width: dimensions.width, height: dimensions.height }}
        minZoom={1}
        maxZoom={GLOBE_VIEW.maxZoom}
        clickTolerance={GLOBE_CLICK_TOLERANCE_PX}
        dragPan
        touchZoomRotate
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
