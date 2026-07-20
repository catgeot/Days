import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BedDouble, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import {
  canShowMrtStayStrip,
  fetchMrtStaysForLocation,
} from '../../../utils/fetchMrtStays';
import { getAddressFromCoordinates } from '../lib/geocoding';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';

const DRAG_CLICK_THRESHOLD_PX = 6;
const LG_MQ = '(min-width: 1024px)';

function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isLg;
}

function formatPrice(n) {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) <= 0) return null;
  return `${Number(n).toLocaleString('ko-KR')}원~`;
}

function hasStayAdminLadder(admin) {
  if (!admin || typeof admin !== 'object') return false;
  return Boolean(
    admin.neighbourhood ||
      admin.district ||
      admin.city ||
      admin.cityEn ||
      admin.county ||
      admin.state
  );
}

async function withStayAdmin(location) {
  if (!location || hasStayAdminLadder(location.stayAdmin)) return location;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return location;
  try {
    const addr = await getAddressFromCoordinates(lat, lng);
    if (!addr) return location;
    return {
      ...location,
      stayAdmin: addr.stayAdmin || location.stayAdmin,
      country: isPlaceholderCountry(location.country)
        ? addr.country || location.country
        : location.country,
      country_en: isPlaceholderCountry(location.country_en)
        ? addr.country_en || location.country_en
        : location.country_en,
    };
  } catch {
    return location;
  }
}

/**
 * Summary「숙소」토글 — 펼칠 때만 MRT 카드 스트립.
 * PC: 카드 좌측 플라이아웃 · 모바일: 아래 스트립.
 * slug SSOT + uiPlace(국가·키워드 있을 때). 지도 핀·호텔 지오코딩 없음.
 */
