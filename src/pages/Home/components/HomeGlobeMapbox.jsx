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

const PLACE_LABEL_MIN_ZOOM = 4.0;
const GLOBE_CLICK_TOLERANCE_PX = 3;
const DRAG_CLICK_GUARD_MS = 180;
const TIER_STAGE_ZOOM_LEVELS = {
  // Keep initial globe concise, then gradually reveal.
  tier1: 1.1,
  tier2: 2.45
};
const HIGH_ZOOM_FULL_REVEAL = 3.0;
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
const PLACE_LABEL_PROPERTY_KEYS = [
  'name_ko',
  'name',
  'name_en',
  'name_kr',
  'name_local',
  'name_int',
  'text',
  'title'
];
const PLACE_LABEL_ENGLISH_KEYS = ['name_en', 'name_int', 'name_latin', 'name:en', 'name'];

const GLOBE_VIEW = {
  default: { longitude: 0, latitude: 20, zoom: 1.25, pitch: 0, bearing: 0 },
  flyZoom: 2.35,
  maxZoom: 22,
  rotateZoomThreshold: 2.4,
  flyDuration: 3000
};

const normalizeLngDelta = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const areCoordsNear = (a, b, thresholdDeg) => {
  const latDiff = Math.abs(a.lat - b.lat);
  const lngDiff = normalizeLngDelta(a.lng, b.lng);
  return latDiff <= thresholdDeg && lngDiff <= thresholdDeg;
};

const getMaxTierForZoom = (zoom) => {
  if (zoom < TIER_STAGE_ZOOM_LEVELS.tier1) return 1;
  if (zoom < TIER_STAGE_ZOOM_LEVELS.tier2) return 2;
  return 3;
};

const getMajorMergeThreshold = (zoom) => {
  if (zoom >= HIGH_ZOOM_FULL_REVEAL) return 0.12;
  if (zoom < 1.7) return 1.75;
  if (zoom < 2.5) return 1.1;
  return 0.55;
};

const getMarkerCollisionThreshold = (zoom) => {
  if (zoom >= HIGH_ZOOM_FULL_REVEAL) return 0.06;
  if (zoom < 1.7) return 1.2;
  if (zoom < 2.5) return 0.82;
  return 0.42;
};

