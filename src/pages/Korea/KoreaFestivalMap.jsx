import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Map, {
  Layer,
  NavigationControl,
  Source,
  useControl,
} from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { Maximize2, X } from 'lucide-react';
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

/**
 * @param {{
 *   geojson: GeoJSON.FeatureCollection,
 *   activeContentId?: string,
 *   onSelectPoint?: (contentId: string) => void,
 *   navPosition?: 'top-right' | 'top-left',
 *   reuseMaps?: boolean,
 *   focusView?: { lng: number, lat: number, zoom?: number } | null,
 * }} props
 */
function FestivalMapCanvas({
  geojson,
  activeContentId = '',
  onSelectPoint,
  navPosition = 'top-right',
  reuseMaps = true,
  focusView = null,
}) {
  const mapRef = useRef(null);
  const focusKey = focusView
    ? `${focusView.lng},${focusView.lat},${focusView.zoom ?? 9}`
    : '';

  useEffect(() => {
    if (!focusView || !mapRef.current) return;
    const map = mapRef.current;
    map.flyTo({
      center: [focusView.lng, focusView.lat],
      zoom: focusView.zoom ?? 9,
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
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !Array.isArray(coords)) return;
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

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={KR_VIEW}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      attributionControl={{ compact: true }}
      logoPosition="bottom-left"
      reuseMaps={reuseMaps}
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
      <NavigationControl position={navPosition} showCompass={false} />
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
  );
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

/**
 * @param {{
 *   items: object[],
 *   activeContentId?: string,
 *   onSelectPoint?: (contentId: string) => void,
 *   focusView?: { lng: number, lat: number, zoom?: number } | null,
 *   className?: string,
 * }} props
 */
export default function KoreaFestivalMap({
  items,
  activeContentId = '',
  onSelectPoint,
  focusView = null,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  const geojson = useMemo(() => buildGeoJson(items), [items]);
  const pointCount = geojson.features.length;

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex min-h-[240px] h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center ${className}`}
      >
        <p className="text-sm text-gray-300">지도를 표시할 수 없습니다.</p>
        <p className="mt-1 text-[11px] text-gray-500">
          시간·취향 칩과 카드로 축제를 찾아 보세요. ({pointCount}곳 좌표)
        </p>
      </div>
    );
  }

  const mapProps = {
    geojson,
    activeContentId,
    onSelectPoint,
    focusView,
  };

  return (
    <>
      <div
        className={`relative h-full min-h-[240px] overflow-hidden rounded-2xl border border-white/10 ${className}`}
      >
        <FestivalMapCanvas {...mapProps} navPosition="top-right" reuseMaps />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="지도 전체화면"
          className="absolute top-3 left-3 z-[5] flex items-center gap-1.5 rounded-full border border-white/25 bg-[#1b1410]/85 px-3 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-md transition-colors hover:border-amber-300/50 hover:bg-[#2a1f18]"
        >
          <Maximize2 size={13} aria-hidden="true" />
          전체화면
        </button>
        <MapCaption pointCount={pointCount} />
      </div>

      {expanded &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-screen overflow-hidden bg-[#1b1410] animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="국내 축제 지도 전체화면"
          >
            <div className="relative h-full w-full">
              <FestivalMapCanvas
                {...mapProps}
                navPosition="top-left"
                reuseMaps={false}
              />
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="전체화면 닫기"
                className="absolute z-[220] top-4 right-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all hover:border-red-300/60 hover:bg-red-500/90 hover:ring-red-300/40"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
              <MapCaption pointCount={pointCount} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
