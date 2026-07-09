import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Map, { Marker, NavigationControl, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { Map as MapIcon, MapPin, X } from 'lucide-react';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../../data/mapboxAttribution';
import {
  PLACE_STATIC_MAP_ZOOM,
  resolvePlaceStaticMap,
} from '../../../utils/placeStaticMap';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

const CAPTION_LINKS = MAPBOX_ATTRIBUTION_LINKS.filter((item) =>
  item.label === '© Mapbox' || item.label === '© OpenStreetMap',
);

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

function MapAttributionLinks({ className = '' }) {
  return (
    <span className={`shrink-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${className}`}>
      {CAPTION_LINKS.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 ? <span className="text-white/40" aria-hidden>·</span> : null}
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-amber-300 underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {item.label}
          </a>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * 전체화면 인터랙티브 지도 — 휠/핀치 확대·드래그 이동.
 * 출처는 Mapbox 기본 attribution(좌·우)만 — Static 캡션 중복 없음.
 */
function PlaceStaticMapExplorer({ lat, lng, placeLabel, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-screen overflow-hidden bg-black animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${placeLabel} 위치 지도 탐색`}
    >
      <div className="relative h-full w-full gateo-place-map-explorer">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: lng,
            latitude: lat,
            zoom: PLACE_STATIC_MAP_ZOOM,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          attributionControl={{ compact: true }}
          logoPosition="bottom-left"
          scrollZoom
          dragPan
          dragRotate={false}
          touchZoomRotate
          doubleClickZoom
          keyboard
          reuseMaps={false}
        >
          <LanguageControl />
          <NavigationControl position="top-left" showCompass={false} />
          <Marker longitude={lng} latitude={lat} anchor="bottom">
            <MapPin
              size={36}
              className="text-amber-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
              fill="currentColor"
              stroke="#05070a"
              strokeWidth={1.25}
              aria-hidden
            />
          </Marker>
        </Map>

        <div className="absolute z-[220] top-4 right-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:right-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all hover:border-red-300/60 hover:bg-red-500/90 hover:ring-red-300/40"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 캐시 hit 시 onLoad가 다시 안 불릴 수 있음 → complete/naturalWidth로 복구.
 * @param {HTMLImageElement | null} img
 */
function isImgDecoded(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * 여행 스케치 — Mapbox Static(본문) + 전체화면 GL 탐색.
 * 좌표·토큰 없으면 null. PlaceMiniMap 본문 부활 아님.
 */
const PlaceWikiLocatorMap = ({ location, isActive = true }) => {
  const [imgStatus, setImgStatus] = useState('idle'); // idle | loading | ready | error
  const [isExpanded, setIsExpanded] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const imgRef = useRef(null);
  const lastUrlRef = useRef('');

  const mapInfo = useMemo(() => resolvePlaceStaticMap(location), [
    location?.lat,
    location?.lng,
    location?.latitude,
    location?.longitude,
  ]);

  const placeLabel = location?.name || location?.name_en || '여행지';
  const canExplore = Boolean(isActive && MAPBOX_TOKEN && mapInfo);
  const imageUrl = mapInfo?.imageUrl || '';

  const syncImgStatus = useCallback((img) => {
    if (!img || !imageUrl) return;
    if (isImgDecoded(img)) {
      setImgStatus('ready');
      return;
    }
    if (img.complete && img.naturalWidth === 0) {
      setImgStatus('error');
    }
  }, [imageUrl]);

  // URL이 바뀔 때만 loading 리셋 — 같은 URL 재진입 시 onLoad 누락으로 고착 방지
  useEffect(() => {
    if (!imageUrl) {
      lastUrlRef.current = '';
      setImgStatus('idle');
      return;
    }
    if (lastUrlRef.current !== imageUrl) {
      lastUrlRef.current = imageUrl;
      setImgStatus('loading');
    }
    const frame = requestAnimationFrame(() => syncImgStatus(imgRef.current));
    return () => cancelAnimationFrame(frame);
  }, [imageUrl, reloadNonce, syncImgStatus]);

  // 탭/창 복귀·bfcache: 디코드된 이미지는 ready만 복구. 깨진 경우만 1회 리마운트.
  useEffect(() => {
    if (!isActive || !imageUrl) return undefined;

    const recoverIfBroken = () => {
      const img = imgRef.current;
      if (isImgDecoded(img)) {
        setImgStatus('ready');
        return;
      }
      if (img && !img.complete) return;
      setImgStatus('loading');
      setReloadNonce((n) => n + 1);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') recoverIfBroken();
    };

    window.addEventListener('pageshow', recoverIfBroken);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', recoverIfBroken);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isActive, imageUrl]);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isActive) setIsExpanded(false);
  }, [isActive]);

  if (!mapInfo) return null;

  // error여도 블록 유지 — 재시도 (예전: return null → 탭 복귀 후 지도 증발)
  // isActive=false여도 마운트 유지 (부모 hidden) — 재진입 깜박임 방지
  return (
    <>
      <figure
        className="mb-8 rounded-2xl md:rounded-3xl overflow-hidden relative animate-fade-in bg-[#05070a] max-h-[75vh] md:max-h-[85vh] shadow-xl border border-white/5"
        style={{ aspectRatio: '3 / 2' }}
      >
        {imgStatus !== 'ready' ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/5 pointer-events-none">
            <MapIcon size={28} className={`text-white/20 ${imgStatus === 'loading' ? 'animate-pulse' : ''}`} />
            {imgStatus === 'error' ? (
              <button
                type="button"
                className="pointer-events-auto text-[11px] text-white/70 underline underline-offset-2 hover:text-amber-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setImgStatus('loading');
                  setReloadNonce((n) => n + 1);
                }}
              >
                지도 다시 불러오기
              </button>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          className="absolute inset-0 z-[1] block w-full h-full cursor-zoom-in p-0 border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset disabled:cursor-default"
          onClick={() => {
            if (imgStatus === 'ready' && canExplore) setIsExpanded(true);
          }}
          aria-label={`${placeLabel} 위치 지도 크게 보기 · 확대·이동`}
          disabled={imgStatus !== 'ready' || !canExplore}
        >
          {imgStatus !== 'error' ? (
            <img
              key={`${imageUrl}#${reloadNonce}`}
              ref={imgRef}
              src={imageUrl}
              alt=""
              className={`w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
                imgStatus === 'ready' ? 'opacity-100' : 'opacity-0'
              }`}
              decoding="async"
              onLoad={(e) => {
                if (isImgDecoded(e.currentTarget)) setImgStatus('ready');
              }}
              onError={() => setImgStatus('error')}
              draggable={false}
            />
          ) : null}
        </button>
        <figcaption className="absolute inset-x-0 bottom-0 z-[2] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-2.5 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs text-white/70 pointer-events-none">
          <span className="font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            위치 지도
            {canExplore ? (
              <span className="ml-1.5 font-normal text-white/65">탭하여 확대·이동</span>
            ) : null}
          </span>
          <span className="pointer-events-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <MapAttributionLinks />
          </span>
        </figcaption>
      </figure>

      {isExpanded && canExplore
        ? createPortal(
            <PlaceStaticMapExplorer
              lat={mapInfo.lat}
              lng={mapInfo.lng}
              placeLabel={placeLabel}
              onClose={() => setIsExpanded(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
};

export default PlaceWikiLocatorMap;