const HomeGlobeMapbox = React.memo(forwardRef(({
  onGlobeClick,
  onMarkerClick,
  isChatOpen,
  savedTrips = [],
  tempPinsData = [],
  travelSpots = [],
  allTravelSpots = [],
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
  const waitingThemeSettleRef = useRef(false);
  const pendingThemeCameraRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [ripples, setRipples] = useState([]);
  const [mobileActionMessage, setMobileActionMessage] = useState('');
  const [isStyleTransitioning, setIsStyleTransitioning] = useState(false);
  const [mapZoom, setMapZoom] = useState(GLOBE_VIEW.default.zoom);
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

  const syncMapZoom = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const zoom = map.getZoom();
    if (!Number.isFinite(zoom)) return;
    setMapZoom((prev) => (Math.abs(prev - zoom) < 0.01 ? prev : zoom));
  }, []);

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
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // During style/theme swap, briefly freeze marker rendering to avoid visual stacking/flicker.
    const map = mapRef.current?.getMap();
    if (map) {
      const center = map.getCenter();
      pendingThemeCameraRef.current = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing()
      };
    } else {
      pendingThemeCameraRef.current = null;
    }
    waitingThemeSettleRef.current = true;
    setIsStyleTransitioning(true);
  }, [globeTheme]);

  const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(
      m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold
    );
    const maxTier = getMaxTierForZoom(mapZoom);
    const isHighZoomFullReveal = mapZoom >= HIGH_ZOOM_FULL_REVEAL;
    const sourceSpots = isHighZoomFullReveal && allTravelSpots.length > 0 ? allTravelSpots : travelSpots;
    const majorCandidates = sourceSpots
      .filter((spot) => isHighZoomFullReveal || spot.showOnGlobe !== false)
      .filter((spot) => (Number(spot.tier) || 3) <= maxTier)
      .map((spot) => ({
        ...spot,
        type: 'major',
        priority: 0,
        isBookmarked: false,
        hasChat: false
      }));
    const sortedMajors = [...majorCandidates].sort((a, b) => {
      const tierA = Number(a.tier) || 3;
      const tierB = Number(b.tier) || 3;
      if (tierA !== tierB) return tierA - tierB;
      return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
    });
    if (isHighZoomFullReveal) {
      sortedMajors.forEach((spot) => {
        const idx = findMatchIndex(spot.lat, spot.lng);
        if (idx !== -1) return;
        result.push({
          ...spot,
          clusterCount: 1,
          hiddenClusterCount: 0
        });
      });
    } else {
      const mergeThreshold = getMajorMergeThreshold(mapZoom);
      const majorClusters = [];
      sortedMajors.forEach((spot) => {
        const existingCluster = majorClusters.find((cluster) =>
          areCoordsNear(cluster.anchor, { lat: spot.lat, lng: spot.lng }, mergeThreshold)
        );
        if (existingCluster) {
          existingCluster.items.push(spot);
          return;
        }
        majorClusters.push({
          anchor: { lat: spot.lat, lng: spot.lng },
          items: [spot]
        });
      });
      majorClusters.forEach((cluster) => {
        const [representative, ...hidden] = cluster.items;
        const idx = findMatchIndex(representative.lat, representative.lng);
        if (idx !== -1) return;
        result.push({
          ...representative,
          clusterCount: cluster.items.length,
          hiddenClusterCount: hidden.length
        });
      });
    }

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

    const collisionThreshold = getMarkerCollisionThreshold(mapZoom);
    const markerWeight = (marker) => {
      if (marker.isActive) return 100;
      if (marker.isBookmarked) return 90;
      if (marker.hasChat) return 80;
      if (marker.type === 'temp-base') return 70;
      const tier = Number(marker.tier) || 3;
      const popularity = Number(marker.popularity) || 0;
      // Lower tier + higher popularity should survive when collisions occur.
      return 50 - tier * 5 + popularity / 100;
    };
    const keptMarkers = [];
    const sortedByWeight = isHighZoomFullReveal
      ? [...result]
      : [...result].sort((a, b) => markerWeight(b) - markerWeight(a));
    sortedByWeight.forEach((marker) => {
      if (isHighZoomFullReveal) {
        keptMarkers.push(marker);
        return;
      }
      const existing = keptMarkers.find((kept) =>
        areCoordsNear(
          { lat: kept.lat, lng: kept.lng },
          { lat: marker.lat, lng: marker.lng },
          collisionThreshold
        )
      );
      if (!existing) {
        keptMarkers.push(marker);
        return;
      }
      // At high zoom, only collapse truly overlapping markers.
      existing.hiddenClusterCount = (Number(existing.hiddenClusterCount) || 0) + 1;
      existing.clusterCount = (Number(existing.clusterCount) || 1) + 1;
    });

    return keptMarkers;
  }, [travelSpots, allTravelSpots, savedTrips, tempPinsData, activePinId, mapZoom]);

  const addRipple = useCallback((lat, lng, ttl = 1600) => {
    const ripple = { id: `${Date.now()}-${Math.random()}`, lat, lng };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(item => item.id !== ripple.id));
    }, ttl);
  }, []);

  const executeFocus = useCallback((lat, lng) => {
    const map = mapRef.current?.getMap();
    if (!map || pauseRender) return false;

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const lngDelta = normalizeLngDelta(currentCenter.lng, lng);
    const latDelta = Math.abs(currentCenter.lat - lat);
    const isAlreadyNearTarget = lngDelta < 0.2 && latDelta < 0.2;
    if (isAlreadyNearTarget) return true;

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(currentZoom, GLOBE_VIEW.flyZoom),
      duration: 900,
      essential: true
    });

    rotationTimer.current = setTimeout(() => {
      const currentZoom = map.getZoom();
      if (!pauseRender && currentZoom <= GLOBE_VIEW.rotateZoomThreshold) {
        autoRotateRef.current = true;
      }
    }, 1200);
    return true;
  }, [pauseRender]);

  const flyToAndPin = useCallback((lat, lng, _name, _category, options = {}) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    autoRotateRef.current = false;
    addRipple(lat, lng, 2000);
    const shouldFocus = options?.focus !== false;
    if (!shouldFocus) {
      pendingFocusRef.current = null;
      return;
    }

    const applied = executeFocus(lat, lng);
    if (!applied) {
      pendingFocusRef.current = { lat, lng };
    }
  }, [addRipple, executeFocus]);

  const showMobileActionMessage = useCallback((message) => {
    setMobileActionMessage(message);
    window.setTimeout(() => {
      setMobileActionMessage((prev) => (prev === message ? '' : prev));
    }, 1800);
  }, []);

  const handleShareCurrentView = useCallback(async () => {
    const map = mapRef.current?.getMap();
    const center = map?.getCenter();
    const zoom = map?.getZoom();
    const url = new URL(window.location.href);
    if (center && typeof zoom === 'number') {
      url.searchParams.set('lng', center.lng.toFixed(5));
      url.searchParams.set('lat', center.lat.toFixed(5));
      url.searchParams.set('zoom', zoom.toFixed(2));
    }
    const shareData = {
      title: 'GateO Globe',
      text: '지금 보고 있는 지구본 위치를 공유합니다.',
      url: url.toString()
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        showMobileActionMessage('링크를 복사했어요.');
      }
    } catch {
      // User may cancel the share sheet or browser may block.
    }
  }, [showMobileActionMessage]);

  const handleGoToCurrentLocation = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !navigator.geolocation) {
      showMobileActionMessage('현재 위치를 찾을 수 없어요.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        autoRotateRef.current = false;
        map.flyTo({
          center: [longitude, latitude],
          zoom: Math.max(map.getZoom(), 11),
          duration: 900,
          essential: true
        });
        // Keep behavior consistent with globe taps: create/update pin via geocoding flow.
        if (onGlobeClick) {
          window.setTimeout(() => {
            onGlobeClick({ lat: latitude, lng: longitude, source: 'map' });
          }, 120);
        }
      },
      () => showMobileActionMessage('위치 권한을 확인해 주세요.'),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [onGlobeClick, showMobileActionMessage]);

  const handleReturnToSpace = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    try {
      map.stop();
      map.flyTo({
        center: [GLOBE_VIEW.default.longitude, GLOBE_VIEW.default.latitude],
        zoom: GLOBE_VIEW.default.zoom,
        pitch: GLOBE_VIEW.default.pitch,
        bearing: GLOBE_VIEW.default.bearing,
        duration: 1200,
        essential: true
      });
    } catch {
      // Fallback for edge cases where camera animation is rejected.
      map.jumpTo({
        center: [GLOBE_VIEW.default.longitude, GLOBE_VIEW.default.latitude],
        zoom: GLOBE_VIEW.default.zoom,
        pitch: GLOBE_VIEW.default.pitch,
        bearing: GLOBE_VIEW.default.bearing
      });
    }
    interactionRef.current = false;
    autoRotateRef.current = !pauseRender;
    setRipples([]);
    pendingFocusRef.current = null;
  }, [pauseRender]);

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
    if (pauseRender) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    let raf2 = null;

    // 카드/탭 전환 후 display:none -> block 복귀 시 캔버스가 축소된 채 남는 경우가 있어
    // 프레임 경계에서 resize를 두 번 보정한다.
    const raf1 = requestAnimationFrame(() => {
      try {
        map.resize();
      } catch {
        // Ignore resize failures during rapid route transitions.
      }
      raf2 = requestAnimationFrame(() => {
        try {
          map.resize();
          syncMapZoom();
          applyPlaceLabelVisibility();
        } catch {
          // Ignore resize failures during rapid route transitions.
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [pauseRender, syncMapZoom, applyPlaceLabelVisibility]);

  useEffect(() => {
    if (pauseRender) return;
    if (!pendingFocusRef.current) return;

    const pending = pendingFocusRef.current;
    const applyPendingFocus = () => {
      const applied = executeFocus(pending.lat, pending.lng);
      if (applied) {
        pendingFocusRef.current = null;
      }
    };

    // Defer until map container is visible/resized.
    const timer = window.setTimeout(applyPendingFocus, 80);
    return () => window.clearTimeout(timer);
  }, [pauseRender, executeFocus]);

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
    isHoveringMarker.current = false;
    if (Date.now() < suppressClickUntilRef.current) return;
    if (isZenMode || pauseRender) return;
    if (!onGlobeClick || !event?.lngLat) return;
    const map = mapRef.current?.getMap();
    const labelLayers = placeLabelLayerIdsRef.current || [];
    const clickedLabels = map && labelLayers.length > 0
      ? map.queryRenderedFeatures(event.point, { layers: labelLayers })
      : [];
    const topLabel = clickedLabels?.[0];
    const props = topLabel?.properties || {};

    let label = '';
    for (const key of PLACE_LABEL_PROPERTY_KEYS) {
      if (typeof props[key] === 'string' && props[key].trim()) {
        label = props[key].trim();
        break;
      }
    }
    let labelEn = '';
    for (const key of PLACE_LABEL_ENGLISH_KEYS) {
      if (typeof props[key] === 'string' && props[key].trim()) {
        labelEn = props[key].trim();
        break;
      }
    }

    if (label) {
      onGlobeClick({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
        source: 'label',
        label,
        labelEn,
        labelFeature: {
          layerId: topLabel?.layer?.id || '',
          sourceLayer: topLabel?.layer?.['source-layer'] || '',
          placeType: Array.isArray(topLabel?.properties?.place_type)
            ? topLabel.properties.place_type[0] || ''
            : (topLabel?.properties?.place_type || '')
        }
      });
      return;
    }

    onGlobeClick({ lat: event.lngLat.lat, lng: event.lngLat.lng, source: 'map' });
  }, [isZenMode, onGlobeClick, pauseRender]);

  const handleInteractionStart = useCallback(() => {
    interactionRef.current = true;
    autoRotateRef.current = false;
  }, []);

  const handleInteractionEnd = useCallback(() => {
    interactionRef.current = false;
  }, []);

  if (!MAPBOX_TOKEN) return null;

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
          syncMapZoom();
          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          resetAndApplyPlaceLabelVisibility();
          waitingThemeSettleRef.current = false;
          setIsStyleTransitioning(false);
        }}
        onStyleData={() => {
          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          resetAndApplyPlaceLabelVisibility();
        }}
        onIdle={() => {
          syncMapZoom();
          // onIdle fires frequently during/after camera changes.
          // Re-scanning all style layers here caused avoidable UI sluggishness,
          // so keep only lightweight visibility sync.
          applyPlaceLabelVisibility();
          if (waitingThemeSettleRef.current) {
            const map = mapRef.current?.getMap();
            const pendingCamera = pendingThemeCameraRef.current;
            if (map && pendingCamera) {
              try {
                map.jumpTo(pendingCamera);
              } catch {
                // Ignore camera restore failures on style transitions.
              }
            }
            pendingThemeCameraRef.current = null;
            waitingThemeSettleRef.current = false;
            setIsStyleTransitioning(false);
          }
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
          syncMapZoom();
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
        {!isZenMode && !isStyleTransitioning && allMarkers.map((d, idx) => {
          const offsetLat = d._offsetLat || 0;
          const offsetLng = d._offsetLng || 0;
          const { html, zIndex } = getMarkerDesign(d);
          const key = d.id || d.tripId || `${d.type || 'marker'}-${d.lat}-${d.lng}-${d.name || idx}`;
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
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') isHoveringMarker.current = true;
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') isHoveringMarker.current = false;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  isHoveringMarker.current = false;
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

      {!isZenMode && (
        <div className="absolute z-[70] pointer-events-auto flex flex-col gap-1 right-3 top-14 md:top-8 md:right-[24.8%] md:gap-2 md:flex-row">
          <button
            type="button"
            onClick={handleShareCurrentView}
            className="h-11 w-11 rounded-full bg-black/55 border border-white/20 text-gray-100 shadow-lg backdrop-blur-sm flex items-center justify-center active:scale-95"
            aria-label="현재 위치 공유"
            title="현재 위치 공유"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3.2v10.1" />
              <path d="m8.3 7.1 3.7-3.7 3.7 3.7" />
              <path d="M4.9 10.5v8.4A2.1 2.1 0 0 0 7 21h10a2.1 2.1 0 0 0 2.1-2.1v-8.4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleGoToCurrentLocation}
            className="h-11 w-11 rounded-full bg-black/55 border border-emerald-400/35 text-emerald-400 shadow-lg backdrop-blur-sm flex items-center justify-center active:scale-95"
            aria-label="현재 위치로 이동"
            title="현재 위치로 이동"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M21.2 2.8 3.9 10.3c-.8.3-.8 1.4 0 1.7l6.9 2.3 2.3 6.9c.3.8 1.4.8 1.7 0l7.5-17.3c.3-.8-.5-1.6-1.3-1.2Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleReturnToSpace}
            className="h-11 w-11 rounded-full bg-black/55 border border-blue-400/35 text-blue-400 shadow-lg backdrop-blur-sm flex items-center justify-center active:scale-95"
            aria-label="우주로 복귀"
            title="우주로 복귀"
          >
            <svg viewBox="0 0 24 24" className="h-[30px] w-[30px] fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="6.2" />
              <path d="M5.8 12h12.4M12 5.8c2 1.9 3.1 4 3.1 6.2S14 16.3 12 18.2M12 5.8c-2 1.9-3.1 4-3.1 6.2s1.1 4.3 3.1 6.2" />
            </svg>
          </button>
        </div>
      )}
      {mobileActionMessage && !isZenMode && (
        <div className="absolute right-3 top-[calc(50%+8.5rem)] z-[70] pointer-events-none rounded-full bg-black/70 px-3 py-1 text-xs text-white border border-white/15 backdrop-blur-sm">
          {mobileActionMessage}
        </div>
      )}
    </div>
  );
}));

export default HomeGlobeMapbox;
