import React, { useEffect, useMemo, useRef } from 'react';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  useControl,
} from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
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

function MapCaption({ pointCount, countLabel = '좌표' }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 right-14 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/80">
      <span className="text-white/70">
        {countLabel} {pointCount}
      </span>
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

function drillChipClass(kind) {
  if (kind === 'region') {
    return 'rounded-full border border-amber-300/90 bg-amber-500 px-3 py-1.5 text-xs font-bold text-[#1b1410] shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-amber-400';
  }
  if (kind === 'area' || kind === 'cluster') {
    return 'rounded-full border border-stone-200/90 bg-stone-900/90 px-2.5 py-1 text-[11px] font-bold text-amber-50 shadow-[0_4px_14px_rgba(0,0,0,0.4)] backdrop-blur-sm hover:bg-stone-800';
  }
  return 'rounded-full border border-amber-200/80 bg-[#fff7ed]/95 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-[0_3px_12px_rgba(0,0,0,0.35)] hover:bg-amber-100';
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
 *   drillChips?: {
 *     id: string,
 *     kind: string,
 *     label: string,
 *     count: number,
 *     lng: number,
 *     lat: number,
 *   }[],
 *   onSelectDrillChip?: (chip: object) => void,
 *   drillCrumbs?: { id: string, label: string }[],
 *   onDrillCrumb?: (index: number) => void,
 *   onDrillUp?: () => void,
 *   drillLevelLabel?: string,
 *   showSpotPins?: boolean,
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
  drillChips = null,
  onSelectDrillChip,
  drillCrumbs = null,
  onDrillCrumb,
  onDrillUp,
  drillLevelLabel = '',
  showSpotPins = true,
}) {
  const mapRef = useRef(null);
  const viewStackRef = useRef([]);
  const focusViewRef = useRef(focusView);
  focusViewRef.current = focusView;
  const pinItems = showSpotPins ? items : [];
  const geojson = useMemo(() => buildScenicMapGeoJson(pinItems), [pinItems]);
  const pointCount = geojson.features.length;
  const chips = Array.isArray(drillChips) ? drillChips : [];
  const crumbs = Array.isArray(drillCrumbs) ? drillCrumbs : [];
  const canDrillUp = crumbs.length > 1;
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
        interactiveLayerIds={showSpotPins ? INTERACTIVE_LAYERS : []}
        onLoad={handleMapLoad}
        onClick={showSpotPins ? handleClick : undefined}
        onMouseEnter={showSpotPins ? handleMouseEnter : undefined}
        onMouseLeave={showSpotPins ? handleMouseLeave : undefined}
      >
        <LanguageControl />
        <NavigationControl position="bottom-right" showCompass={false} />
        {showSpotPins ? (
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
        ) : null}
        {chips.map((chip) => (
          <Marker
            key={chip.id}
            longitude={chip.lng}
            latitude={chip.lat}
            anchor="center"
            style={{ zIndex: 2 }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDrillChip?.(chip);
              }}
              className={`pointer-events-auto inline-flex max-w-[9.5rem] items-center gap-1 ${drillChipClass(chip.kind)}`}
              aria-label={`${chip.label} ${chip.count}곳 펼치기`}
            >
              <span className="truncate">{chip.label}</span>
              <span className="shrink-0 tabular-nums opacity-80">
                {chip.count}
              </span>
            </button>
          </Marker>
        ))}
      </Map>
      {crumbs.length > 0 ? (
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex flex-col gap-1.5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-2xl border border-stone-300/80 bg-white/92 px-2.5 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.28)] backdrop-blur-md">
            {canDrillUp ? (
              <button
                type="button"
                onClick={onDrillUp}
                aria-label="상위 분류로"
                className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full border border-amber-400/80 bg-amber-50 px-2.5 text-[11px] font-bold text-stone-900 hover:border-amber-500 hover:bg-amber-100"
              >
                <ChevronLeft size={15} strokeWidth={2.5} aria-hidden="true" />
                상위
              </button>
            ) : null}
            <nav
              aria-label="지도 분류 경로"
              className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-stone-900"
            >
              {crumbs.map((crumb, idx) => {
                const last = idx === crumbs.length - 1;
                return (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 ? (
                      <span className="text-stone-400" aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    {last || typeof onDrillCrumb !== 'function' ? (
                      <span
                        className={
                          last
                            ? 'max-w-[9rem] truncate rounded-full bg-amber-100 px-2 py-0.5 font-bold text-stone-900'
                            : 'max-w-[8rem] truncate font-semibold text-stone-800'
                        }
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDrillCrumb(idx)}
                        className="max-w-[8rem] truncate rounded-full px-1.5 py-0.5 font-semibold text-stone-900 underline decoration-stone-400/70 underline-offset-2 hover:bg-amber-50 hover:decoration-amber-600"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
          {drillLevelLabel || chips.length > 0 ? (
            <p className="pointer-events-none max-w-[20rem] rounded-xl border border-stone-200/70 bg-white/85 px-2.5 py-1 text-[10px] font-medium text-stone-800 shadow-sm backdrop-blur-sm break-keep">
              {chips.length > 0
                ? `${drillLevelLabel || '분류'} 칩을 눌러 좁히세요 · 분포를 보고 여행지를 고릅니다`
                : '핀을 눌러 명소를 확인하세요'}
            </p>
          ) : null}
        </div>
      ) : null}
      {typeof onToggleFullscreen === 'function' ? (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? '지도 분할 보기로' : '지도 전체 화면'}
          aria-pressed={fullscreen}
          title={fullscreen ? '분할 보기' : '전체 화면'}
          className={`absolute right-3 z-20 flex h-10 items-center gap-1.5 rounded-full border border-white/40 bg-[#1b1410]/75 px-3 text-[11px] font-bold text-white shadow-lg backdrop-blur-md hover:bg-[#1b1410]/88 ${
            fullscreen
              ? 'top-[max(5.25rem,calc(env(safe-area-inset-top)+4.75rem))]'
              : crumbs.length > 0
                ? 'top-[4.85rem]'
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
      <MapCaption
        countLabel={showSpotPins ? '좌표' : '분류'}
        pointCount={
          showSpotPins
            ? pointCount
            : chips.reduce((n, c) => n + (c.count || 0), 0)
        }
      />
    </div>
  );
}
