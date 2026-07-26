import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Map, { Marker, NavigationControl, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { Maximize2, X } from 'lucide-react';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution';
import { festivalLngLat } from './koreaFestivalCorridors';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const MAP_CHIP_LIMIT = 180;

const KR_VIEW = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 5.6,
};

const CAPTION_LINKS = MAPBOX_ATTRIBUTION_LINKS.filter(
  (item) => item.label === '© Mapbox' || item.label === '© OpenStreetMap',
);

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
function buildMarkers(items) {
  /** @type {{ contentId: string, title: string, lng: number, lat: number }[]} */
  const out = [];
  for (const item of items || []) {
    const pt = festivalLngLat(item?.mapx, item?.mapy);
    if (!pt) continue;
    const contentId = String(item?.contentId || '');
    if (!contentId) continue;
    out.push({
      contentId,
      title: String(item?.title || ''),
      lng: pt.lng,
      lat: pt.lat,
    });
    if (out.length >= MAP_CHIP_LIMIT) break;
  }
  return out;
}

/**
 * @param {{
 *   markers: { contentId: string, title: string, lng: number, lat: number }[],
 *   activeContentId?: string,
 *   onSelectPoint?: (contentId: string) => void,
 *   navPosition?: 'top-right' | 'top-left',
 *   reuseMaps?: boolean,
 * }} props
 */
function FestivalMapCanvas({
  markers,
  activeContentId = '',
  onSelectPoint,
  navPosition = 'top-right',
  reuseMaps = true,
}) {
  return (
    <Map
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
    >
      <LanguageControl />
      <NavigationControl position={navPosition} showCompass={false} />
      {markers.map((m) => {
        const active = activeContentId && activeContentId === m.contentId;
        return (
          <Marker
            key={m.contentId}
            longitude={m.lng}
            latitude={m.lat}
            anchor="bottom"
            style={{ zIndex: active ? 20 : 10 }}
          >
            <button
              type="button"
              title={m.title}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoint?.(m.contentId);
              }}
                className={`max-w-[7.5rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-colors ${
                  active
                    ? 'border-amber-200 bg-amber-300 text-[#1b1410] ring-2 ring-amber-100/80'
                    : 'border-amber-900/40 bg-amber-500 text-[#1b1410] hover:bg-amber-400 hover:border-amber-800/50'
                }`}
            >
              {shortTitle(m.title)}
            </button>
          </Marker>
        );
      })}
    </Map>
  );
}

function MapCaption({ pointCount, totalWithCoords }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 right-14 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/80">
      <span className="text-white/70">
        칩 {pointCount}
        {totalWithCoords > MAP_CHIP_LIMIT ? `/${totalWithCoords}` : ''}
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

/**
 * @param {{
 *   items: object[],
 *   activeContentId?: string,
 *   onSelectPoint?: (contentId: string) => void,
 *   className?: string,
 * }} props
 */
export default function KoreaFestivalMap({
  items,
  activeContentId = '',
  onSelectPoint,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  const markers = useMemo(() => buildMarkers(items), [items]);
  const pointCount = markers.length;
  const totalWithCoords = useMemo(() => {
    let n = 0;
    for (const item of items || []) {
      if (festivalLngLat(item?.mapx, item?.mapy)) n += 1;
    }
    return n;
  }, [items]);

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
          권역 칩과 카드로 축제를 찾아 보세요. ({totalWithCoords}곳 좌표)
        </p>
      </div>
    );
  }

  const mapProps = {
    markers,
    activeContentId,
    onSelectPoint,
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
        <MapCaption pointCount={pointCount} totalWithCoords={totalWithCoords} />
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
              <MapCaption
                pointCount={pointCount}
                totalWithCoords={totalWithCoords}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
