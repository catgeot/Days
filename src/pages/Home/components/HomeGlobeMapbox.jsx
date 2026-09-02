import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';
import { bindGlobeSpaceDragGuard, isClientPointOnGlobe, isMapEventOnGlobe, isScreenPointOnGlobe } from '../lib/globeSpaceHitTest';
import { normalizeLngNear } from '../lib/globeLngUtils';
import {
  GLOBE_FACE_REGION_DEFAULT_ZOOM,
  GLOBE_FACE_REGION_FLY_MS,
  GLOBE_FACE_REGION_CAMERA_PADDING_DESKTOP,
  GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE,
  resolveFaceRegionCameraBounds,
} from '../lib/globeFaceRegions';
import {
  clearRegionHighlight,
  setRegionHighlight,
  setSeaBasinHighlight,
  setupRegionHighlightLayers,
} from '../lib/globeRegionHighlight';
import { logSeaExplore } from '../../../shared/cloudPreview/seaExploreDebug.js';
import { resolveTravelSpotFromCoords } from '../../../utils/travelSpotResolve.js';
import {
  HIGH_ZOOM_FULL_REVEAL,
  getMaxTierForZoom,
  getMajorMergeThreshold,
  getMarkerCollisionThreshold,
  getGateoMarkerHitThresholdPx,
} from '../lib/globeZoomPolicy';
import {
  markersToGeoJSON,
  setupGateoMarkerLayers,
  updateGateoMarkerSource,
  scheduleUpdateGateoMarkerSource,
  flushPendingGateoMarkerSource,
  findGateoMarkerAtPoint,
  isGateoLayer,
  gateoMarkerLayersReady,
  areGateoMarkerLayersVisible,
  setGateoMarkerLayerVisibility,
  setGateoMarkerLabelVisibility,
  syncGateoMarkerLayerStyle,
  markGlobeCameraBusy,
  clearGlobeCameraBusy,
  isGlobeCameraBusy,
} from '../lib/globeMarkerLayers';
import { GLOBE_MODE, canEndTour, canSkipTour, isTourMode } from '../lib/globeMode';
import { createGlobeTourEngine } from '../lib/globeTourEngine';
import { resolveGlobeTourConfig } from '../lib/globeTourResolve';
import { applyTourMapUi } from '../lib/globeTourUi';
import {
  REACH_CONTOUR_MINUTES,
  clearReachBoundaries,
  easeCameraForReachReveal,
  reachBoundaryLayersReady,
  resolveReachBoundaryGeoJSON,
  setReachBoundaryVisibility,
  setupReachBoundaryLayers,
  updateReachBoundarySource
} from '../lib/globeReachBoundaries';
import {
  buildClusterOverlayGeoJSON,
  clearClusterBoundaries,
  clusterBoundaryLayersReady,
  findClusterPoiAtPoint,
  setClusterBoundaryVisibility,
  setupClusterBoundaryLayers,
  updateClusterHullSource,
  updateClusterPoiSource
} from '../lib/globeClusterBoundaries';
import {
  createFlightCinemaEngine,
  ensureFlightCinemaGlobeReady,
  isFlightCinemaGlobeReady,
  isFlightCinemaLayer,
  setupFlightCinemaLayers,
  waitForFlightCinemaGlobeReady,
} from '../lib/globeFlightCinemaEngine';
import { readGlobeShareViewFromUrl } from '../lib/globeExploreNav';
import {
  applyEarlyMapboxGlobeLabelSuppress,
  applyMapboxGlobeLabelPolicy,
  emphasizeMapboxMarineLabels,
  isGlobeContextBasemapLabel,
} from '../lib/globeMapboxLabelPolicy';
import { getCategoryGlobeFaceView, GLOBE_FACE_FLY_MS, resolveCategoryFaceMapboxZoom } from '../lib/globeCategoryFocus';
import { passesGlobeTierPolicy } from '../lib/globeSpotVisibility';
import { flushCurationGlobeSyncIfPending } from '../lib/curationPlaceBridge.js';
import { useLocale } from '../../../i18n/LocaleProvider';
import { useTranslation } from 'react-i18next';
import { useOptionalFlightCinemaRoute } from '../lib/FlightCinemaContext.jsx';
import {
  flightCinemaDebugLocationTag,
  logFlightCinemaDebug,
  warnFlightCinemaDebug,
} from '../lib/flightCinemaDebug.js';
import FlightCinemaAirportMarkers from './FlightCinemaAirportMarkers.jsx';
import GlobeClusterLegend from './GlobeClusterLegend.jsx';

const SATELLITE_LABEL_FIELD_KO = [
  'coalesce',
  ['get', 'name_ko'],
  ['get', 'name_kr'],
  ['get', 'name:ko'],
  ['get', 'name'],
];

const SATELLITE_LABEL_FIELD_EN = [
  'coalesce',
  ['get', 'name_en'],
  ['get', 'name_int'],
  ['get', 'name_latin'],
  ['get', 'name:en'],
  ['get', 'name'],
  ['get', 'name_ko'],
  ['get', 'name_kr'],
  ['get', 'name:ko'],
];

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
  'state-label',
];
/** High-zoom POI / natural / landmark — clickable when visible (≥ POI_LABEL_MIN_ZOOM). */
const POI_LABEL_LAYER_HINTS = [
  'poi',
  'landmark',
  'natural',
  'airport',
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

function placeLabelPropertyKeysForLocale(locale) {
  if (locale?.startsWith('en')) {
    return [
      'name_en',
      'name_int',
      'name_latin',
      'name:en',
      'name',
      'name_ko',
      'name_kr',
      'name_local',
      'text',
      'title',
    ];
  }
  return PLACE_LABEL_PROPERTY_KEYS;
}

const GLOBE_MAP_BTN_BASE =
  'h-11 w-11 rounded-full bg-black/55 border shadow-lg backdrop-blur-sm flex items-center justify-center active:scale-95 hover:bg-black/70 transition-colors shrink-0';

const GLOBE_VIEW = {
  default: { longitude: 0, latitude: 20, zoom: 1.25, pitch: 0, bearing: 0 },
  flyZoom: 2.35,
  /** 써머리「이 지역 보기」— base 권역 → ×2 → ×4 시가지 (globeImmerseZoom.js) */
  immerseZoomBase: 6,
  immerseZoomX2: 7,
  immerseZoomX4: 8.5,
  immersePitchBase: 25,
  immersePitchDeep: 35,
  maxZoom: 22,
  rotateZoomThreshold: 2.4,
  flyDuration: 3000,
  /** 카드 오픈 지향 flyTo duration (ms) */
  orientFlyDuration: 900,
  /** 플라이 완료 후 자전 재개까지 대기 (ms) */
  orientRotatePauseMs: 2800,
  immerseFlyDuration: 1200,
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

  const markerSlug = String(marker?.slug || marker?.canonical_slug || '').trim();
  if (markerSlug && spotCatalog.some((s) => s.slug === markerSlug)) {
    return lookupFullMarker(markers, marker) || marker;
  }

  const curated = resolveTravelSpotFromCoords(clickLngLat.lat, clickLngLat.lng, spotCatalog);
  if (!curated?.slug) return marker;

  const curatedMarker = markers.find((m) => m.slug === curated.slug);
  if (!curatedMarker) return marker;

  if (markerSlug && markerSlug === curated.slug) return marker;
  return curatedMarker;
};

const isMarkerCountryMissing = (marker) => {
  const c = String(marker?.country ?? '').trim().toLowerCase();
  return !c || c === 'explore' || c === 'global' || c === 'searching' || c === 'searching...';
};

/**
 * GeoJSON 히트·구버전 임시 핀은 country 등이 비어 있음 → 카탈로그 SSOT로 복원.
 * 검색 진입과 마커 재클릭의 장소카드 국가·갤러리·플래너 키를 동일하게 맞춤.
 * 좌표 스냅: major 전체 치환 · temp/saved는 국가가 비었을 때만(옛 세션 핀 자가치유).
 */
const hydrateMarkerFromSpotCatalog = (marker, spotCatalog = []) => {
  if (!marker || !spotCatalog?.length) return marker;

  // saved_trips 스프레드 마커: curation_data.country를 상위로 승격 후 카탈로그 보강
  const meta = marker.curation_data;
  if (meta && typeof meta === 'object') {
    marker = {
      ...marker,
      country: isMarkerCountryMissing(marker) ? (meta.country || marker.country) : marker.country,
      country_en: isMarkerCountryMissing({ country: marker.country_en })
        ? (meta.country_en || marker.country_en)
        : marker.country_en,
      slug: marker.slug || meta.slug,
      name_en: marker.name_en || meta.locationEn,
      galleryRegionSpot: marker.galleryRegionSpot || meta.galleryRegionSpot,
    };
  }

  const slug = String(marker.slug || marker.canonical_slug || '').trim().toLowerCase();
  let spot = slug ? spotCatalog.find((s) => String(s.slug || '').toLowerCase() === slug) : null;

  if (!spot && marker.id != null && /^\d+$/.test(String(marker.id))) {
    spot = spotCatalog.find((s) => String(s.id) === String(marker.id));
  }

  const markerType = marker.type || 'major';
  const allowCoordSnap = markerType === 'major' || isMarkerCountryMissing(marker);
  if (!spot && allowCoordSnap) {
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      spot = resolveTravelSpotFromCoords(lat, lng, spotCatalog);
    }
  }

  if (!spot) return marker;

  // temp/saved + 국가만 비어 있으면 표시명·좌표 유지, country만 SSOT 보강
  if (markerType !== 'major' && isMarkerCountryMissing(marker)) {
    return {
      ...marker,
      country: spot.country ?? marker.country,
      country_en: spot.country_en ?? marker.country_en,
      slug: marker.slug || spot.slug,
      canonical_slug: marker.canonical_slug || spot.slug,
      name_en: marker.name_en || spot.name_en,
      galleryRegionSpot: marker.galleryRegionSpot || {
        slug: spot.slug,
        name: spot.name,
        name_en: spot.name_en,
      },
    };
  }

  return {
    ...spot,
    type: markerType,
    isActive: marker.isActive,
    isBookmarked: marker.isBookmarked,
    hasChat: marker.hasChat,
    tripId: marker.tripId,
    hiddenClusterCount: marker.hiddenClusterCount,
    clusterCount: marker.clusterCount,
  };
};

