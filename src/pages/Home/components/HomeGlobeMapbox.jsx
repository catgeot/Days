import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import Map, { Marker, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';
import { bindGlobeSpaceDragGuard, isClientPointOnGlobe, isMapEventOnGlobe, isScreenPointOnGlobe } from '../lib/globeSpaceHitTest';
import { normalizeLngNear } from '../lib/globeLngUtils';
import { resolveTravelSpotFromCoords } from '../../../utils/travelSpotResolve.js';
import {
  PLACE_LABEL_MIN_ZOOM,
  HIGH_ZOOM_FULL_REVEAL,
  getMaxTierForZoom,
  getMajorMergeThreshold,
  getMarkerCollisionThreshold
} from '../lib/globeZoomPolicy';
import {
  markersToGeoJSON,
  setupGateoMarkerLayers,
  updateGateoMarkerSource,
  findGateoMarkerAtPoint,
  isGateoLayer,
  gateoMarkerLayersReady
} from '../lib/globeMarkerLayers';
import { GLOBE_MODE, canEndTour, canSkipTour, isTourMode } from '../lib/globeMode';
import { createGlobeTourEngine } from '../lib/globeTourEngine';
import { applyTourMapUi, restoreGlobeMapUi } from '../lib/globeTourUi';
import { applyStandardBasemapConfig, STANDARD_HOME_CONFIG } from '../lib/globeStandardBasemap';

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

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

const safeMapResize = (map) => {
  if (!map || map._removed) return;
  try {
    const container = map.getContainer?.();
    if (!container || container.clientWidth <= 0 || container.clientHeight <= 0) return;
    map.resize();
  } catch {
    // Map may be mid-projection/style transition.
  }
};

const areCoordsNear = (a, b, thresholdDeg) => {
  const latDiff = Math.abs(a.lat - b.lat);
  const lngDiff = normalizeLngDelta(a.lng, b.lng);
  return latDiff <= thresholdDeg && lngDiff <= thresholdDeg;
};

const lookupFullMarker = (markers, hit) => {
  if (!hit || !markers?.length) return hit;
  if (hit.slug) {
    const bySlug = markers.find((m) => m.slug === hit.slug);
    if (bySlug) return bySlug;
  }
  const hitLat = Number(hit.lat);
  const hitLng = Number(hit.lng);
  if (Number.isFinite(hitLat) && Number.isFinite(hitLng)) {
    const byCoords = markers.find((m) =>
      areCoordsNear({ lat: Number(m.lat), lng: Number(m.lng) }, { lat: hitLat, lng: hitLng }, 0.02)
    );
    if (byCoords) return byCoords;
  }
  if (hit.id != null) {
    const byId = markers.find((m) =>
      String(m.id || m.tripId || '') === String(hit.id)
    );
    if (byId) return byId;
  }
  return hit;
};

const reconcileMarkerWithClickCoords = (marker, clickLngLat, markers, spotCatalog) => {
  if (!clickLngLat || !spotCatalog?.length) return marker;
  const curated = resolveTravelSpotFromCoords(clickLngLat.lat, clickLngLat.lng, spotCatalog);
  if (!curated?.slug) return marker;

  const curatedMarker = markers.find((m) => m.slug === curated.slug);
  if (!curatedMarker) return marker;

  const markerSlug = marker?.slug || marker?.canonical_slug;
  if (markerSlug && markerSlug === curated.slug) return marker;
  return curatedMarker;
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
  const hasRaisedFatalRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const markerClickGuardUntilRef = useRef(0);
  const allMarkersLookupRef = useRef([]);
  const placeLabelLayerIdsRef = useRef([]);
  const allSymbolLayerIdsRef = useRef([]);
  const allLineLayerIdsRef = useRef([]);
  const hiddenFillLayerIdsRef = useRef([]);
  const adminBoundaryLayerIdsRef = useRef([]);
  const lastPlaceLabelVisibleRef = useRef(null);
  const waitingThemeSettleRef = useRef(false);
  const pendingThemeCameraRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const unbindSpaceDragGuardRef = useRef(null);
  const tourEngineRef = useRef(null);
  const tourActiveRef = useRef(false);
  const [globeMode, setGlobeMode] = useState(GLOBE_MODE.GLOBE_2D);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [ripples, setRipples] = useState([]);
  const [mobileActionMessage, setMobileActionMessage] = useState('');
  const [isStyleTransitioning, setIsStyleTransitioning] = useState(false);
  const [mapZoom, setMapZoom] = useState(GLOBE_VIEW.default.zoom);
  const isMobileDevice = useMemo(() => {
    try {
      return /android|iphone|ipad|ipod|mobile/i.test(window.navigator?.userAgent || '');
    } catch {
      return false;
    }
  }, []);
  const fogConfig = useMemo(() => {
    const atmosphere = ATMOSPHERE_BY_THEME[globeTheme] || ATMOSPHERE_BY_THEME.deep;
    return { ...GLOBE_SPACE_FOG_BASE, ...atmosphere };
  }, [globeTheme]);

  const refreshPlaceLabelLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded?.()) return;

    let layers;
    try {
      layers = map.getStyle()?.layers || [];
    } catch {
      return;
    }
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
      safeMapResize(map);
      requestAnimationFrame(() => safeMapResize(map));
    } catch {
      // Ignore interaction bootstrap errors.
    }
  }, []);

  const applyBasemapConfig = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || globeTheme !== 'bright') return;
    applyStandardBasemapConfig(map, STANDARD_HOME_CONFIG);
  }, [globeTheme]);

  const applyKoreanSatelliteLabels = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || globeTheme === 'bright') return;

    placeLabelLayerIdsRef.current.forEach((layerId) => {
      if (isGateoLayer(layerId) || !map.getLayer(layerId)) return;
      try {
        map.setLayoutProperty(layerId, 'text-field', [
          'coalesce',
          ['get', 'name_ko'],
          ['get', 'name_kr'],
          ['get', 'name:ko'],
          ['get', 'name']
        ]);
      } catch {
        // Ignore per-layer label field updates during style transitions.
      }
    });
  }, [globeTheme]);

  const applyPlaceLabelVisibility = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (globeTheme === 'bright') {
      applyBasemapConfig();
      const hideLayer = (layerId) => {
        if (isGateoLayer(layerId) || !map.getLayer(layerId)) return;
        try {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        } catch {
          // Ignore during style transitions.
        }
      };
      allSymbolLayerIdsRef.current.forEach(hideLayer);
      allLineLayerIdsRef.current.forEach(hideLayer);
      hiddenFillLayerIdsRef.current.forEach(hideLayer);
      adminBoundaryLayerIdsRef.current.forEach(hideLayer);
      placeLabelLayerIdsRef.current.forEach(hideLayer);
      lastPlaceLabelVisibleRef.current = false;
      return;
    }

    const shouldShowPlaceLabels = map.getZoom() >= PLACE_LABEL_MIN_ZOOM;
    if (lastPlaceLabelVisibleRef.current === shouldShowPlaceLabels) return;

    allSymbolLayerIdsRef.current.forEach((layerId) => {
      if (isGateoLayer(layerId)) return;
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
  }, [applyBasemapConfig, globeTheme]);

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

  const markerGeoJSON = useMemo(() => {
    if (isZenMode) {
      return { type: 'FeatureCollection', features: [] };
    }
    return markersToGeoJSON(allMarkers);
  }, [allMarkers, isZenMode]);

  useEffect(() => {
    allMarkersLookupRef.current = allMarkers;
  }, [allMarkers]);

  const syncGateoMarkerLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || pauseRender) return;
    if (!gateoMarkerLayersReady(map)) {
      setupGateoMarkerLayers(map);
    }
    updateGateoMarkerSource(map, markerGeoJSON);
  }, [markerGeoJSON, pauseRender]);

  useEffect(() => {
    if (pauseRender) return;
    updateGateoMarkerSource(mapRef.current?.getMap(), markerGeoJSON);
  }, [markerGeoJSON, pauseRender]);

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
    const normalizedLng = normalizeLngNear(currentCenter.lng, lng);
    const lngDelta = normalizeLngDelta(currentCenter.lng, lng);
    const latDelta = Math.abs(currentCenter.lat - lat);
    const isAlreadyNearTarget = lngDelta < 0.2 && latDelta < 0.2;
    if (isAlreadyNearTarget) return true;

    map.flyTo({
      center: [normalizedLng, lat],
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
    const returnZoom = isMobileDevice ? 1 : GLOBE_VIEW.default.zoom;
    try {
      map.stop();
      map.flyTo({
        center: [GLOBE_VIEW.default.longitude, GLOBE_VIEW.default.latitude],
        zoom: returnZoom,
        pitch: GLOBE_VIEW.default.pitch,
        bearing: GLOBE_VIEW.default.bearing,
        duration: 1200,
        essential: true
      });
    } catch {
      // Fallback for edge cases where camera animation is rejected.
      map.jumpTo({
        center: [GLOBE_VIEW.default.longitude, GLOBE_VIEW.default.latitude],
        zoom: returnZoom,
        pitch: GLOBE_VIEW.default.pitch,
        bearing: GLOBE_VIEW.default.bearing
      });
    }
    interactionRef.current = false;
    autoRotateRef.current = !pauseRender;
    setRipples([]);
    pendingFocusRef.current = null;
    lastPlaceLabelVisibleRef.current = null;
    applyBasemapConfig();
    resetAndApplyPlaceLabelVisibility();
  }, [applyBasemapConfig, isMobileDevice, pauseRender, resetAndApplyPlaceLabelVisibility]);

  const handleTourModeChange = useCallback((mode) => {
    tourActiveRef.current = isTourMode(mode);
    setGlobeMode(mode);
  }, []);

  const handleTourUiChange = useCallback((active, meta = {}) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (active) {
      applyTourMapUi(map, { active: true, globeTheme, tourTemplate: meta.template });
    } else {
      applyTourMapUi(map, { active: false, globeTheme, tourTemplate: meta.template });
      restoreGlobeMapUi(map, resetAndApplyPlaceLabelVisibility);
    }
  }, [globeTheme, resetAndApplyPlaceLabelVisibility]);

  const ensureTourEngine = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return null;
    if (!tourEngineRef.current) {
      tourEngineRef.current = createGlobeTourEngine(map, {
        defaultView: GLOBE_VIEW.default,
        onModeChange: handleTourModeChange,
        onTourUiChange: handleTourUiChange
      });
    }
    return tourEngineRef.current;
  }, [handleTourModeChange, handleTourUiChange]);

  const startTour = useCallback(async (location) => {
    const map = mapRef.current?.getMap();
    if (!map || !location) return false;
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    tourActiveRef.current = true;
    autoRotateRef.current = false;
    interactionRef.current = true;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    map.stop();

    const engine = ensureTourEngine();
    if (!engine) return false;

    return engine.start({
      slug: location.slug,
      lat,
      lng,
      location
    });
  }, [ensureTourEngine]);

  const skipTour = useCallback(() => {
    tourEngineRef.current?.skip();
  }, []);

  const endTour = useCallback(async () => {
    await tourEngineRef.current?.end();
    tourActiveRef.current = false;
    interactionRef.current = false;
    if (!pauseRender) {
      autoRotateRef.current = true;
    }
  }, [pauseRender]);

  useImperativeHandle(ref, () => ({
    pauseRotation: () => {
      autoRotateRef.current = false;
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => {
      if (pauseRender || isTourMode(globeMode)) return;
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
      applyBasemapConfig();
    },
    startTour,
    skipTour,
    endTour,
    getGlobeMode: () => globeMode
  }), [addRipple, applyBasemapConfig, endTour, flyToAndPin, globeMode, pauseRender, skipTour, startTour]);

  useEffect(() => {
    if (isTourMode(globeMode)) return;
    if (tourActiveRef.current) return;
    autoRotateRef.current = !pauseRender;
    if (pauseRender && rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
  }, [globeMode, pauseRender]);

  useEffect(() => {
    if (pauseRender) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    let raf2 = null;

    // 카드/탭 전환 후 display:none -> block 복귀 시 캔버스가 축소된 채 남는 경우가 있어
    // 프레임 경계에서 resize를 두 번 보정한다.
    const raf1 = requestAnimationFrame(() => {
      safeMapResize(map);
      raf2 = requestAnimationFrame(() => {
        safeMapResize(map);
        syncMapZoom();
        applyPlaceLabelVisibility();
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

      const shouldRotate = autoRotateRef.current
        && !interactionRef.current
        && !tourActiveRef.current
        && map.getZoom() <= GLOBE_VIEW.rotateZoomThreshold;
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

  useEffect(() => () => {
    unbindSpaceDragGuardRef.current?.();
    unbindSpaceDragGuardRef.current = null;
  }, []);

  const handleGlobeClickInternal = useCallback((event) => {
    if (Date.now() < markerClickGuardUntilRef.current) return;
    if (Date.now() < suppressClickUntilRef.current) return;
    if (isZenMode || pauseRender) return;
    if (!onGlobeClick || !event?.lngLat) return;
    const map = mapRef.current?.getMap();
    if (map && event.point && !isScreenPointOnGlobe(map, event.point)) return;

    const markerAtPoint = map && event.point
      ? findGateoMarkerAtPoint(map, event.point, event.lngLat)
      : null;
    if (markerAtPoint) {
      markerClickGuardUntilRef.current = Date.now() + 450;
      const spotCatalog = allTravelSpots.length > 0 ? allTravelSpots : travelSpots;
      let fullMarker = lookupFullMarker(allMarkersLookupRef.current, markerAtPoint);
      fullMarker = reconcileMarkerWithClickCoords(
        fullMarker,
        event.lngLat,
        allMarkersLookupRef.current,
        spotCatalog
      );
      if (onMarkerClick) onMarkerClick(fullMarker, 'globe');
      return;
    }
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
  }, [allTravelSpots, isZenMode, onGlobeClick, onMarkerClick, pauseRender, travelSpots]);

  const mapStyle = MAP_STYLES[globeTheme] || MAP_STYLES.deep;

  const pauseAutoRotateIfGlobeHit = useCallback((event) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (event?.clientX != null) {
      if (!isClientPointOnGlobe(map, event.clientX, event.clientY)) return;
    } else if (!isMapEventOnGlobe(map, event)) {
      return;
    }
    interactionRef.current = true;
    autoRotateRef.current = false;
  }, []);

  const handleInteractionStart = useCallback((event) => {
    pauseAutoRotateIfGlobeHit(event);
  }, [pauseAutoRotateIfGlobeHit]);

  const handleInteractionEnd = useCallback(() => {
    interactionRef.current = false;
  }, []);

  if (!MAPBOX_TOKEN) return null;

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${
        pauseRender ? 'pointer-events-none invisible' : isChatOpen ? 'opacity-30' : 'opacity-100'
      }`}
      onPointerDown={handleInteractionStart}
      onPointerUp={handleInteractionEnd}
      onPointerCancel={handleInteractionEnd}
      onPointerLeave={handleInteractionEnd}
      onWheel={handleInteractionStart}
    >
      <div className="absolute inset-0">
      <Map
        ref={mapRef}
        initialViewState={GLOBE_VIEW.default}
        projection="globe"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        onClick={handleGlobeClickInternal}
        onError={(evt) => raiseFatal(evt?.error || new Error('Mapbox render error'))}
        onLoad={() => {
          const map = mapRef.current?.getMap();
          if (map) {
            unbindSpaceDragGuardRef.current?.();
            unbindSpaceDragGuardRef.current = bindGlobeSpaceDragGuard(map);
            syncGateoMarkerLayers();
          }
          syncMapZoom();
          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          applyKoreanSatelliteLabels();
          resetAndApplyPlaceLabelVisibility();
          applyBasemapConfig();
          waitingThemeSettleRef.current = false;
          setIsStyleTransitioning(false);
        }}
        onStyleData={() => {
          const map = mapRef.current?.getMap();
          if (!map?.isStyleLoaded?.()) return;

          ensureInteractionReady();
          applyWaterPaint();
          refreshPlaceLabelLayers();
          applyKoreanSatelliteLabels();
          resetAndApplyPlaceLabelVisibility();
          syncGateoMarkerLayers();
          applyBasemapConfig();
        }}
        onIdle={() => {
          syncMapZoom();
          applyPlaceLabelVisibility();
          const map = mapRef.current?.getMap();
          if (map && !gateoMarkerLayersReady(map)) {
            syncGateoMarkerLayers();
          }
          if (waitingThemeSettleRef.current) {
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
        onDragStart={(event) => {
          pauseAutoRotateIfGlobeHit(event);
          suppressClickUntilRef.current = Date.now() + DRAG_CLICK_GUARD_MS;
        }}
        onDragEnd={() => {
          interactionRef.current = false;
          suppressClickUntilRef.current = Date.now() + DRAG_CLICK_GUARD_MS;
        }}
        onZoomStart={(event) => {
          pauseAutoRotateIfGlobeHit(event);
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
        {globeTheme !== 'bright' && <LanguageControl />}

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

      {canSkipTour(globeMode) && !isZenMode && (
        <div className="absolute bottom-[calc(11.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[65] pointer-events-auto lg:bottom-28">
          <button
            type="button"
            onClick={skipTour}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-xs font-bold text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            Skip
          </button>
        </div>
      )}

      {canEndTour(globeMode) && globeMode === GLOBE_MODE.TOUR_READY && !isZenMode && (
        <div className="absolute bottom-[calc(11.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[65] pointer-events-auto flex gap-2 lg:bottom-28">
          <button
            type="button"
            onClick={endTour}
            className="flex items-center gap-2 rounded-full border border-blue-400/35 bg-black/65 px-4 py-2 text-xs font-bold text-blue-300 shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            2D로 복귀
          </button>
        </div>
      )}

      {globeMode === GLOBE_MODE.TOUR_BOOTSTRAPPING && !isZenMode && (
        <div className="absolute inset-x-0 top-1/3 z-[65] pointer-events-none flex justify-center">
          <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
            3D 지형 로딩 중…
          </div>
        </div>
      )}
    </div>
  );
}));

export default HomeGlobeMapbox;
