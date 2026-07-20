import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';
import {
  canShowMrtStayStrip,
  defaultMrtStayDates,
  fetchMrtStaysForLocation,
  mrtStayMinCheckOut,
  mrtStayNights,
  normalizeMrtStayDates,
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

/** YYYY-MM-DD → 2026.7.20 */
function formatStayDateLabel(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return ymd || '날짜 선택';
  return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
}

function openNativeDatePicker(input) {
  if (!input) return;
  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
  } catch {
    /* cross-origin / unsupported */
  }
  input.focus();
  input.click();
}

/** 표시는 버튼 · 클릭 시 네이티브 달력 (숫자 커서 편집 방지) */
function StayDateField({ label, value, min, onChange, ariaLabel }) {
  const inputRef = useRef(null);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[10px] font-medium text-amber-100/55">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => openNativeDatePicker(inputRef.current)}
          className="min-h-[32px] min-w-[5.75rem] rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-left text-[13px] font-semibold tabular-nums text-amber-50 hover:border-amber-300/45 hover:bg-black/55 transition-colors md:text-xs"
          aria-label={ariaLabel}
        >
          {formatStayDateLabel(value)}
        </button>
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-px w-px opacity-0"
        />
      </div>
    </div>
  );
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
 * Summary「숙소 찾기」토글 — 펼칠 때만 MRT 카드.
 * children({ toggle, mobilePanel }) 로 카드 안 그리드에 토글 배치.
 * PC: body 포털 전폭 · 모바일: mobilePanel(카드 아래).
 */
export default function GlobeStayStrip({ location, hidden = false, children, onExpandedChange }) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty | error
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [stayDates, setStayDates] = useState(() => defaultMrtStayDates());
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const fetchedKeyRef = useRef('');

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : '';
  const name = location?.name || '';
  const country = location?.country || '';
  const isScanning = Boolean(location?.isScanning);
  const placeKey = `${slug}|${name}|${country}|${location?.lat}|${location?.lng}`;
  const datesKey = `${stayDates.checkIn}|${stayDates.checkOut}`;
  const fetchKey = `${placeKey}|${datesKey}`;
  const eligible = canShowMrtStayStrip(location, { hidden }) && !isScanning;
  const nights = mrtStayNights(stayDates.checkIn, stayDates.checkOut);
  const todayYmd = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const minCheckOut = mrtStayMinCheckOut(stayDates.checkIn);

  useEffect(() => {
    setExpanded(false);
    setItems(null);
    setStatus('idle');
    setStayDates(defaultMrtStayDates());
    fetchedKeyRef.current = '';
  }, [placeKey]);

  useEffect(() => {
    onExpandedChange?.(Boolean(eligible && expanded));
  }, [eligible, expanded, onExpandedChange]);

  useEffect(() => {
    return () => {
      onExpandedChange?.(false);
    };
  }, [onExpandedChange]);

  useEffect(() => {
    if (!eligible || !expanded) return undefined;
    if (fetchedKeyRef.current === fetchKey) return undefined;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const locForFetch = await withStayAdmin(location);
      if (cancelled) return;
      const result = await fetchMrtStaysForLocation(locForFetch, stayDates);
      if (cancelled) return;
      fetchedKeyRef.current = fetchKey;
      if (result?.checkIn && result?.checkOut) {
        const synced = normalizeMrtStayDates(result.checkIn, result.checkOut);
        setStayDates((prev) =>
          prev.checkIn === synced.checkIn && prev.checkOut === synced.checkOut
            ? prev
            : synced
        );
      }
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
  }, [eligible, expanded, fetchKey, location, stayDates]);

  const applyStayDates = useCallback((nextIn, nextOut) => {
    const normalized = normalizeMrtStayDates(nextIn, nextOut);
    setStayDates((prev) => {
      if (prev.checkIn === normalized.checkIn && prev.checkOut === normalized.checkOut) {
        return prev;
      }
      fetchedKeyRef.current = '';
      return normalized;
    });
  }, []);

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

  if (!eligible) {
    if (typeof children === 'function') {
      return children({ toggle: null, mobilePanel: null, eligible: false });
    }
    return null;
  }

  const panelBody = (
    <>
      <div className="mb-2 flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-2.5 py-2">
          <CalendarDays size={14} className="shrink-0 text-amber-200/80" aria-hidden="true" />
          <StayDateField
            label="체크인"
            value={stayDates.checkIn}
            min={todayYmd}
            ariaLabel="체크인 날짜 선택"
            onChange={(next) => applyStayDates(next, stayDates.checkOut)}
          />
          <span className="shrink-0 text-white/25" aria-hidden="true">
            →
          </span>
          <StayDateField
            label="체크아웃"
            value={stayDates.checkOut}
            min={minCheckOut}
            ariaLabel="체크아웃 날짜 선택"
            onChange={(next) => applyStayDates(stayDates.checkIn, next)}
          />
          {nights > 0 ? (
            <span className="ml-1.5 shrink-0 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-100">
              {nights}박
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="숙소 목록 닫기"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg shadow-black/30 hover:bg-white/25 hover:border-white/50 active:scale-95 transition-all"
        >
          <X size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

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
                  className="snap-start shrink-0 w-[132px] lg:w-auto lg:min-w-0 lg:snap-none rounded-2xl border border-amber-400/30 bg-amber-500/10 overflow-hidden hover:border-amber-300/45 hover:bg-amber-500/20 transition-colors"
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

  const toggle = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="globe-stay-strip-panel"
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      className={`relative z-10 flex min-h-[40px] w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-2 py-2 transition-all duration-300 lg:min-h-[36px] ${
        expanded
          ? 'bg-amber-500/20 border-amber-300/45 hover:bg-amber-500/25'
          : 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-300/40'
      }`}
    >
      {status === 'loading' && expanded ? (
        <Loader2 size={16} className="animate-spin text-amber-200 shrink-0" />
      ) : (
        <BedDouble size={16} className="text-amber-200 shrink-0" />
      )}
      <span className="min-w-0 truncate text-xs font-bold text-amber-50">숙소 찾기</span>
      {expanded ? (
        <>
          <ChevronUp size={14} className="shrink-0 text-amber-100/70 lg:hidden" />
          <ChevronLeft size={14} className="shrink-0 text-amber-100/70 hidden lg:block" />
        </>
      ) : (
        <ChevronDown size={14} className="shrink-0 text-amber-100/70" />
      )}
    </button>
  );

  const mobilePanel =
    expanded && !isLg ? (
      <div
        id="globe-stay-strip-panel"
        className="mt-2 min-w-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {panelBody}
      </div>
    ) : null;

  const desktopPortal =
    expanded && isLg && typeof document !== 'undefined'
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
      : null;

  if (typeof children === 'function') {
    return (
      <>
        {children({ toggle, mobilePanel, eligible: true })}
        {desktopPortal}
      </>
    );
  }

  // 폴백: 카드 아래 풀폭 토글 (레거시)
  return (
    <div
      className="mt-2 w-full min-w-0 lg:mt-2"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {toggle}
      {mobilePanel}
      {desktopPortal}
    </div>
  );
}
