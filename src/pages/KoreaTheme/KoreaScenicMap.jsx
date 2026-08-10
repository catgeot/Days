import React, { useEffect, useMemo, useRef } from 'react';
import Map, {
  Layer,
  NavigationControl,
  Source,
  useControl,
} from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution';
import {
  buildScenicMapGeoJson,
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
} from './koreaScenicMapData';
import 'mapbox-gl/dist/mapbox-gl.css';

export {
  buildScenicMapGeoJson,
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const SOURCE_ID = 'korea-scenic';
const CLUSTER_LAYER = 'korea-scenic-clusters';
const CLUSTER_COUNT_LAYER = 'korea-scenic-cluster-count';
const POINT_LAYER = 'korea-scenic-points';
const POINT_LABEL_LAYER = 'korea-scenic-point-label';
const ACTIVE_LAYER = 'korea-scenic-active';
const INTERACTIVE_LAYERS = [
  CLUSTER_LAYER,
  CLUSTER_COUNT_LAYER,
  POINT_LAYER,
  POINT_LABEL_LAYER,
];

const KR_VIEW = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 5.6,
};

const CAPTION_LINKS = MAPBOX_ATTRIBUTION_LINKS.filter(
  (item) => item.label === '© Mapbox' || item.label === '© OpenStreetMap',
);

const clusterPaint = {
  'circle-color': [
    'step',
    ['get', 'point_count'],
    '#f59e0b',
    10,
    '#d97706',
    30,
    '#b45309',
  ],
  'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26],
  'circle-stroke-width': 2,
  'circle-stroke-color': 'rgba(27, 20, 16, 0.55)',
};

const pointPaint = {
  'circle-color': '#f59e0b',
  'circle-radius': 7,
  'circle-stroke-width': 2,
  'circle-stroke-color': 'rgba(27, 20, 16, 0.65)',
};

const activePaint = {
  'circle-color': '#fcd34d',
  'circle-radius': 10,
  'circle-stroke-width': 3,
  'circle-stroke-color': '#fff7ed',
};

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

/** @param {import('mapbox-gl').Map | null | undefined} map */
function applyKoreanPlaceLabels(map) {
  if (!map || typeof map.setLanguage !== 'function') return;
  try {
    map.setLanguage('ko');
  } catch {
    /* ignore */
  }
}

function MapCaption({ pointCount }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 right-14 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/80">
      <span className="text-white/70">좌표 {pointCount}</span>
      <span className="text-white/40">·</span>
      {CAPTION_LINKS.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 ? <span className="text-white/40">·</span> : null}
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto underline-offset-2 hover:underline hover:text-amber-200"
          >
            {item.label}
          </a>
        </React.Fragment>
      ))}
    </div>
  );
}

function readMapView(map) {
  if (!map || typeof map.getCenter !== 'function') return null;
  const c = map.getCenter();
  const zoom = map.getZoom();
  if (!c || !Number.isFinite(c.lng) || !Number.isFinite(c.lat)) return null;
  if (!Number.isFinite(zoom)) return null;
  return { lng: c.lng, lat: c.lat, zoom };
}

function viewsDiffer(a, b, eps = 0.02) {
  if (!a || !b) return true;
  return (
    Math.abs(a.lng - b.lng) > eps ||
    Math.abs(a.lat - b.lat) > eps ||
    Math.abs(a.zoom - b.zoom) > 0.15
  );
}

function isBoundsFocus(view) {
  return (
    view &&
    Number.isFinite(view.west) &&
    Number.isFinite(view.south) &&
    Number.isFinite(view.east) &&
    Number.isFinite(view.north)
  );
}

function isCenterFocus(view) {
  return view && Number.isFinite(view.lng) && Number.isFinite(view.lat);
}

