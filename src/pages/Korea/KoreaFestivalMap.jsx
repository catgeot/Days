import React, { useEffect, useMemo, useRef } from 'react';
import Map, {
  Layer,
  NavigationControl,
  Source,
  useControl,
} from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution';
import { festivalLngLat } from './koreaFestivalCorridors';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const SOURCE_ID = 'korea-festivals';
const CLUSTER_LAYER = 'korea-festivals-clusters';
const CLUSTER_COUNT_LAYER = 'korea-festivals-cluster-count';
const POINT_LAYER = 'korea-festivals-points';
const POINT_LABEL_LAYER = 'korea-festivals-point-label';
const ACTIVE_LAYER = 'korea-festivals-active';
const INTERACTIVE_LAYERS = [
  CLUSTER_LAYER,
  CLUSTER_COUNT_LAYER,
  POINT_LAYER,
  POINT_LABEL_LAYER,
];
const CLUSTER_LEAF_LIMIT = 48;

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

function shortTitle(title) {
  const s = String(title || '').trim();
  if (s.length <= 10) return s;
  return `${s.slice(0, 9)}…`;
}

/**
 * @param {object[]} items
 */
function buildGeoJson(items) {
  /** @type {GeoJSON.Feature[]} */
  const features = [];
  for (const item of items || []) {
    const pt = festivalLngLat(item?.mapx, item?.mapy);
    if (!pt) continue;
    const contentId = String(item?.contentId || '');
    if (!contentId) continue;
    const title = String(item?.title || '');
    features.push({
      type: 'Feature',
      properties: {
        contentId,
        title,
        titleShort: shortTitle(title),
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.lng, pt.lat],
      },
    });
  }
  return { type: 'FeatureCollection', features };
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

/**
 * @param {{
 *   items: object[],
 *   activeContentId?: string,
 *   onSelectPoint?: (contentId: string) => void,
 *   onSelectCluster?: (contentIds: string[]) => void,
 *   focusView?: { lng: number, lat: number, zoom?: number } | null,
 *   historyKey?: string | number,
 *   backNonce?: number,
 *   className?: string,
 * }} props
 */
export default function KoreaFestivalMap({
  items,
  activeContentId = '',
  onSelectPoint,
  onSelectCluster,
  focusView = null,
  historyKey = '',
  backNonce = 0,
  className = '',
}) {
  const mapRef = useRef(null);
  const viewStackRef = useRef([]);
  const geojson = useMemo(() => buildGeoJson(items), [items]);
  const pointCount = geojson.features.length;
  const focusKey = focusView
    ? `${focusView.lng},${focusView.lat},${focusView.zoom ?? 9}`
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

  useEffect(() => {
    clearViewHistory();
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [KR_VIEW.longitude, KR_VIEW.latitude],
      zoom: KR_VIEW.zoom,
      essential: true,
      duration: 500,
    });
  }, [historyKey]);

  const popCameraBack = () => {
    const map = mapRef.current;
    const stack = viewStackRef.current;
    if (!map || stack.length === 0) return false;
    const prev = stack.pop();
    if (!prev) return false;
    map.flyTo({
      center: [prev.lng, prev.lat],
      zoom: prev.zoom,
      essential: true,
      duration: 500,
    });
    return true;
  };

  useEffect(() => {
    if (!backNonce) return;
    popCameraBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backNonce]);

  useEffect(() => {
    if (!focusView || !mapRef.current) return;
    const map = mapRef.current;
    const next = {
      lng: focusView.lng,
      lat: focusView.lat,
      zoom: focusView.zoom ?? 9,
    };
    const cur = readMapView(map);
    if (cur && viewsDiffer(cur, next)) pushCurrentView();
    map.flyTo({
      center: [next.lng, next.lat],
      zoom: next.zoom,
      essential: true,
    });
  }, [focusKey, focusView]);

  const activeFilter = useMemo(
    () =>
      activeContentId
        ? ['==', ['get', 'contentId'], activeContentId]
        : ['==', ['get', 'contentId'], ''],
    [activeContentId],
  );

  const handleClick = (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const map = mapRef.current;
    if (!map) return;

    const isCluster =
      feature.properties?.cluster ||
      feature.properties?.point_count != null;
    if (isCluster) {
      const clusterId = feature.properties.cluster_id;
      const source = map.getSource(SOURCE_ID);
      if (!source || typeof source.getClusterExpansionZoom !== 'function') return;
      const coords = feature.geometry?.coordinates;

      if (typeof source.getClusterLeaves === 'function' && onSelectCluster) {
        source.getClusterLeaves(
          clusterId,
          CLUSTER_LEAF_LIMIT,
          0,
          (err, leaves) => {
            if (err || !Array.isArray(leaves)) return;
            const ids = leaves
              .map((f) => String(f?.properties?.contentId || ''))
              .filter(Boolean);
            if (ids.length) onSelectCluster(ids);
          },
        );
      }

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

    const contentId = String(feature.properties?.contentId || '');
    if (contentId) onSelectPoint?.(contentId);
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
      <MapCaption pointCount={pointCount} />
    </div>
  );
}