export default function GlobeStayStrip({ location, hidden = false }) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty | error
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const fetchedKeyRef = useRef('');

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : '';
  const name = location?.name || '';
  const nameEn = location?.name_en || '';
  const country = location?.country || '';
  const isScanning = Boolean(location?.isScanning);
  const placeKey = `${slug}|${name}|${country}|${location?.lat}|${location?.lng}`;
  const eligible = canShowMrtStayStrip(location, { hidden }) && !isScanning;

  useEffect(() => {
    setExpanded(false);
    setItems(null);
    setStatus('idle');
    fetchedKeyRef.current = '';
  }, [placeKey]);

  useEffect(() => {
    if (!eligible || !expanded) return undefined;
    if (fetchedKeyRef.current === placeKey) return undefined;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const locForFetch = await withStayAdmin(location);
      if (cancelled) return;
      const result = await fetchMrtStaysForLocation(locForFetch);
      if (cancelled) return;
      fetchedKeyRef.current = placeKey;
      if (result?.items?.length) {
        setItems(result.items);
        setStatus('ready');
      } else {
        setItems(null);
        setStatus(result == null ? 'error' : 'empty');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, expanded, placeKey, location]);

  const syncScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    if (!expanded || status !== 'ready' || !items?.length) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;
    syncScrollButtons();

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth + 2) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
      syncScrollButtons();
    };

    el.addEventListener('scroll', syncScrollButtons, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', syncScrollButtons);
    return () => {
      el.removeEventListener('scroll', syncScrollButtons);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', syncScrollButtons);
    };
  }, [expanded, status, items, syncScrollButtons]);

  const scrollByCards = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(280, el.clientWidth * 0.85), behavior: 'smooth' });
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0 || !scrollRef.current) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const delta = event.pageX - dragRef.current.startX;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) {
      dragRef.current.moved = true;
      event.preventDefault();
    }
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const endDrag = () => {
    dragRef.current.active = false;
  };

  const handleLinkClick = (event) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  };

  if (!eligible) return null;

  const panelBody = (
    <>
      {status === 'loading' ? (
        <p className="px-0.5 text-[11px] text-white/45">숙소를 불러오는 중…</p>
      ) : null}

      {status === 'empty' || status === 'error' ? (
        <p className="px-0.5 text-[11px] text-white/45 break-keep">
          이 여행지 숙소를 찾지 못했어요.
        </p>
      ) : null}

      {status === 'ready' && items?.length ? (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
            <p className="hidden lg:block text-[11px] font-medium text-white/45 break-keep">
              근처 숙소 · MyRealTrip
            </p>
            <div className="flex items-center justify-end gap-0.5 lg:hidden ml-auto">
              <button
                type="button"
                aria-label="이전 숙소"
                disabled={!canLeft}
                onClick={() => scrollByCards(-1)}
                className={`rounded-full p-0.5 border transition-colors ${
                  canLeft
                    ? 'border-white/20 text-white/80 hover:bg-white/10'
                    : 'border-white/5 text-white/20 cursor-default'
                }`}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label="다음 숙소"
                disabled={!canRight}
                onClick={() => scrollByCards(1)}
                className={`rounded-full p-0.5 border transition-colors ${
                  canRight
                    ? 'border-white/20 text-white/80 hover:bg-white/10'
                    : 'border-white/5 text-white/20 cursor-default'
                }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            className="globe-stay-strip-scroll flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-1 snap-x cursor-grab active:cursor-grabbing select-none lg:grid lg:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] lg:gap-2.5 lg:overflow-x-visible lg:overflow-y-visible lg:snap-none lg:cursor-default lg:active:cursor-default"
          >
            <style>{`
              .globe-stay-strip-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgba(251, 191, 36, 0.45) rgba(255, 255, 255, 0.08);
              }
              .globe-stay-strip-scroll::-webkit-scrollbar {
                height: 6px;
              }
              @media (min-width: 1024px) {
                .globe-stay-strip-scroll::-webkit-scrollbar {
                  width: 6px;
                  height: auto;
                }
              }
              .globe-stay-strip-scroll::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.06);
                border-radius: 9999px;
              }
              .globe-stay-strip-scroll::-webkit-scrollbar-thumb {
                background: rgba(251, 191, 36, 0.45);
                border-radius: 9999px;
              }
            `}</style>
            {items.map((item) => {
              const price = formatPrice(item.salePrice);
              return (
                <a
                  key={item.itemId}
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  draggable={false}
                  onClick={handleLinkClick}
                  className="snap-start shrink-0 w-[132px] lg:w-auto lg:min-w-0 lg:snap-none rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden hover:border-amber-300/35 hover:bg-white/[0.1] transition-colors"
                >
                  <div className="relative h-[72px] lg:h-[96px] w-full bg-white/5 pointer-events-none">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/30">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-0.5 pointer-events-none">
                    <p className="text-[11px] font-semibold leading-snug text-white line-clamp-2 break-keep">
                      {item.itemName}
                    </p>
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      {item.reviewScore ? (
                        <span className="text-[10px] text-amber-100/80 tabular-nums">
                          ★ {item.reviewScore}
                        </span>
                      ) : (
                        <span />
                      )}
                      {price ? (
                        <span className="truncate text-[10px] font-bold text-white/90 tabular-nums">
                          {price}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <div
      className="mt-2 w-full min-w-0 lg:mt-2"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="globe-stay-strip-panel"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded-xl border px-2 py-2 transition-all duration-300 ${
          expanded
            ? 'bg-amber-500/20 border-amber-300/45 hover:bg-amber-500/25'
            : 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-300/40'
        }`}
      >
        <BedDouble size={15} className="text-amber-200 shrink-0" />
        <span className="text-xs font-bold text-amber-50">숙소</span>
        <span className="text-[10px] font-medium text-amber-100/55">MyRealTrip</span>
        {status === 'loading' && expanded ? (
          <Loader2 size={14} className="ml-0.5 animate-spin text-amber-200/80" />
        ) : expanded ? (
          <>
            <ChevronUp size={14} className="ml-0.5 text-amber-100/70 lg:hidden" />
            <ChevronLeft size={14} className="ml-0.5 text-amber-100/70 hidden lg:block" />
          </>
        ) : (
          <ChevronDown size={14} className="ml-0.5 text-amber-100/70" />
        )}
      </button>

      {/* 모바일: Summary 아래. PC: body 포털 — Summary transform이 fixed 포함 블록이 되어 폭이 0이 되던 문제 방지 */}
      {expanded && !isLg ? (
        <div id="globe-stay-strip-panel" className="mt-2 min-w-0">
          {panelBody}
        </div>
      ) : null}

      {expanded && isLg && typeof document !== 'undefined'
        ? createPortal(
            <div
              id="globe-stay-strip-panel"
              role="region"
              aria-label="숙소 목록"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed z-[61] left-4 top-[5.25rem] bottom-6 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] overflow-y-auto rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl p-3"
            >
              {panelBody}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