/** DEV-only performance marks for globe cold-load diagnostics (Phase 0). */
const markGlobeLoadPhase = (phase) => {
  if (!import.meta.env.DEV) return;
  try {
    performance.mark(`globe:${phase}`);
  } catch {
    // Ignore performance API failures.
  }
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
  isFlightCinemaActive = false,
  isFlightCinemaLaunchPending = false,
  globeTheme = 'deep',
  isZenMode = false,
  isPinVisible = true,
  onGlobeModeChange,
  hideTourControls = false,
  focusSlug = null,
  onFatalError,
  highlightCategory = null,
  categoryFaceEpoch = 0,
  onReturnToSpace = null,
}, ref) => {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { active: flightCinemaActive, routeIatas: flightCinemaRouteIatas } = useOptionalFlightCinemaRoute();
  const mapRef = useRef(null);
  const interactionRef = useRef(false);
  const autoRotateRef = useRef(!pauseRender);
  const rotationFrameRef = useRef(null);
  const rotationTimer = useRef(null);
  /** 써머리「이 지역 보기」몰입 중 — 자전 금지·exitImmerse 대상 */
  const immerseActiveRef = useRef(false);
  /** @type {React.MutableRefObject<{ iso?: string, iso3166_2?: string, bbox?: number[], settleZoom?: number } | null>} */
  const focusedFaceRegionRef = useRef(null);
  /**
   * 항공 시네마 레이어가 한 번이라도 확인되면 latch.
   * 줌 중 setLayoutProperty 등으로 isStyleLoaded/getLayer가 순간 false여도
   * 폴링 UI가 「준비 중」으로 깜박이지 않게 한다. 테마 전환 시에만 해제.
   */
  const flightCinemaLayersLatchedRef = useRef(false);
  const hasRaisedFatalRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const markerClickGuardUntilRef = useRef(0);
  /** flyTo/easeTo 중 basemap symbol continuePlacement race 방지 */
  const cameraAnimatingRef = useRef(false);
  const allMarkersLookupRef = useRef([]);
  const placeLabelLayerIdsRef = useRef([]);
  const poiLabelLayerIdsRef = useRef([]);
  const contextLabelLayerIdsRef = useRef([]);
  const allSymbolLayerIdsRef = useRef([]);
  const allLineLayerIdsRef = useRef([]);
  const hiddenFillLayerIdsRef = useRef([]);
  const adminBoundaryLayerIdsRef = useRef([]);
  const lastPlaceLabelVisibleRef = useRef(null);
  const waitingThemeSettleRef = useRef(false);
  const globeBaseRevealedRef = useRef(false);
  const globeOverlaysRevealedRef = useRef(false);
  const globeThemeInitializedRef = useRef(false);
  const globeIdleMarkedRef = useRef(false);
  const prevStyleTransitioningRef = useRef(false);
  const pendingThemeCameraRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const pendingTourPivotRef = useRef(null);
  const unbindSpaceDragGuardRef = useRef(null);
  const tourEngineRef = useRef(null);
  const flightCinemaEngineRef = useRef(null);
  const flightCinemaEngineMapRef = useRef(null);
  const flightCinemaActiveRef = useRef(false);
  const flightCinemaOnCompleteRef = useRef(null);
  const [showCinemaAirportMarkers, setShowCinemaAirportMarkers] = useState(false);
  const tourActiveRef = useRef(false);
  const prevTourEngineModeRef = useRef(GLOBE_MODE.GLOBE_2D);
  const reachFetchGenRef = useRef(0);
  const reachGeoJsonRef = useRef(null);
  const clusterOverlayRef = useRef(null);
  const hasRestoredShareViewRef = useRef(false);
  const skipCategoryFaceUntilShareCheckRef = useRef(true);
  const prevHighlightCategoryRef = useRef(null);
  const prevCategoryFaceEpochRef = useRef(categoryFaceEpoch);
  const categoryFaceFlyGenRef = useRef(0);
  const regionFlyGenRef = useRef(0);
  const regionFlyEndHandlerRef = useRef(null);
  const regionFlyInProgressRef = useRef(false);
  const highlightCategoryRef = useRef(highlightCategory);
  const onGlobeModeChangeRef = useRef(onGlobeModeChange);
  const tourEngineCallbacksRef = useRef({});
  const [globeMode, setGlobeMode] = useState(GLOBE_MODE.GLOBE_2D);
  const [ripples, setRipples] = useState([]);
  const [mobileActionMessage, setMobileActionMessage] = useState('');
  const [reachBoundariesReady, setReachBoundariesReady] = useState(false);
  const [reachBoundariesLoading, setReachBoundariesLoading] = useState(false);
  const [reachBoundariesVisible, setReachBoundariesVisible] = useState(true);
  const reachBoundariesVisibleRef = useRef(true);
  const [isStyleTransitioning, setIsStyleTransitioning] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(GLOBE_VIEW.default.zoom);
  useEffect(() => {
    reachBoundariesVisibleRef.current = reachBoundariesVisible;
  }, [reachBoundariesVisible]);

  const toggleReachBoundaries = useCallback(() => {
    setReachBoundariesVisible((prev) => {
      const next = !prev;
      reachBoundariesVisibleRef.current = next;
      const map = mapRef.current?.getMap();
      if (map && reachGeoJsonRef.current) {
        setReachBoundaryVisibility(map, next);
      }
      return next;
    });
  }, []);

  const clusterOverlay = useMemo(
    () => buildClusterOverlayGeoJSON(focusSlug),
    [focusSlug]
  );
  /** 2D 고줌·TOUR_READY 공통 노출 (시네마틱 중만 숨김). 면 채움 없이 경계선·POI만. */
  const showClusterOverlay = useMemo(() => {
    if (isZenMode || !clusterOverlay.meta) return false;
    if (globeMode === GLOBE_MODE.TOUR_BOOTSTRAPPING || globeMode === GLOBE_MODE.TOUR_PLAYING) {
      return false;
    }
    return mapZoom >= HIGH_ZOOM_FULL_REVEAL || globeMode === GLOBE_MODE.TOUR_READY;
  }, [clusterOverlay.meta, globeMode, isZenMode, mapZoom]);
  const isMobileDevice = useMemo(() => {
    try {
      return /android|iphone|ipad|ipod|mobile/i.test(window.navigator?.userAgent || '');
    } catch {
      return false;
    }
  }, []);
  /** 모바일 범례: TOUR_READY만. PC: 2D 고줌에서도 권역 리스트 노출 */
  const showClusterLegend = useMemo(() => {
    if (!showClusterOverlay) return false;
    if (isMobileDevice) return globeMode === GLOBE_MODE.TOUR_READY;
    return true;
  }, [globeMode, isMobileDevice, showClusterOverlay]);
  /** PC: HomeUI 좌측 레일(연관 키워드 아래) 슬롯에 마운트 */
  const [clusterLegendHost, setClusterLegendHost] = useState(null);
  useEffect(() => {
    if (!showClusterLegend || isMobileDevice || typeof document === 'undefined') {
      setClusterLegendHost(null);
      return undefined;
    }
    const resolve = () => {
      const el = document.getElementById('gateo-cluster-legend-slot');
      setClusterLegendHost(el);
    };
    resolve();
    const raf = window.requestAnimationFrame(resolve);
    return () => window.cancelAnimationFrame(raf);
  }, [showClusterLegend, isMobileDevice, focusSlug]);
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
        if (isGateoLayer(id) || isFlightCinemaLayer(id)) return false;
        const sourceLayer = layer['source-layer'] || '';
        return PLACE_LABEL_LAYER_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      })
      .map((layer) => layer.id);

    poiLabelLayerIdsRef.current = symbolLayers
      .filter((layer) => Boolean(layer.layout && layer.layout['text-field']))
      .filter((layer) => {
        const id = layer.id || '';
        if (isGateoLayer(id) || isFlightCinemaLayer(id)) return false;
        const sourceLayer = layer['source-layer'] || '';
        if (PLACE_LABEL_LAYER_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint))) {
          return false;
        }
        if (isGlobeContextBasemapLabel(id, sourceLayer)) return false;
        return POI_LABEL_LAYER_HINTS.some((hint) => id.includes(hint) || sourceLayer.includes(hint));
      })
      .map((layer) => layer.id);

    contextLabelLayerIdsRef.current = symbolLayers
      .filter((layer) => Boolean(layer.layout && layer.layout['text-field']))
      .filter((layer) => isGlobeContextBasemapLabel(layer.id, layer['source-layer']))
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

  /** deep/neon: locale별 text-field. force=true면 자전 중에도 즉시(토글). */
  const applySatelliteBasemapLabels = useCallback((options = {}) => {
    const force = Boolean(options.force);
    const map = mapRef.current?.getMap();
    if (!map || globeTheme === 'bright' || !map.isStyleLoaded?.()) return;
    if (
      !force
      && (cameraAnimatingRef.current || isGlobeCameraBusy(map)
        || (typeof map.isMoving === 'function' && map.isMoving()))
    ) {
      return;
    }

    const textField = locale?.startsWith('en')
      ? SATELLITE_LABEL_FIELD_EN
      : SATELLITE_LABEL_FIELD_KO;

    [
      ...placeLabelLayerIdsRef.current,
      ...poiLabelLayerIdsRef.current,
      ...contextLabelLayerIdsRef.current,
    ].forEach((layerId) => {
      try {
        if (isGateoLayer(layerId) || isFlightCinemaLayer(layerId) || !map.getLayer(layerId)) return;
        map.setLayoutProperty(layerId, 'text-field', textField);
      } catch {
        // Ignore per-layer label field updates during style transitions.
      }
    });
  }, [globeTheme, locale]);

  const applyPlaceLabelVisibility = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (cameraAnimatingRef.current || isGlobeCameraBusy(map) || (typeof map.isMoving === 'function' && map.isMoving())) {
      return;
    }

    if (map.isStyleLoaded?.()) {
      refreshPlaceLabelLayers();
    }

    const shouldShowMapboxContext = applyMapboxGlobeLabelPolicy(map, {
      globeTheme,
      isPinVisible,
      placeLabelLayerIds: placeLabelLayerIdsRef.current,
      poiLabelLayerIds: poiLabelLayerIdsRef.current,
    });

    if (globeTheme !== 'bright') {
      applySatelliteBasemapLabels();
    }

    if (shouldShowMapboxContext === null) return;

    if (lastPlaceLabelVisibleRef.current !== shouldShowMapboxContext) {
      lastPlaceLabelVisibleRef.current = shouldShowMapboxContext;
    }
  }, [globeTheme, isPinVisible, refreshPlaceLabelLayers, applySatelliteBasemapLabels]);

  const syncMapZoom = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const zoom = map.getZoom();
    if (!Number.isFinite(zoom)) return;
    setMapZoom((prev) => (Math.abs(prev - zoom) < 0.01 ? prev : zoom));
  }, []);

  const resetAndApplyPlaceLabelVisibility = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (
      map
      && (cameraAnimatingRef.current || isGlobeCameraBusy(map)
        || (typeof map.isMoving === 'function' && map.isMoving()))
    ) {
      return;
    }
    lastPlaceLabelVisibleRef.current = null;
    applyPlaceLabelVisibility();
  }, [applyPlaceLabelVisibility]);

  useEffect(() => {
    resetAndApplyPlaceLabelVisibility();
  }, [isPinVisible, resetAndApplyPlaceLabelVisibility]);

  const applyWaterPaint = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || globeTheme !== 'deep' && globeTheme !== 'neon') return;
    if (!map.isStyleLoaded?.()) return;

    const waterColor = WATER_COLOR_BY_THEME[globeTheme] || WATER_COLOR_BY_THEME.deep;
    const layerIds = ['water', 'water-shadow', 'waterway'];

    layerIds.forEach((layerId) => {
      try {
        const layer = map.getLayer(layerId);
        if (!layer) return;
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
    const syncViewport = () => {
      const map = mapRef.current?.getMap();
      if (map) safeMapResize(map);
    };
    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    syncViewport();
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
    };
  }, []);

  useEffect(() => {
    // First mount: skip theme-settle freeze so base globe can reveal on style load (not first idle).
    if (!globeThemeInitializedRef.current) {
      globeThemeInitializedRef.current = true;
      return;
    }

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
    globeBaseRevealedRef.current = false;
    globeOverlaysRevealedRef.current = false;
    flightCinemaLayersLatchedRef.current = false;
    if (map && gateoMarkerLayersReady(map)) {
      setGateoMarkerLayerVisibility(map, false);
    }
    setIsStyleTransitioning(true);
    lastPlaceLabelVisibleRef.current = null;
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
      .filter((spot) => passesGlobeTierPolicy(spot, maxTier))
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
      const meta = trip.curation_data || {};
      // country는 curation_data에만 있는 경우가 많음(살타 등 미등록 uiPlace) — 마커 재클릭 Explore 방지
      const tripCountry = trip.country || meta.country;
      const tripCountryEn = trip.country_en || meta.country_en;

      if (idx !== -1) {
        if (isBookmarked) result[idx].isBookmarked = true;
        if (hasMessageChat) result[idx].hasChat = true;
        result[idx].tripId = trip.id;
        if (isMarkerCountryMissing(result[idx]) && tripCountry) {
          result[idx].country = tripCountry;
          result[idx].country_en = tripCountryEn;
        }
        if (!result[idx].slug && meta.slug) result[idx].slug = meta.slug;
        if (!result[idx].name_en && meta.locationEn) result[idx].name_en = meta.locationEn;
      } else {
        result.push({
          ...trip,
          name: fixedName,
          name_en: trip.name_en || meta.locationEn,
          slug: trip.slug || meta.slug,
          country: tripCountry,
          country_en: tripCountryEn,
          galleryRegionSpot: trip.galleryRegionSpot || meta.galleryRegionSpot,
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
    return markersToGeoJSON(allMarkers, locale);
  }, [allMarkers, isZenMode, locale]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const mapLanguage = locale?.startsWith('en') ? 'en' : 'ko';

    const applyLocaleToMap = () => {
      if (typeof map.setLanguage === 'function') {
        try {
          map.setLanguage(mapLanguage);
        } catch {
          // Style may still be loading.
        }
      }
      // deep/neon: text-field를 locale에 맞게 즉시 덮어씀 (한글 강제·자전 대기 제거)
      applySatelliteBasemapLabels({ force: true });
    };

    if (map.isStyleLoaded?.()) {
      applyLocaleToMap();
      return undefined;
    }

    const onReady = () => {
      map.off('idle', onReady);
      applyLocaleToMap();
    };
    map.on('idle', onReady);
    return () => {
      map.off('idle', onReady);
    };
  }, [locale, globeTheme, applySatelliteBasemapLabels]);

  useEffect(() => {
    allMarkersLookupRef.current = allMarkers;
  }, [allMarkers]);

  const clearReachBoundaryState = useCallback(() => {
    reachFetchGenRef.current += 1;
    reachGeoJsonRef.current = null;
    reachBoundariesVisibleRef.current = true;
    setReachBoundariesVisible(true);
    const map = mapRef.current?.getMap();
    if (map) {
      clearReachBoundaries(map);
      setReachBoundaryVisibility(map, false);
    }
    setReachBoundariesReady(false);
    setReachBoundariesLoading(false);
  }, []);

  const loadReachBoundaries = useCallback(async (lng, lat, { easeCamera = true } = {}) => {
    const map = mapRef.current?.getMap();
    if (!map || !Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const gen = reachFetchGenRef.current + 1;
    reachFetchGenRef.current = gen;
    setReachBoundariesReady(false);
    setReachBoundariesLoading(true);

    try {
      setupReachBoundaryLayers(map);
      setReachBoundaryVisibility(map, reachBoundariesVisibleRef.current);

      const geojson = await resolveReachBoundaryGeoJSON(lng, lat, MAPBOX_TOKEN);
      if (reachFetchGenRef.current !== gen) return;

      reachGeoJsonRef.current = geojson;
      updateReachBoundarySource(map, geojson);
      setupReachBoundaryLayers(map);
      setReachBoundaryVisibility(map, reachBoundariesVisibleRef.current);
      if (easeCamera && reachBoundariesVisibleRef.current) easeCameraForReachReveal(map);
      setReachBoundariesReady(true);
    } catch {
      if (reachFetchGenRef.current !== gen) return;
      const fallback = await resolveReachBoundaryGeoJSON(lng, lat, null);
      reachGeoJsonRef.current = fallback;
      updateReachBoundarySource(map, fallback);
      setupReachBoundaryLayers(map);
      setReachBoundaryVisibility(map, reachBoundariesVisibleRef.current);
      if (easeCamera && reachBoundariesVisibleRef.current) easeCameraForReachReveal(map);
      setReachBoundariesReady(true);
    } finally {
      if (reachFetchGenRef.current === gen) {
        setReachBoundariesLoading(false);
      }
    }
  }, []);

  const restoreReachBoundaryLayersIfNeeded = useCallback(() => {
    if (globeMode !== GLOBE_MODE.TOUR_READY || !reachGeoJsonRef.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    setupReachBoundaryLayers(map);
    updateReachBoundarySource(map, reachGeoJsonRef.current);
    setReachBoundaryVisibility(map, reachBoundariesVisibleRef.current);
  }, [globeMode]);

  const syncClusterOverlayLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (!clusterBoundaryLayersReady(map)) {
      setupClusterBoundaryLayers(map);
    }

    if (!showClusterOverlay || !clusterOverlay.meta) {
      clusterOverlayRef.current = null;
      clearClusterBoundaries(map);
      setClusterBoundaryVisibility(map, false);
      return;
    }

    clusterOverlayRef.current = clusterOverlay;
    updateClusterHullSource(map, clusterOverlay.hull);
    updateClusterPoiSource(map, clusterOverlay.poi);
    setClusterBoundaryVisibility(map, true);
  }, [clusterOverlay, showClusterOverlay]);

  const syncGateoMarkerLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || (pauseRender && !flightCinemaActiveRef.current)) return;
    if (
      cameraAnimatingRef.current || isGlobeCameraBusy(map)
      || (typeof map.isMoving === 'function' && map.isMoving())
    ) {
      return;
    }
    if (!gateoMarkerLayersReady(map)) {
      setupGateoMarkerLayers(map);
    } else {
      syncGateoMarkerLayerStyle(map);
    }
    if (!reachBoundaryLayersReady(map)) {
      setupReachBoundaryLayers(map);
    }
    if (!clusterBoundaryLayersReady(map)) {
      setupClusterBoundaryLayers(map);
    }
    setupRegionHighlightLayers(map);
    if (focusedFaceRegionRef.current) {
      if (focusedFaceRegionRef.current.seaBasinId) {
        if (!regionFlyInProgressRef.current) {
          setSeaBasinHighlight(map, focusedFaceRegionRef.current);
          emphasizeMapboxMarineLabels(map);
        }
      } else {
        setRegionHighlight(map, focusedFaceRegionRef.current);
      }
    }
    const cinemaGlobeSession =
      flightCinemaActiveRef.current
      || isFlightCinemaLaunchPending
      || flightCinemaEngineRef.current?.isActive?.();
    if (!cinemaGlobeSession) {
      setupFlightCinemaLayers(map, { visible: false });
      if (isFlightCinemaGlobeReady(map)) {
        flightCinemaLayersLatchedRef.current = true;
      }
      scheduleUpdateGateoMarkerSource(map, markerGeoJSON);
    }
    restoreReachBoundaryLayersIfNeeded();
    syncClusterOverlayLayers();
  }, [isFlightCinemaLaunchPending, markerGeoJSON, pauseRender, restoreReachBoundaryLayersIfNeeded, syncClusterOverlayLayers]);

  useEffect(() => {
    if (pauseRender || flightCinemaActiveRef.current) return;
    scheduleUpdateGateoMarkerSource(mapRef.current?.getMap(), markerGeoJSON);
  }, [markerGeoJSON, pauseRender]);

  useEffect(() => {
    if (pauseRender) return;
    syncClusterOverlayLayers();
  }, [pauseRender, syncClusterOverlayLayers]);

  /** Satellite globe — show as soon as map loads; suppress Mapbox detail labels until overlays ready. */
  const tryRevealGlobeBase = useCallback(() => {
    if (pauseRender || waitingThemeSettleRef.current) return;
    if (globeBaseRevealedRef.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    // Relaxed vs isStyleLoaded-only: map.loaded() is enough for satellite base on first paint.
    if (!map.loaded?.() && !map.isStyleLoaded?.()) return;

    applyPlaceLabelVisibility();
    globeBaseRevealedRef.current = true;
    markGlobeLoadPhase('tryRevealBase');
    setIsStyleTransitioning(false);
  }, [applyPlaceLabelVisibility, pauseRender]);

  /** Gateo spot labels — after GeoJSON layers + source sync (keeps 2026-06 label-flash fix). */
  const tryRevealGlobeOverlays = useCallback(() => {
    if (pauseRender) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (
      cameraAnimatingRef.current || isGlobeCameraBusy(map)
      || (typeof map.isMoving === 'function' && map.isMoving())
    ) {
      return;
    }

    if (map.isStyleLoaded?.()) {
      syncGateoMarkerLayers();
    } else if (!gateoMarkerLayersReady(map)) {
      // Style mid-load and layers not queryable yet (2s fallback / early idle).
      return;
    }

    if (!gateoMarkerLayersReady(map)) return;

    if (!areGateoMarkerLayersVisible(map)) {
      setGateoMarkerLayerVisibility(map, true);
    }
    if (!globeOverlaysRevealedRef.current) {
      globeOverlaysRevealedRef.current = true;
      markGlobeLoadPhase('tryRevealOverlays');
    }
    applyPlaceLabelVisibility();
  }, [applyPlaceLabelVisibility, pauseRender, syncGateoMarkerLayers]);

  const tryRevealGlobe = useCallback(() => {
    tryRevealGlobeBase();
    tryRevealGlobeOverlays();
  }, [tryRevealGlobeBase, tryRevealGlobeOverlays]);

  useEffect(() => {
    if (pauseRender) return undefined;
    const fallback = window.setTimeout(() => {
      if (globeBaseRevealedRef.current || pauseRender) return;
      if (import.meta.env.DEV) {
        markGlobeLoadPhase('fallback-2s');
        console.warn('[HomeGlobeMapbox] globe reveal fallback (2s safety net)');
      }
      globeBaseRevealedRef.current = true;
      setIsStyleTransitioning(false);
      tryRevealGlobeOverlays();
    }, 2000);
    return () => window.clearTimeout(fallback);
  }, [globeTheme, tryRevealGlobeOverlays, pauseRender]);

  useEffect(() => {
    if (import.meta.env.DEV && prevStyleTransitioningRef.current && !isStyleTransitioning) {
      markGlobeLoadPhase('opacity-visible');
    }
    prevStyleTransitioningRef.current = isStyleTransitioning;
  }, [isStyleTransitioning]);

  useEffect(() => {
    if (!mapReady || pauseRender) return;
    tryRevealGlobeOverlays();
  }, [mapReady, markerGeoJSON, pauseRender, tryRevealGlobeOverlays]);

  const addRipple = useCallback((lat, lng, ttl = 1600) => {
    const ripple = { id: `${Date.now()}-${Math.random()}`, lat, lng };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(item => item.id !== ripple.id));
    }, ttl);
  }, []);

  const scheduleOrientRotateResume = useCallback((map, flyDurationMs) => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    const waitMs = Math.max(0, Number(flyDurationMs) || 0) + GLOBE_VIEW.orientRotatePauseMs;
    rotationTimer.current = setTimeout(() => {
      if (immerseActiveRef.current) return;
      const zoom = map?.getZoom?.();
      if (!pauseRender && Number.isFinite(zoom) && zoom <= GLOBE_VIEW.rotateZoomThreshold) {
        autoRotateRef.current = true;
      }
    }, waitMs);
  }, [pauseRender]);

  const executeFocus = useCallback((lat, lng, options = {}) => {
    const map = mapRef.current?.getMap();
    if (!map || pauseRender) return false;
    if (!map.isStyleLoaded?.()) return false;

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const normalizedLng = normalizeLngNear(currentCenter.lng, lng);
    const lngDelta = normalizeLngDelta(currentCenter.lng, lng);
    const latDelta = Math.abs(currentCenter.lat - lat);
    const isAlreadyNearTarget = lngDelta < 0.2 && latDelta < 0.2;
    const forceFlyZoom = options?.forceFlyZoom === true;
    const targetZoom = forceFlyZoom
      ? GLOBE_VIEW.flyZoom
      : Math.max(currentZoom, GLOBE_VIEW.flyZoom);
    const flyDuration = GLOBE_VIEW.orientFlyDuration;

    if (isAlreadyNearTarget && !forceFlyZoom && Math.abs(currentZoom - targetZoom) < 0.05) {
      scheduleOrientRotateResume(map, 0);
      return true;
    }

    try {
      markGlobeCameraBusy(map);
      cameraAnimatingRef.current = true;
      setGateoMarkerLayerVisibility(map, false);
      map.flyTo({
        center: [normalizedLng, lat],
        zoom: targetZoom,
        pitch: GLOBE_VIEW.default.pitch,
        duration: flyDuration,
        essential: true
      });
      map.once('moveend', () => {
        cameraAnimatingRef.current = false;
        map.once('idle', () => {
          flushPendingGateoMarkerSource(map);
          setGateoMarkerLayerVisibility(map, true);
          clearGlobeCameraBusy(map);
          applyPlaceLabelVisibility();
        });
      });
    } catch {
      clearGlobeCameraBusy(map);
      cameraAnimatingRef.current = false;
      setGateoMarkerLayerVisibility(map, true);
      return false;
    }

    scheduleOrientRotateResume(map, flyDuration);
    return true;
  }, [pauseRender, scheduleOrientRotateResume]);

  /** TOUR_READY pivot — ease center only; pitch/zoom/bearing unchanged (no flyTo). */
  const pivotTourExplore = useCallback((location) => {
    const map = mapRef.current?.getMap();
    if (!map || !location) return;

    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const config = resolveGlobeTourConfig({
      slug: location.slug,
      lat,
      lng,
      location
    });
    const [centerLng, centerLat] = config.center;
    if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) return;

    map.stop();
    map.easeTo({
      center: [centerLng, centerLat],
      duration: 550,
      essential: true
    });
    // 새 지명 pivot — 투어 재시작 전까지 이전·선행 경계를 지도에 두지 않음 (몰입감)
    clearReachBoundaryState();
  }, [clearReachBoundaryState]);

  const clearImmerseState = useCallback(() => {
    immerseActiveRef.current = false;
  }, []);

  const immerseToPin = useCallback((lat, lng, options = {}) => {
    const map = mapRef.current?.getMap();
    if (!map || map._removed) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    // startTour와 같이 pauseRender는 막지 않음 — 써머리 카드가 보이는 홈에서
    // 채팅 오버레이 직후·isCardExpanded 잔류 등으로 pause가 걸려도 카메라 이동은 허용.
    if (isTourMode(globeMode) || flightCinemaActiveRef.current) {
      return false;
    }
    // 엔진 모드는 2D인데 ref만 남은 경우(중단된 투어) — 몰입 허용
    if (tourActiveRef.current && !isTourMode(globeMode)) {
      tourActiveRef.current = false;
    } else if (tourActiveRef.current) {
      return false;
    }

    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    interactionRef.current = false;
    autoRotateRef.current = false;
    immerseActiveRef.current = true;

    const currentCenter = map.getCenter();
    const normalizedLng = normalizeLngNear(currentCenter.lng, lng);
    const zoom = Number.isFinite(options?.zoom) ? options.zoom : GLOBE_VIEW.immerseZoomBase;
    const pitch = Number.isFinite(options?.pitch) ? options.pitch : GLOBE_VIEW.immersePitchBase;

    try {
      map.stop();
      map.flyTo({
        center: [normalizedLng, lat],
        zoom,
        pitch,
        duration: GLOBE_VIEW.immerseFlyDuration,
        essential: true
      });
    } catch {
      immerseActiveRef.current = false;
      return false;
    }
    return true;
  }, [globeMode]);

  const exitImmerse = useCallback((lat, lng) => {
    const map = mapRef.current?.getMap();
    if (!map) return false;

    const wasImmersed = immerseActiveRef.current;
    immerseActiveRef.current = false;
    if (!wasImmersed && map.getZoom() < GLOBE_VIEW.immerseZoomBase - 0.35) {
      return false;
    }

    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    autoRotateRef.current = false;

    const currentCenter = map.getCenter();
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const centerLng = hasCoords ? normalizeLngNear(currentCenter.lng, lng) : currentCenter.lng;
    const centerLat = hasCoords ? lat : currentCenter.lat;
    const flyDuration = GLOBE_VIEW.orientFlyDuration;

    map.stop();
    map.flyTo({
      center: [centerLng, centerLat],
      zoom: GLOBE_VIEW.flyZoom,
      pitch: GLOBE_VIEW.default.pitch,
      bearing: GLOBE_VIEW.default.bearing,
      duration: flyDuration,
      essential: true
    });
    scheduleOrientRotateResume(map, flyDuration);
    return true;
  }, [scheduleOrientRotateResume]);

  const applyPendingFocus = useCallback(() => {
    if (!pendingFocusRef.current) return false;
    const pending = pendingFocusRef.current;
    const applied = executeFocus(pending.lat, pending.lng);
    if (applied) {
      pendingFocusRef.current = null;
    }
    return applied;
  }, [executeFocus]);

  const flyToAndPin = useCallback((lat, lng, _name, _category, options = {}) => {
    const shouldFocus = options?.focus !== false;
    const map = mapRef.current?.getMap();
    if (!map) {
      addRipple(lat, lng, 2000);
      if (shouldFocus) {
        pendingFocusRef.current = { lat, lng };
      }
      return;
    }
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    const wasImmersed = immerseActiveRef.current;
    immerseActiveRef.current = false;
    autoRotateRef.current = false;
    addRipple(lat, lng, 2000);
    if (!shouldFocus) {
      pendingFocusRef.current = null;
      return;
    }

    const pivotTarget = options?.location || {
      lat,
      lng,
      name: _name,
      category: _category,
      slug: options?.slug
    };

    if (globeMode === GLOBE_MODE.TOUR_BOOTSTRAPPING || globeMode === GLOBE_MODE.TOUR_PLAYING) {
      pendingTourPivotRef.current = pivotTarget;
      pendingFocusRef.current = null;
      tourEngineRef.current?.skip();
      return;
    }

    if (globeMode === GLOBE_MODE.TOUR_READY) {
      pendingFocusRef.current = null;
      pivotTourExplore(pivotTarget);
      return;
    }

    const applied = executeFocus(lat, lng, { forceFlyZoom: wasImmersed });
    if (!applied) {
      pendingFocusRef.current = { lat, lng };
    }
  }, [addRipple, executeFocus, globeMode, pivotTourExplore]);

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

  const handleTourModeChange = useCallback((mode) => {
    const prev = prevTourEngineModeRef.current;
    prevTourEngineModeRef.current = mode;
    tourActiveRef.current = isTourMode(mode);
    setGlobeMode(mode);
    onGlobeModeChangeRef.current?.(mode);

    if (mode === GLOBE_MODE.TOUR_BOOTSTRAPPING || mode === GLOBE_MODE.TOUR_PLAYING) {
      clearReachBoundaryState();
      return;
    }

    if (mode === GLOBE_MODE.TOUR_READY && prev !== GLOBE_MODE.TOUR_READY) {
      const map = mapRef.current?.getMap();
      const center = map?.getCenter?.();
      if (center) {
        const runReachLoad = () => {
          loadReachBoundaries(center.lng, center.lat, { easeCamera: true });
        };
        if (map?.isMoving?.()) {
          map.once('idle', runReachLoad);
        } else {
          requestAnimationFrame(runReachLoad);
        }
      }
      const pendingPivot = pendingTourPivotRef.current;
      if (pendingPivot) {
        pendingTourPivotRef.current = null;
        pivotTourExplore(pendingPivot);
      }
      return;
    }

    if (mode === GLOBE_MODE.GLOBE_2D) {
      clearReachBoundaryState();
    }
  }, [clearReachBoundaryState, loadReachBoundaries, pivotTourExplore]);

  const handleTourUiChange = useCallback((active, meta = {}) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    applyTourMapUi(map, { active, globeTheme, tourTemplate: meta.template });
    resetAndApplyPlaceLabelVisibility();
  }, [globeTheme, resetAndApplyPlaceLabelVisibility]);

  tourEngineCallbacksRef.current = {
    onModeChange: handleTourModeChange,
    onTourUiChange: handleTourUiChange,
  };

  const ensureTourEngine = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return null;
    if (!tourEngineRef.current) {
      tourEngineRef.current = createGlobeTourEngine(map, {
        defaultView: GLOBE_VIEW.default,
        onModeChange: (mode) => tourEngineCallbacksRef.current.onModeChange?.(mode),
        onTourUiChange: (active, meta) => tourEngineCallbacksRef.current.onTourUiChange?.(active, meta),
      });
    }
    return tourEngineRef.current;
  }, []);

  const ensureFlightCinemaEngine = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return null;
    if (flightCinemaEngineRef.current && flightCinemaEngineMapRef.current !== map) {
      flightCinemaEngineRef.current.forceReset?.();
      flightCinemaEngineRef.current = null;
      flightCinemaEngineMapRef.current = null;
      flightCinemaActiveRef.current = false;
    }
    if (!flightCinemaEngineRef.current) {
      flightCinemaEngineRef.current = createFlightCinemaEngine(map, {
        defaultView: GLOBE_VIEW.default,
        flyZoom: GLOBE_VIEW.flyZoom,
      });
      flightCinemaEngineMapRef.current = map;
    }
    return flightCinemaEngineRef.current;
  }, []);

  useEffect(() => {
    setShowCinemaAirportMarkers(
      flightCinemaActive && Array.isArray(flightCinemaRouteIatas) && flightCinemaRouteIatas.length > 0
    );
  }, [flightCinemaActive, flightCinemaRouteIatas]);

  const closeFlightCinema = useCallback(() => {
    setShowCinemaAirportMarkers(false);
    const engine = flightCinemaEngineRef.current;
    const map = mapRef.current?.getMap();
    const hadSession = Boolean(flightCinemaActiveRef.current || engine?.isActive?.());
    const notifyComplete = flightCinemaOnCompleteRef.current;
    if (engine?.isActive?.()) {
      engine.close?.();
    } else if (engine) {
      engine.forceReset?.();
      flightCinemaOnCompleteRef.current = null;
      flightCinemaActiveRef.current = false;
      interactionRef.current = false;
      notifyComplete?.('interrupt');
    }
    if (!engine?.isActive?.()) {
      flightCinemaActiveRef.current = false;
      interactionRef.current = false;
    }
    if (map) {
      setGateoMarkerLabelVisibility(map, true);
      updateGateoMarkerSource(map, markerGeoJSON);
    }
    return hadSession;
  }, [markerGeoJSON]);

  const startFlightCinema = useCallback((params) => {
    const debugBase = {
      slug: flightCinemaDebugLocationTag(params?.location),
      originIata: params?.originIata,
      destIata: params?.destIata,
      hubIatas: params?.hubIatas,
      relaunch: params?.relaunch === true,
    };

    if (tourActiveRef.current) {
      warnFlightCinemaDebug('globe.abort', { ...debugBase, reason: 'tour-active' });
      return false;
    }
    const map = mapRef.current?.getMap();
    if (!map) {
      warnFlightCinemaDebug('globe.abort', { ...debugBase, reason: 'no-map' });
      return false;
    }

    const engine = ensureFlightCinemaEngine();
    if (!engine) {
      warnFlightCinemaDebug('globe.abort', { ...debugBase, reason: 'no-engine' });
      return false;
    }

    const relaunchActiveSession =
      params.relaunch === true
      && (flightCinemaActiveRef.current || engine.isActive?.());

    safeMapResize(map);
    if (!relaunchActiveSession) {
      if (!ensureFlightCinemaGlobeReady(map)) {
        warnFlightCinemaDebug('globe.abort', {
          ...debugBase,
          reason: 'globe-not-ready',
          styleLoaded: Boolean(map.isStyleLoaded?.()),
          cinemaGlobeReady: isFlightCinemaGlobeReady(map),
          layersLatched: flightCinemaLayersLatchedRef.current,
        });
        return false;
      }
    } else {
      logFlightCinemaDebug('globe.relaunch-skip-ready', {
        ...debugBase,
        flightCinemaActiveRef: flightCinemaActiveRef.current,
        engineActive: engine.isActive?.(),
        cinemaGlobeReady: isFlightCinemaGlobeReady(map),
        layersLatched: flightCinemaLayersLatchedRef.current,
      });
    }

    const wrappedOnComplete = (reason) => {
      flightCinemaOnCompleteRef.current = null;
      flightCinemaActiveRef.current = false;
      interactionRef.current = false;
      setShowCinemaAirportMarkers(false);
      params.onComplete?.(reason);
    };
    flightCinemaOnCompleteRef.current = wrappedOnComplete;

    immerseActiveRef.current = false;
    autoRotateRef.current = false;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    interactionRef.current = true;
    flightCinemaActiveRef.current = true;

    const started = engine.start({
      ...params,
      onComplete: wrappedOnComplete,
    });

    if (started) {
      setShowCinemaAirportMarkers(true);
      setGateoMarkerLabelVisibility(map, false);
      logFlightCinemaDebug('globe.started', debugBase);
    } else {
      flightCinemaActiveRef.current = false;
      interactionRef.current = false;
      flightCinemaOnCompleteRef.current = null;
      flightCinemaLayersLatchedRef.current = false;
      warnFlightCinemaDebug('globe.abort', { ...debugBase, reason: 'engine-start-false' });
    }
    return started;
  }, [ensureFlightCinemaEngine]);

  const startTour = useCallback(async (location) => {
    if (flightCinemaActiveRef.current) {
      closeFlightCinema();
    }
    const map = mapRef.current?.getMap();
    if (!map || !location) return false;
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    immerseActiveRef.current = false;
    tourActiveRef.current = true;
    autoRotateRef.current = false;
    interactionRef.current = true;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    map.stop();
    clearReachBoundaryState();

    const engine = ensureTourEngine();
    if (!engine) return false;

    return engine.start({
      slug: location.slug,
      lat,
      lng,
      location
    });
  }, [clearReachBoundaryState, closeFlightCinema, ensureTourEngine]);

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

  const finalizeSpaceReturn = useCallback(() => {
    interactionRef.current = false;
    immerseActiveRef.current = false;
    autoRotateRef.current = !pauseRender;
    setRipples([]);
    pendingFocusRef.current = null;
    lastPlaceLabelVisibleRef.current = null;
    resetAndApplyPlaceLabelVisibility();
  }, [pauseRender, resetAndApplyPlaceLabelVisibility]);

  const handleReturnToSpace = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    onReturnToSpace?.();

    if (isTourMode(globeMode) || tourActiveRef.current) {
      await endTour();
      finalizeSpaceReturn();
      return;
    }

    // autoRotate jumpTo가 flyTo 줌 애니메이션을 중간에 끊지 않도록 이동 완료까지 회전·상호작용 잠금
    autoRotateRef.current = false;
    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    interactionRef.current = true;

    const returnCamera = {
      center: [GLOBE_VIEW.default.longitude, GLOBE_VIEW.default.latitude],
      zoom: GLOBE_VIEW.default.zoom,
      pitch: GLOBE_VIEW.default.pitch,
      bearing: GLOBE_VIEW.default.bearing
    };

    const finishReturn = () => {
      map.off('moveend', finishReturn);
      finalizeSpaceReturn();
    };

    try {
      map.stop();
      map.once('moveend', finishReturn);
      map.flyTo({
        ...returnCamera,
        duration: 1200,
        essential: true
      });
    } catch {
      map.off('moveend', finishReturn);
      map.jumpTo(returnCamera);
      finalizeSpaceReturn();
    }
  }, [endTour, finalizeSpaceReturn, globeMode, onReturnToSpace]);

  const clearRegionFocus = useCallback(() => {
    focusedFaceRegionRef.current = null;
    const map = mapRef.current?.getMap();
    if (map) clearRegionHighlight(map);
  }, []);

  /**
   * 나라/지역 칩 — fitBounds(우선) · 선택 국가 경계 하이라이트.
   * @param {number | { lat?: number, lng?: number, zoom?: number, bbox?: number[], hubBbox?: number[], iso?: string, iso3166_2?: string }} latOrRegion
   * @param {number} [lng]
   * @param {number} [zoom]
   */
  const flyToRegion = useCallback((latOrRegion, lng, zoom = GLOBE_FACE_REGION_DEFAULT_ZOOM) => {
    const map = mapRef.current?.getMap();
    if (!map || pauseRender || isTourMode(globeMode) || tourActiveRef.current || flightCinemaActiveRef.current) {
      return false;
    }

    const region = typeof latOrRegion === 'object' && latOrRegion
      ? latOrRegion
      : { lat: latOrRegion, lng, zoom };
    const lat = Number(region.lat);
    const lngVal = Number(region.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lngVal)) return false;

    autoRotateRef.current = false;
    if (rotationTimer.current) {
      clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    immerseActiveRef.current = false;

    const container = map.getContainer?.();
    const visualViewport = typeof window !== 'undefined' ? window.visualViewport : null;
    const viewport = {
      width: container?.clientWidth ?? visualViewport?.width ?? window.innerWidth,
      height: container?.clientHeight ?? visualViewport?.height ?? window.innerHeight,
    };
    const pad = isMobileDevice
      ? GLOBE_FACE_REGION_CAMERA_PADDING_MOBILE
      : GLOBE_FACE_REGION_CAMERA_PADDING_DESKTOP;
    const { bounds, maxZoom } = resolveFaceRegionCameraBounds(region, viewport, pad);

    let camera = null;
    if (bounds) {
      try {
        camera = map.cameraForBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: pad, maxZoom, pitch: 0, bearing: 0 }
        );
      } catch {
        camera = null;
      }
    }

    if (!camera) {
      const targetZoom = Number.isFinite(region.zoom) ? region.zoom : GLOBE_FACE_REGION_DEFAULT_ZOOM;
      const normalizedLng = normalizeLngNear(map.getCenter().lng, lngVal);
      camera = {
        center: [normalizedLng, lat],
        zoom: targetZoom,
        pitch: 0,
        bearing: 0,
      };
    } else if (Array.isArray(camera.center) && camera.center.length >= 2) {
      camera = {
        ...camera,
        center: [normalizeLngNear(map.getCenter().lng, camera.center[0]), camera.center[1]],
        pitch: 0,
        bearing: 0,
      };
    }

    const settleZoom = Number.isFinite(camera?.zoom) ? camera.zoom : GLOBE_FACE_REGION_DEFAULT_ZOOM;
    focusedFaceRegionRef.current = {
      iso: region.iso,
      iso3166_2: region.iso3166_2,
      bbox: Array.isArray(region.bbox) ? region.bbox : bounds,
      settleZoom,
      seaBasinId: region.seaBasinId || null,
      labelKo: region.labelKo || null,
      lat,
      lng: lngVal,
    };

    const isSeaBasinFly = Boolean(region.seaBasinId);
    const immediate = Boolean(region.immediate);
    const useJump = immediate || (isMobileDevice && isSeaBasinFly);
    const isCountryFocusFly = Boolean(region.iso || region.iso3166_2);
    logSeaExplore('flyToRegion', {
      id: region.id || region.seaBasinId || null,
      sea: isSeaBasinFly,
      immediate: useJump,
      country: isCountryFocusFly,
    });
    const gen = regionFlyGenRef.current + 1;
    regionFlyGenRef.current = gen;
    regionFlyInProgressRef.current = isSeaBasinFly && !useJump;

    const applyRegionFocusVisual = ({ emphasizeMarine = true } = {}) => {
      if (regionFlyGenRef.current !== gen) return;
      setupRegionHighlightLayers(map);
      if (focusedFaceRegionRef.current?.seaBasinId) {
        setSeaBasinHighlight(map, focusedFaceRegionRef.current);
        if (emphasizeMarine) {
          emphasizeMapboxMarineLabels(map, { force: !isMobileDevice });
        }
      } else if (focusedFaceRegionRef.current) {
        setRegionHighlight(map, focusedFaceRegionRef.current);
      }
      regionFlyInProgressRef.current = false;
    };

    if (!isSeaBasinFly && isCountryFocusFly) {
      applyRegionFocusVisual();
    }

    if (regionFlyEndHandlerRef.current) {
      map.off('moveend', regionFlyEndHandlerRef.current);
      regionFlyEndHandlerRef.current = null;
    }

    const onFlyEnd = () => {
      if (regionFlyGenRef.current !== gen) return;
      if (map.isMoving()) return;
      map.off('moveend', onFlyEnd);
      if (regionFlyEndHandlerRef.current === onFlyEnd) {
        regionFlyEndHandlerRef.current = null;
      }
      applyRegionFocusVisual();
    };

    try {
      map.stop();
      if (useJump) {
        map.jumpTo(camera);
        if (isSeaBasinFly) {
          applyRegionFocusVisual({ emphasizeMarine: !isMobileDevice });
        }
        return true;
      }

      if (isSeaBasinFly) {
        regionFlyEndHandlerRef.current = onFlyEnd;
      }
      map.flyTo({
        ...camera,
        duration: isSeaBasinFly ? 900 : (isMobileDevice ? 0 : GLOBE_FACE_REGION_FLY_MS),
        essential: !isSeaBasinFly && !isMobileDevice,
      });
      if (isSeaBasinFly) {
        requestAnimationFrame(() => {
          if (regionFlyGenRef.current !== gen) return;
          map.on('moveend', onFlyEnd);
        });
      }
    } catch {
      map.off('moveend', onFlyEnd);
      if (regionFlyEndHandlerRef.current === onFlyEnd) {
        regionFlyEndHandlerRef.current = null;
      }
      map.jumpTo(camera);
      if (isSeaBasinFly) {
        applyRegionFocusVisual();
      }
    }
    return true;
  }, [globeMode, isMobileDevice, pauseRender]);

  const isGlobeFocusReady = useCallback(() => {
    if (pauseRender) return false;
    const map = mapRef.current?.getMap();
    if (!map || map._removed) return false;
    try {
      return Boolean(map.isStyleLoaded?.());
    } catch {
      return false;
    }
  }, [pauseRender]);

  const whenGlobeFocusReady = useCallback(({ timeoutMs = 4000, intervalMs = 80 } = {}) => {
    if (isGlobeFocusReady()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (isGlobeFocusReady()) {
          resolve(true);
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
  }, [isGlobeFocusReady]);

  useImperativeHandle(ref, () => ({
    pauseRotation: () => {
      autoRotateRef.current = false;
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    resumeRotation: () => {
      if (pauseRender || isTourMode(globeMode) || flightCinemaActiveRef.current || immerseActiveRef.current) return;
      autoRotateRef.current = true;
    },
    /** 채팅·모달 닫힌 뒤 Mapbox 입력·리사이즈 복구 (몰입 flyTo 무반응 방지) */
    wakeAfterOverlay: () => {
      interactionRef.current = false;
      ensureInteractionReady();
      const map = mapRef.current?.getMap();
      if (map && !map._removed && isFlightCinemaGlobeReady(map)) {
        flightCinemaLayersLatchedRef.current = true;
      }
    },
    markCameraBusy: () => {
      markGlobeCameraBusy(mapRef.current?.getMap());
    },
    flyToAndPin,
    flyToRegion,
    clearRegionFocus,
    immerseToPin,
    exitImmerse,
    clearImmerseState,
    isImmersed: () => Boolean(immerseActiveRef.current),
    getMapView: () => {
      const map = mapRef.current?.getMap();
      if (!map || map._removed) return null;
      try {
        const center = map.getCenter();
        const bounds = map.getBounds();
        return {
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          altitude: null,
          center: { lng: center.lng, lat: center.lat },
          bounds: bounds
            ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
            : null,
        };
      } catch {
        return null;
      }
    },
    updateLastPinName: () => {},
    triggerRipple: (lat, lng) => addRipple(lat, lng, 1500),
    resetPins: () => {
      immerseActiveRef.current = false;
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
      resetAndApplyPlaceLabelVisibility();
    },
    startTour,
    skipTour,
    endTour,
    pivotTourExplore,
    startFlightCinema,
    closeFlightCinema,
    isFlightCinemaReady: () => {
      if (!mapReady || isStyleTransitioning) return false;
      if (tourActiveRef.current || flightCinemaActiveRef.current) return false;
      const map = mapRef.current?.getMap();
      if (!map || map._removed) return false;
      if (isFlightCinemaGlobeReady(map)) {
        flightCinemaLayersLatchedRef.current = true;
        return true;
      }
      // 줌·idle 깜박임 흡수 — onStyleData·테마 전환 시 latch 해제
      return flightCinemaLayersLatchedRef.current;
    },
    waitForFlightCinemaReady: (options) => {
      const map = mapRef.current?.getMap();
      if (!map) return Promise.resolve(false);
      return waitForFlightCinemaGlobeReady(map, options);
    },
    isGlobeFocusReady,
    whenGlobeFocusReady,
    getGlobeMode: () => tourEngineRef.current?.getMode?.() ?? globeMode
  }), [addRipple, clearImmerseState, clearRegionFocus, closeFlightCinema, endTour, ensureInteractionReady, exitImmerse, flyToAndPin, flyToRegion, globeMode, immerseToPin, isGlobeFocusReady, isStyleTransitioning, mapReady, pauseRender, pivotTourExplore, resetAndApplyPlaceLabelVisibility, skipTour, startFlightCinema, startTour, whenGlobeFocusReady]);

  useEffect(() => {
    highlightCategoryRef.current = highlightCategory;
  }, [highlightCategory]);

  useEffect(() => {
    onGlobeModeChangeRef.current = onGlobeModeChange;
  }, [onGlobeModeChange]);

  const flyToCategoryFace = useCallback((category) => {
    const map = mapRef.current?.getMap();
    if (!map || pauseRender || isTourMode(globeMode) || tourActiveRef.current || flightCinemaActiveRef.current) {
      return false;
    }

    const focus = getCategoryGlobeFaceView(category);
    if (!focus) return false;

    const gen = categoryFaceFlyGenRef.current + 1;
    categoryFaceFlyGenRef.current = gen;

    autoRotateRef.current = false;
    if (rotationTimer.current) clearTimeout(rotationTimer.current);

    const normalizedLng = normalizeLngNear(map.getCenter().lng, focus.lng);
    const flyMs = GLOBE_FACE_FLY_MS;
    const targetZoom = resolveCategoryFaceMapboxZoom(map.getZoom());

    const faceCamera = {
      center: [normalizedLng, focus.lat],
      zoom: targetZoom,
      pitch: GLOBE_VIEW.default.pitch,
      bearing: GLOBE_VIEW.default.bearing
    };

    try {
      map.stop();
      map.flyTo({
        ...faceCamera,
        duration: flyMs,
        essential: true
      });
    } catch {
      map.jumpTo(faceCamera);
    }

    rotationTimer.current = setTimeout(() => {
      if (categoryFaceFlyGenRef.current !== gen) return;
      if (!pauseRender && map.getZoom() <= GLOBE_VIEW.rotateZoomThreshold) {
        autoRotateRef.current = true;
      }
    }, flyMs + 400);

    return true;
  }, [globeMode, pauseRender]);

  useEffect(() => {
    if (!mapReady || pauseRender || isZenMode || !highlightCategory) return;
    if (isTourMode(globeMode) || tourActiveRef.current) return;
    if (skipCategoryFaceUntilShareCheckRef.current) return;

    const categoryChanged = prevHighlightCategoryRef.current !== highlightCategory;
    const epochChanged = prevCategoryFaceEpochRef.current !== categoryFaceEpoch;
    if (!categoryChanged && !epochChanged) return;

    prevHighlightCategoryRef.current = highlightCategory;
    prevCategoryFaceEpochRef.current = categoryFaceEpoch;
    flyToCategoryFace(highlightCategory);
  }, [
    categoryFaceEpoch,
    flyToCategoryFace,
    globeMode,
    highlightCategory,
    isZenMode,
    mapReady,
    pauseRender
  ]);

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
    if (pauseRender || !mapReady) return;
    if (!pendingFocusRef.current) return;

    // Defer until map container is visible/resized.
    const timer = window.setTimeout(applyPendingFocus, 80);
    return () => window.clearTimeout(timer);
  }, [pauseRender, mapReady, applyPendingFocus]);

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
        && !immerseActiveRef.current
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

    const inTour = isTourMode(globeMode) || tourActiveRef.current;
    const hadFlightCinema = flightCinemaActiveRef.current;

    const markerHitPx = getGateoMarkerHitThresholdPx(map?.getZoom?.());
    const markerAtPoint = map && event.point
      ? findGateoMarkerAtPoint(map, event.point, event.lngLat, markerHitPx)
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
      fullMarker = hydrateMarkerFromSpotCatalog(fullMarker, spotCatalog);
      const selectMarker = () => {
        if (onMarkerClick) onMarkerClick(fullMarker, { source: 'globe' });
      };
      if (hadFlightCinema) {
        closeFlightCinema();
        queueMicrotask(selectMarker);
        return;
      }
      selectMarker();
      return;
    }

    const clusterPoi = map && event.point ? findClusterPoiAtPoint(map, event.point) : null;
    if (clusterPoi && onMarkerClick) {
      const spotCatalog = allTravelSpots.length > 0 ? allTravelSpots : travelSpots;
      const spot = spotCatalog.find((s) => s.slug === clusterPoi.slug);
      if (spot) {
        markerClickGuardUntilRef.current = Date.now() + 450;
        const selectCluster = () => {
          onMarkerClick({ ...spot, type: 'major' }, { source: 'globe' });
        };
        if (hadFlightCinema) {
          closeFlightCinema();
          queueMicrotask(selectCluster);
          return;
        }
        selectCluster();
        return;
      }
    }
    const labelLayers = [
      ...(poiLabelLayerIdsRef.current || []),
      ...(placeLabelLayerIdsRef.current || []),
    ].filter((id) => map?.getLayer?.(id));
    const clickedLabels = map && labelLayers.length > 0
      ? map.queryRenderedFeatures(event.point, { layers: labelLayers })
      : [];
    const topLabel = clickedLabels?.[0];
    const props = topLabel?.properties || {};

    let label = '';
    for (const key of placeLabelPropertyKeysForLocale(locale)) {
      if (typeof props[key] === 'string' && props[key].trim()) {
        label = props[key].trim();
        break;
      }
    }
    let labelEn = '';
    for (const key of PLACE_LABEL_ENGLISH_KEYS) {
      if (typeof props[key] !== 'string' || !props[key].trim()) continue;
      const candidate = props[key].trim();
      // name 폴백이 한글이면 labelEn으로 쓰지 않음 (slug·name_en 오염 방지)
      if (/[\uAC00-\uD7A3\u3040-\u30ff\u3400-\u9fff]/.test(candidate)) continue;
      if (!/[A-Za-z\u00C0-\u024F]/.test(candidate)) continue;
      labelEn = candidate;
      break;
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

    if (inTour) return;

    onGlobeClick({ lat: event.lngLat.lat, lng: event.lngLat.lng, source: 'map' });
  }, [allTravelSpots, closeFlightCinema, globeMode, isZenMode, locale, onGlobeClick, onMarkerClick, pauseRender, travelSpots]);

  const mapStyle = MAP_STYLES[globeTheme] || MAP_STYLES.deep;

  /** 마운트 시 랜덤 카테고리 면 — default(0°,20°)는 아조레스 등 대서양이 항상 노출됨 */
  const initialGlobeViewState = useMemo(() => {
    const focus = getCategoryGlobeFaceView(highlightCategory);
    if (!focus) return GLOBE_VIEW.default;
    return {
      ...GLOBE_VIEW.default,
      longitude: focus.lng,
      latitude: focus.lat
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialViewState는 마운트 1회만
  }, []);

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

  const globePaused = pauseRender && !isFlightCinemaActive;
  const globeDimmed = isChatOpen && !isFlightCinemaActive;

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${
        globePaused ? 'pointer-events-none invisible' : globeDimmed ? 'opacity-30' : 'opacity-100'
      }`}
      onPointerDown={handleInteractionStart}
      onPointerUp={handleInteractionEnd}
      onPointerCancel={handleInteractionEnd}
      onPointerLeave={handleInteractionEnd}
      onWheel={handleInteractionStart}
    >
      <div
        className={`gateo-globe-map gateo-mapbox-map absolute inset-0 transition-opacity duration-300 ${
          isStyleTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
      <Map
        ref={mapRef}
        initialViewState={initialGlobeViewState}
        projection="globe"
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        onClick={handleGlobeClickInternal}
        onError={(evt) => {
          const err = evt?.error || new Error('Mapbox render error');
          const msg = String(err?.message || err || '');
          // 나라 하이라이트 레이어 일시 누락은 엔진 전체를 legacy로 내리지 않음
          if (msg.includes('gateo-region-highlight')) return;
          raiseFatal(err);
        }}
        onLoad={(evt) => {
          markGlobeLoadPhase('onLoad');
          const map = evt?.target ?? mapRef.current?.getMap();

          tryRevealGlobeBase();

          setMapReady(true);
          syncMapZoom();
          if (map && typeof map.setLanguage === 'function') {
            try {
              map.setLanguage(locale?.startsWith('en') ? 'en' : 'ko');
            } catch {
              // Style may not be ready yet.
            }
          }
          ensureInteractionReady();
          applyPendingFocus();

          const syncOverlaysSoon = () => {
            if (!map) return;
            unbindSpaceDragGuardRef.current?.();
            unbindSpaceDragGuardRef.current = bindGlobeSpaceDragGuard(map);
            if (!hasRestoredShareViewRef.current) {
              const shared = readGlobeShareViewFromUrl();
              hasRestoredShareViewRef.current = true;
              if (shared) {
                autoRotateRef.current = false;
                try {
                  map.jumpTo({
                    center: [shared.lng, shared.lat],
                    zoom: shared.zoom,
                    pitch: 0,
                    bearing: 0
                  });
                } catch {
                  // Ignore share-view restore failures.
                }
              }
              prevHighlightCategoryRef.current = highlightCategoryRef.current;
              prevCategoryFaceEpochRef.current = categoryFaceEpoch;
            }
            skipCategoryFaceUntilShareCheckRef.current = false;
            syncGateoMarkerLayers();
            tryRevealGlobeOverlays();
          };

          requestAnimationFrame(() => {
            requestAnimationFrame(syncOverlaysSoon);
          });

          const deferLabelSync = () => {
            if (!map) return;
            applyWaterPaint();
            refreshPlaceLabelLayers();
            applySatelliteBasemapLabels({ force: true });
            resetAndApplyPlaceLabelVisibility();
            tryRevealGlobeOverlays();
          };

          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(deferLabelSync, { timeout: 500 });
          } else {
            requestAnimationFrame(deferLabelSync);
          }
          flushCurationGlobeSyncIfPending();
        }}
        onStyleData={() => {
          const map = mapRef.current?.getMap();
          if (!map) return;

          if (!map.isStyleLoaded?.()) {
            flightCinemaLayersLatchedRef.current = false;
          }

          applyEarlyMapboxGlobeLabelSuppress(map, globeTheme);

          const cameraBusy =
            cameraAnimatingRef.current || isGlobeCameraBusy(map)
            || (typeof map.isMoving === 'function' && map.isMoving());

          // 자전·fly 중에도 locale text-field는 유지 (setLanguage 후 styledata가 ko로 되돌리는 것 방지)
          if (map.isStyleLoaded?.()) {
            refreshPlaceLabelLayers();
            applySatelliteBasemapLabels({ force: true });
          }

          if (cameraBusy) return;

          tryRevealGlobeOverlays();

          if (!map.isStyleLoaded?.()) return;

          ensureInteractionReady();
          applyWaterPaint();
          resetAndApplyPlaceLabelVisibility();
          syncGateoMarkerLayers();
          tryRevealGlobe();
        }}
        onIdle={() => {
          if (import.meta.env.DEV && !globeIdleMarkedRef.current) {
            globeIdleMarkedRef.current = true;
            markGlobeLoadPhase('idle');
          }
          syncMapZoom();
          applyPlaceLabelVisibility();
          const map = mapRef.current?.getMap();
          if (
            map
            && (!gateoMarkerLayersReady(map) || !isFlightCinemaGlobeReady(map))
          ) {
            syncGateoMarkerLayers();
          } else if (map && isFlightCinemaGlobeReady(map)) {
            flightCinemaLayersLatchedRef.current = true;
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
          }
          tryRevealGlobe();
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
        style={{ width: '100%', height: '100%' }}
        minZoom={1}
        maxZoom={GLOBE_VIEW.maxZoom}
        clickTolerance={GLOBE_CLICK_TOLERANCE_PX}
        dragPan
        touchZoomRotate
        attributionControl={{ compact: true }}
        fog={fogConfig}
      >
        {showCinemaAirportMarkers ? (
          <FlightCinemaAirportMarkers
            key={flightCinemaRouteIatas.join('>')}
            routeIatas={flightCinemaRouteIatas}
          />
        ) : null}

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

      {!isZenMode && !hideTourControls && !(isMobileDevice && isTourMode(globeMode)) && (
        <div
          className="absolute z-[70] pointer-events-auto flex flex-col gap-1 right-3 top-16 md:top-8 md:right-[24.8%] md:gap-2 md:flex-row md:flex-wrap md:items-center"
          role="toolbar"
          aria-label="지도 도구"
        >
          <button
            type="button"
            onClick={handleShareCurrentView}
            className={`${GLOBE_MAP_BTN_BASE} border-white/20 text-gray-100`}
            aria-label="현재 위치 공유"
            title="현재 위치 공유"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3.2v10.1" />
              <path d="m8.3 7.1 3.7-3.7 3.7 3.7" />
              <path d="M4.9 10.5v8.4A2.1 2.1 0 0 0 7 21h10a2.1 2.1 0 0 0 2.1-2.1v-8.4" />
            </svg>
          </button>
          <Link
            to="/blog"
            className={`${GLOBE_MAP_BTN_BASE} border-white/20 text-emerald-300 md:hidden`}
            aria-label="로그북"
            title="로그북"
          >
            <PenTool size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleGoToCurrentLocation}
            className={`${GLOBE_MAP_BTN_BASE} border-emerald-400/35 text-emerald-400`}
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
            className={`${GLOBE_MAP_BTN_BASE} border-blue-400/35 text-blue-400`}
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

      {canSkipTour(globeMode) && !isZenMode && !hideTourControls && (
        <div className="absolute bottom-[calc(11.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[65] pointer-events-auto lg:bottom-28">
          <button
            type="button"
            onClick={skipTour}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-4 py-2 text-xs font-bold text-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            {t('home.globeTour.skip')}
          </button>
        </div>
      )}

      {globeMode === GLOBE_MODE.TOUR_READY && (reachBoundariesReady || reachBoundariesLoading) && !isZenMode && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed left-3 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-[55] md:left-6 md:bottom-8"
          role="region"
          aria-label={t('home.globeTour.reachBoundaryAria')}
        >
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/60 px-3 py-2.5 text-[11px] text-white/85 shadow-lg backdrop-blur-sm">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 flex-1 font-bold tracking-wide text-white/95">{t('home.globeTour.reachBoundaryTitle')}</p>
              <button
                type="button"
                role="switch"
                aria-checked={reachBoundariesVisible}
                aria-label={reachBoundariesVisible ? t('home.globeTour.reachBoundaryHide') : t('home.globeTour.reachBoundaryShow')}
                disabled={reachBoundariesLoading}
                onClick={toggleReachBoundaries}
                className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full border p-0 transition-colors disabled:opacity-40 ${
                  reachBoundariesVisible
                    ? 'border-emerald-400/50 bg-emerald-500/35'
                    : 'border-white/20 bg-white/10'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-[left] duration-200 ${
                    reachBoundariesVisible ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <div className={reachBoundariesVisible ? '' : 'opacity-45'}>
              <div className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-emerald-400 shrink-0" aria-hidden="true" />
                <span>{t('home.globeTour.walkApprox', { minutes: REACH_CONTOUR_MINUTES.walk })}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block h-0.5 w-4 border-t-2 border-solid border-blue-400 shrink-0" aria-hidden="true" />
                <span>{t('home.globeTour.driveApprox', { minutes: REACH_CONTOUR_MINUTES.drive })}</span>
              </div>
            </div>
            {reachBoundariesLoading && (
              <p className="mt-1.5 text-[10px] text-white/55">{t('home.globeTour.computing')}</p>
            )}
            {reachBoundariesReady && !reachBoundariesLoading && (
              <p className="mt-1.5 text-[10px] text-white/55">
                {reachBoundariesVisible ? t('home.globeTour.legendVisible') : t('home.globeTour.legendHidden')}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}

      {showClusterLegend && clusterOverlay.meta && !isZenMode && typeof document !== 'undefined' && createPortal(
        <GlobeClusterLegend
          focusSlug={focusSlug}
          travelSpots={allTravelSpots.length > 0 ? allTravelSpots : travelSpots}
          onSelectSpot={onMarkerClick}
          className={
            clusterLegendHost
              ? ''
              : `fixed left-3 z-[55] bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))]`
          }
        />,
        clusterLegendHost || document.body
      )}

      {canEndTour(globeMode) && globeMode === GLOBE_MODE.TOUR_READY && !isZenMode && !hideTourControls && (
        <div className="absolute bottom-[calc(11.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[65] pointer-events-auto flex gap-2 lg:bottom-28">
          <button
            type="button"
            onClick={endTour}
            className="flex items-center gap-2 rounded-full border border-blue-400/35 bg-black/65 px-4 py-2 text-xs font-bold text-blue-300 shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            {t('home.globeTour.return2d')}
          </button>
        </div>
      )}

      {globeMode === GLOBE_MODE.TOUR_BOOTSTRAPPING && !isZenMode && (
        <div className="absolute inset-x-0 top-1/3 z-[65] pointer-events-none flex justify-center">
          <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
            {t('home.globeTour.terrainLoading')}
          </div>
        </div>
      )}
    </div>
  );
}));

export default HomeGlobeMapbox;