function isValidFocusView(view) {
  return isBoundsFocus(view) || isCenterFocus(view);
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {object} focusView
 * @param {{ pushHistory?: boolean, pushCurrentView?: () => void }} [opts]
 */
function applyFocusCamera(map, focusView, opts = {}) {
  if (!map || !isValidFocusView(focusView)) return false;
  const pushHistory = Boolean(opts.pushHistory);
  const pushCurrentView = opts.pushCurrentView;
  const cur = readMapView(map);

  if (isBoundsFocus(focusView)) {
    if (pushHistory && cur && pushCurrentView) pushCurrentView();
    map.fitBounds(
      [
        [focusView.west, focusView.south],
        [focusView.east, focusView.north],
      ],
      {
        padding: 56,
        maxZoom: focusView.maxZoom ?? 11.5,
        duration: 700,
        essential: true,
      },
    );
    return true;
  }

  const next = {
    lng: focusView.lng,
    lat: focusView.lat,
    zoom: focusView.zoom ?? 9,
  };
  if (pushHistory && cur && viewsDiffer(cur, next) && pushCurrentView) {
    pushCurrentView();
  }
  map.flyTo({
    center: [next.lng, next.lat],
    zoom: next.zoom,
    essential: true,
  });
  return true;
}

/**
 * @param {{
 *   items: object[],
 *   activeSpotId?: string,
 *   onSelectPoint?: (spotId: string) => void,
 *   focusView?: (
 *     | { lng: number, lat: number, zoom?: number }
 *     | { west: number, south: number, east: number, north: number, maxZoom?: number }
 *   ) | null,
 *   historyKey?: string | number,
 *   layoutKey?: string | number,
 *   fullscreen?: boolean,
 *   onToggleFullscreen?: () => void,
 *   className?: string,
 * }} props
 */
export default function KoreaScenicMap({
  items,
  activeSpotId = '',
  onSelectPoint,
  focusView = null,
  historyKey = '',
  layoutKey = '',
  fullscreen = false,
  onToggleFullscreen,
  className = '',
}) {
  const mapRef = useRef(null);
  const viewStackRef = useRef([]);
  const focusViewRef = useRef(focusView);
  focusViewRef.current = focusView;
  const geojson = useMemo(() => buildScenicMapGeoJson(items), [items]);
  const pointCount = geojson.features.length;
  const focusKey = focusView
    ? isBoundsFocus(focusView)
      ? `b:${focusView.west},${focusView.south},${focusView.east},${focusView.north},${focusView.maxZoom ?? ''}`
      : `c:${focusView.lng},${focusView.lat},${focusView.zoom ?? 9}`
    : '';

  const pushCurrentView = () => {
    const map = mapRef.current;
    const view = readMapView(map);
    if (!view) return;
    const stack = viewStackRef.current;
    const top = stack[stack.length - 1];
    if (top && !viewsDiffer(top, view)) return;
    stack.push(view);
  };

  const clearViewHistory = () => {
    viewStackRef.current = [];
  };

  const resolveMapInstance = (mapLike) => {
    if (!mapLike) return null;
    if (typeof mapLike.getCenter === 'function') return mapLike;
    if (typeof mapLike.getMap === 'function') return mapLike.getMap();
    return null;
  };

  useEffect(() => {
    clearViewHistory();
    const map = resolveMapInstance(mapRef.current);
    if (!map) return;
    const focus = focusViewRef.current;
    if (isValidFocusView(focus)) {
      applyFocusCamera(map, focus, { pushHistory: false });
      return;
    }
    map.flyTo({
      center: [KR_VIEW.longitude, KR_VIEW.latitude],
      zoom: KR_VIEW.zoom,
      essential: true,
      duration: 500,
    });
  }, [historyKey]);

  useEffect(() => {
    const map = resolveMapInstance(mapRef.current);
    if (!map || typeof map.resize !== 'function') return;
    const id = window.requestAnimationFrame(() => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [layoutKey, fullscreen]);

  useEffect(() => {
    if (!focusKey || !focusView) return;
    const map = resolveMapInstance(mapRef.current);
    if (!map) return;
    applyFocusCamera(map, focusView, {
      pushHistory: true,
      pushCurrentView,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const handleMapLoad = (e) => {
    const map = e?.target;
    applyKoreanPlaceLabels(map);
    const focus = focusViewRef.current;
    if (isValidFocusView(focus)) {
      applyFocusCamera(map, focus, { pushHistory: false });
    }
  };

  const activeFilter = useMemo(
    () =>
      activeSpotId
        ? ['==', ['get', 'spotId'], activeSpotId]
        : ['==', ['get', 'spotId'], ''],
    [activeSpotId],
  );

  const handleClick = (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const map = mapRef.current;
    if (!map) return;

    const isCluster =
      feature.properties?.cluster || feature.properties?.point_count != null;
    if (isCluster) {
      const clusterId = feature.properties.cluster_id;
      const source = map.getSource(SOURCE_ID);
      if (!source || typeof source.getClusterExpansionZoom !== 'function') {
        return;
      }
      const coords = feature.geometry?.coordinates;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !Array.isArray(coords)) return;
        pushCurrentView();
        map.easeTo({
          center: coords,
          zoom: Math.min(Number(zoom) || map.getZoom() + 2, 14),
          duration: 450,
        });
      });
      return;
    }

    const spotId = String(feature.properties?.spotId || '');
    if (spotId) onSelectPoint?.(spotId);
  };

  const handleMouseEnter = () => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = 'pointer';
  };

  const handleMouseLeave = () => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = '';
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-[#1b1410] px-4 py-10 text-center ${className}`}
      >
        <p className="text-sm text-gray-300">지도를 표시할 수 없습니다.</p>
        <p className="mt-1 text-[11px] text-gray-500">
          Mapbox 토큰이 필요합니다. ({pointCount}곳 좌표)
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={KR_VIEW}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        logoPosition="bottom-left"
        reuseMaps
        scrollZoom
        dragPan
        dragRotate={false}
        touchZoomRotate
        doubleClickZoom
        keyboard
        interactiveLayerIds={INTERACTIVE_LAYERS}
        onLoad={handleMapLoad}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <LanguageControl />
        <NavigationControl position="bottom-right" showCompass={false} />
        <Source
          id={SOURCE_ID}
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={13}
          clusterRadius={52}
        >
          <Layer
            id={CLUSTER_LAYER}
            type="circle"
            filter={['has', 'point_count']}
            paint={clusterPaint}
          />
          <Layer
            id={CLUSTER_COUNT_LAYER}
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            }}
            paint={{ 'text-color': '#1b1410' }}
          />
          <Layer
            id={POINT_LAYER}
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={pointPaint}
          />
          <Layer
            id={POINT_LABEL_LAYER}
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'titleShort'],
              'text-size': 11,
              'text-offset': [0, 1.35],
              'text-anchor': 'top',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-max-width': 8,
            }}
            paint={{
              'text-color': '#1b1410',
              'text-halo-color': '#f59e0b',
              'text-halo-width': 1.4,
            }}
          />
          <Layer
            id={ACTIVE_LAYER}
            type="circle"
            filter={activeFilter}
            paint={activePaint}
          />
        </Source>
      </Map>
      {typeof onToggleFullscreen === 'function' ? (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? '지도 분할 보기로' : '지도 전체 화면'}
          aria-pressed={fullscreen}
          title={fullscreen ? '분할 보기' : '전체 화면'}
          className={`absolute right-3 z-10 flex h-10 items-center gap-1.5 rounded-full border border-white/40 bg-[#1b1410]/70 px-3 text-[11px] font-bold text-white shadow-lg backdrop-blur-md hover:bg-[#1b1410]/85 ${
            fullscreen
              ? 'top-[max(5.25rem,calc(env(safe-area-inset-top)+4.75rem))]'
              : 'top-3'
          }`}
        >
          {fullscreen ? (
            <Minimize2 size={15} aria-hidden="true" />
          ) : (
            <Maximize2 size={15} aria-hidden="true" />
          )}
          {fullscreen ? '축소' : '전체'}
        </button>
      ) : null}
      <MapCaption pointCount={pointCount} />
    </div>
  );
}
