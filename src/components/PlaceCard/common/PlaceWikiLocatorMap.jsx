import React, { useEffect, useState } from 'react';
import { ExternalLink, Map as MapIcon } from 'lucide-react';
import { fetchWikiLocatorMap } from '../../../utils/wikiLocatorMap';

/**
 * 여행 스케치 — Wikidata P242 로케이터 지도(정적 이미지).
 * 없으면 null (블록 숨김).
 */
const PlaceWikiLocatorMap = ({ location, isActive = true }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty
  const [mapInfo, setMapInfo] = useState(null);

  const placeKey = location?.slug || location?.name_en || location?.name || '';

  useEffect(() => {
    if (!isActive || !placeKey) {
      setStatus('idle');
      setMapInfo(null);
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setMapInfo(null);

    const query = {
      slug: location?.slug,
      name_en: location?.name_en,
      name: location?.name,
    };

    fetchWikiLocatorMap(query)
      .then((result) => {
        if (cancelled) return;
        if (result?.imageUrl) {
          setMapInfo(result);
          setStatus('ready');
        } else {
          setMapInfo(null);
          setStatus('empty');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMapInfo(null);
        setStatus('empty');
      });

    return () => {
      cancelled = true;
    };
    // placeKey로 장소 전환만 추적 (location 객체 참조 변경으로 재요청 방지)
  }, [isActive, placeKey, location?.slug, location?.name_en, location?.name]);

  if (!isActive || !placeKey) return null;

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="bg-white/5 p-2 md:p-4 rounded-3xl border border-white/10 shadow-xl my-12 md:mx-12 animate-pulse">
        <div className="w-full h-56 md:h-72 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <MapIcon size={28} className="text-white/20" />
        </div>
      </div>
    );
  }

  if (status === 'empty' || !mapInfo) return null;

  return (
    <div className="bg-white/5 p-2 md:p-4 rounded-3xl border border-white/10 shadow-xl my-12 md:mx-12 animate-fade-in">
      <figure className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#eef1f4]">
        <a
          href={mapInfo.commonsFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
          aria-label={`${location?.name || location?.name_en || '여행지'} 위치 지도 — Wikimedia Commons에서 보기`}
        >
          <img
            src={mapInfo.imageUrl}
            alt={`${location?.name || location?.name_en || '여행지'} 위치 지도`}
            className="w-full max-h-[420px] md:max-h-[480px] object-contain mx-auto"
            loading="lazy"
            decoding="async"
          />
        </a>
        <figcaption className="flex items-center justify-between gap-3 px-3 py-2 md:px-4 bg-[#05070a]/90 text-[10px] md:text-xs text-white/60">
          <span className="truncate">
            위치 지도 ·{' '}
            <a
              href={mapInfo.commonsFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-amber-300 underline-offset-2 hover:underline inline-flex items-center gap-1"
            >
              Wikimedia Commons
              <ExternalLink size={11} className="opacity-70 shrink-0" />
            </a>
          </span>
          <span className="shrink-0 text-white/40">CC BY-SA</span>
        </figcaption>
      </figure>
    </div>
  );
};

export default PlaceWikiLocatorMap;
