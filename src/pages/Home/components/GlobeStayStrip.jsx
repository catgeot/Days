import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import {
  canShowMrtStayStrip,
  defaultMrtStayDates,
  fetchMrtStaysForLocation,
  mrtStayNights,
  normalizeMrtStayDates,
} from '../../../utils/fetchMrtStays';
import { getAddressFromCoordinates } from '../lib/geocoding';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';

const LG_MQ = '(min-width: 1024px)';
/** fetchMrtStays.normalizeMrtStayDates와 동일 상한 */
const MAX_STAY_NIGHTS = 30;
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

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

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd, days) {
  const d = parseYmd(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/** YYYY-MM-DD → 2026.7.20 */
function formatStayDateLabel(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return ymd || '날짜 선택';
  return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
}

function monthTitle(viewMonth) {
  return `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
}

function buildMonthCells(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toYmd(new Date(year, month, day, 12, 0, 0, 0)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * 한 달력에서 체크인→체크아웃 기간 선택.
 * 1탭=체크인 · 2탭=체크아웃(자동 적용·닫기) · 최대 30박.
 */
function StayRangeCalendar({
  checkIn,
  checkOut,
  todayYmd,
  onApply,
  onCancel,
}) {
  const [viewMonth, setViewMonth] = useState(() => parseYmd(checkIn) || new Date());
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [pickingOut, setPickingOut] = useState(false);

  const maxOutYmd = draftIn ? addDaysYmd(draftIn, MAX_STAY_NIGHTS) : null;
  const cells = buildMonthCells(viewMonth);
  const hint = pickingOut
    ? '체크아웃 날짜를 선택하세요'
    : '체크인 날짜를 선택하세요';

  const shiftMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDayClick = (ymd) => {
    if (!ymd || ymd < todayYmd) return;
    if (!pickingOut || !draftIn) {
      setDraftIn(ymd);
      setDraftOut(null);
      setPickingOut(true);
      return;
    }
    if (ymd <= draftIn) {
      setDraftIn(ymd);
      setDraftOut(null);
      setPickingOut(true);
      return;
    }
    if (maxOutYmd && ymd > maxOutYmd) return;
    const next = normalizeMrtStayDates(draftIn, ymd);
    onApply?.(next.checkIn, next.checkOut);
  };

  const dayClass = (ymd) => {
    if (!ymd) return 'invisible pointer-events-none';
    const disabled =
      ymd < todayYmd || (pickingOut && draftIn && maxOutYmd && ymd > maxOutYmd && ymd !== draftIn);
    const isIn = ymd === draftIn;
    const isOut = Boolean(draftOut) && ymd === draftOut;
    const inRange =
      Boolean(draftIn && draftOut) && ymd > draftIn && ymd < draftOut;
    if (disabled && !isIn) {
      return 'text-white/20 cursor-not-allowed';
    }
    if (isIn || isOut) {
      return 'bg-amber-400 text-black font-bold shadow-sm';
    }
    if (inRange) {
      return 'bg-amber-400/25 text-amber-50 font-semibold';
    }
    if (ymd === todayYmd) {
      return 'text-amber-100 ring-1 ring-amber-300/50 font-semibold hover:bg-white/10';
    }
    return 'text-white/85 hover:bg-white/10';
  };

  return (
    <div
      role="dialog"
      aria-label="숙소 일정 선택"
      className="mt-2 rounded-xl border border-amber-400/30 bg-black/90 p-2.5 shadow-xl backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => shiftMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <p className="text-[13px] font-bold tabular-nums text-amber-50">{monthTitle(viewMonth)}</p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => shiftMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="mb-2 text-center text-[11px] text-amber-100/65">{hint}</p>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS_KO.map((d) => (
          <div
            key={d}
            className={`py-1 text-center text-[10px] font-medium ${
              d === '일' ? 'text-rose-300/70' : 'text-white/40'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((ymd, idx) => {
          const disabled =
            !ymd ||
            ymd < todayYmd ||
            (pickingOut && draftIn && maxOutYmd && ymd > maxOutYmd);
          return (
            <button
              key={ymd || `e-${idx}`}
              type="button"
              disabled={Boolean(disabled)}
              onClick={() => handleDayClick(ymd)}
              className={`flex h-9 items-center justify-center rounded-lg text-[12px] tabular-nums transition-colors ${dayClass(
                ymd
              )}`}
            >
              {ymd ? Number(ymd.slice(8, 10)) : ''}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <p className="min-w-0 truncate text-[11px] tabular-nums text-white/55">
          {formatStayDateLabel(draftIn || checkIn)}
          <span className="mx-1 text-white/25">→</span>
          {draftOut ? formatStayDateLabel(draftOut) : pickingOut ? '선택 중' : formatStayDateLabel(checkOut)}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

/** 상단 N박 · 하단 일정 한 줄 → 탭 시 단일 기간 달력 */
function StayDateBar({
  checkIn,
  checkOut,
  nights,
  todayYmd,
  onChange,
  showClose = false,
  onClose,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const closeCalendar = useCallback(() => setOpen(false), []);

  const handleApply = useCallback(
    (nextIn, nextOut) => {
      onChange?.(nextIn, nextOut);
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeCalendar();
    };
    const onPointer = (e) => {
      if (!rootRef.current || rootRef.current.contains(e.target)) return;
      closeCalendar();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open, closeCalendar]);

  return (
    <div
      ref={rootRef}
      className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-2.5 py-2"
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="체크인·체크아웃 날짜 선택"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={`flex min-h-[40px] min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors ${
            open
              ? 'border-amber-300/50 bg-black/55'
              : 'border-white/10 bg-black/40 hover:border-amber-300/45 hover:bg-black/55'
          }`}
        >
          <CalendarDays
            size={16}
            className="shrink-0 text-amber-200/90"
            aria-hidden="true"
          />
          <span className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <span className="shrink-0 text-[11px] font-semibold text-amber-100/80">체크인</span>
            <span className="truncate text-sm font-bold tabular-nums text-amber-50">
              {formatStayDateLabel(checkIn)}
            </span>
          </span>
          <span
            className="shrink-0 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-xs font-bold tabular-nums text-amber-100"
            aria-label={nights > 0 ? `${nights}박` : '일정'}
          >
            {nights > 0 ? `${nights}박` : '·'}
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <span className="shrink-0 text-[11px] font-semibold text-amber-100/80">체크아웃</span>
            <span className="truncate text-sm font-bold tabular-nums text-amber-50">
              {formatStayDateLabel(checkOut)}
            </span>
          </span>
        </button>
        {showClose ? (
          <button
            type="button"
            aria-label="숙소 목록 닫기"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/50 active:scale-95 transition-all"
          >
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {open ? (
        <StayRangeCalendar
          key={`${checkIn}|${checkOut}|open`}
          checkIn={checkIn}
          checkOut={checkOut}
          todayYmd={todayYmd}
          onApply={handleApply}
          onCancel={closeCalendar}
        />
      ) : null}
    </div>
  );
}

function StayCard({ item, price, className = '', imageClassName = 'h-[72px] lg:h-[96px]' }) {
  return (
    <a
      href={item.productUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      draggable={false}
      className={`rounded-2xl border border-amber-400/30 bg-amber-500/10 overflow-hidden hover:border-amber-300/45 hover:bg-amber-500/20 transition-colors ${className}`}
    >
      <div className={`relative w-full bg-white/5 pointer-events-none ${imageClassName}`}>
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
      <div className="space-y-0.5 p-2 pointer-events-none">
        <p className="line-clamp-2 break-keep text-[11px] font-semibold leading-snug text-white">
          {item.itemName}
        </p>
        <div className="flex min-w-0 items-center justify-between gap-1">
          {item.reviewScore ? (
            <span className="text-[10px] tabular-nums text-amber-100/80">★ {item.reviewScore}</span>
          ) : (
            <span />
          )}
          {price ? (
            <span className="truncate text-[10px] font-bold tabular-nums text-white/90">{price}</span>
          ) : null}
        </div>
      </div>
    </a>
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
 * children({ toggle, mobilePanel, expanded }) 로 카드 안 그리드에 토글 배치.
 * PC: body 포털 전폭 · 모바일: 버튼 → 전체화면 모달(일정·목록).
 */
export default function GlobeStayStrip({ location, hidden = false, children, onExpandedChange }) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [listFullscreen, setListFullscreen] = useState(false);
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty | error
  const [stayDates, setStayDates] = useState(() => defaultMrtStayDates());
  const [showMobileScrollTop, setShowMobileScrollTop] = useState(false);
  const fetchedKeyRef = useRef('');
  const mobileListScrollRef = useRef(null);

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
  const mobileOpen = !isLg && listFullscreen;

  useEffect(() => {
    setExpanded(false);
    setListFullscreen(false);
    setItems(null);
    setStatus('idle');
    setStayDates(defaultMrtStayDates());
    fetchedKeyRef.current = '';
  }, [placeKey]);

  useEffect(() => {
    if (!expanded) setListFullscreen(false);
  }, [expanded]);

  useEffect(() => {
    onExpandedChange?.(Boolean(eligible && expanded));
  }, [eligible, expanded, onExpandedChange]);

  useEffect(() => {
    return () => {
      onExpandedChange?.(false);
    };
  }, [onExpandedChange]);

  useEffect(() => {
    if (!listFullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [listFullscreen]);

  useEffect(() => {
    if (!mobileOpen) {
      setShowMobileScrollTop(false);
      return undefined;
    }
    const el = mobileListScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => setShowMobileScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [mobileOpen, status, items]);

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

  const openMobileFullscreen = useCallback(() => {
    setExpanded(true);
    setListFullscreen(true);
  }, []);

  const closeMobileFullscreen = useCallback(() => {
    setListFullscreen(false);
    setExpanded(false);
  }, []);

  if (!eligible) {
    if (typeof children === 'function') {
      return children({ toggle: null, mobilePanel: null, eligible: false, expanded: false });
    }
    return null;
  }

  const renderDateBar = (opts = {}) => (
    <StayDateBar
      checkIn={stayDates.checkIn}
      checkOut={stayDates.checkOut}
      nights={nights}
      todayYmd={todayYmd}
      onChange={applyStayDates}
      showClose={Boolean(opts.showClose)}
      onClose={() => setExpanded(false)}
    />
  );

  const statusLine =
    status === 'loading' ? (
      <p className="px-0.5 text-[11px] text-white/45">숙소를 불러오는 중…</p>
    ) : status === 'empty' || status === 'error' ? (
      <p className="break-keep px-0.5 text-[11px] text-white/45">이 여행지 숙소를 찾지 못했어요.</p>
    ) : null;

  /** PC 포털 전용 그리드 — 모바일은 전체화면만 사용 */
  const desktopList =
    isLg && status === 'ready' && items?.length ? (
      <>
        <div className="mb-1.5 px-0.5">
          <p className="break-keep text-xs font-semibold text-amber-100/75">
            근처 숙소 · MyRealTrip
            {items?.length ? ` · ${items.length}곳` : ''}
          </p>
        </div>
        <div className="globe-stay-strip-scroll grid grid-cols-[repeat(auto-fill,minmax(152px,1fr))] gap-2.5">
          <style>{`
            .globe-stay-strip-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(251, 191, 36, 0.45) rgba(255, 255, 255, 0.08);
            }
            .globe-stay-strip-scroll::-webkit-scrollbar {
              width: 6px;
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
              <StayCard
                key={item.itemId}
                item={item}
                price={price}
                className="w-auto min-w-0"
              />
            );
          })}
        </div>
      </>
    ) : null;

  const desktopPanelBody = (
    <>
      <div className="mb-2">{renderDateBar({ showClose: true })}</div>
      {statusLine}
      {desktopList}
    </>
  );

  const toggle = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="globe-stay-strip-panel"
      onClick={(e) => {
        e.stopPropagation();
        if (!isLg) {
          if (mobileOpen) closeMobileFullscreen();
          else openMobileFullscreen();
          return;
        }
        setExpanded((v) => !v);
      }}
      className={`relative z-10 flex min-h-[40px] w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl border px-2 py-2 transition-all duration-300 lg:min-h-[36px] ${
        expanded
          ? 'bg-amber-500/20 border-amber-300/45 hover:bg-amber-500/25'
          : 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20 hover:border-amber-300/40'
      }`}
    >
      {status === 'loading' && expanded ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-amber-200" />
      ) : (
        <BedDouble size={16} className="shrink-0 text-amber-200" />
      )}
      <span className="min-w-0 truncate text-xs font-bold text-amber-50">숙소 찾기</span>
      {expanded ? (
        <ChevronLeft size={14} className="hidden shrink-0 text-amber-100/70 lg:block" />
      ) : (
        <ChevronDown size={14} className="shrink-0 text-amber-100/70" />
      )}
    </button>
  );

  const mobilePanel = null;

  const desktopPortal =
    expanded && isLg && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-stay-strip-panel"
            role="region"
            aria-label="숙소 목록"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[61] left-4 top-[5.25rem] bottom-6 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] overflow-y-auto rounded-3xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-xl"
          >
            {desktopPanelBody}
          </div>,
          document.body
        )
      : null;

  const fullscreenPortal =
    mobileOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-stay-strip-panel"
            role="dialog"
            aria-modal="true"
            aria-label="숙소 전체 목록"
            className="fixed inset-0 z-[80] flex flex-col bg-black/95"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 space-y-2.5 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-amber-50">
                    {name ? `${name} 근처 숙소` : '근처 숙소'}
                  </p>
                  <p className="truncate text-xs font-semibold text-amber-100/75">
                    MyRealTrip
                    {status === 'ready' && items?.length ? ` · ${items.length}곳` : ''}
                    {status === 'loading' ? ' · 불러오는 중…' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="전체 목록 닫기"
                  onClick={closeMobileFullscreen}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  <X size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
              {renderDateBar()}
            </div>
            <div
              ref={mobileListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              {status === 'loading' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-white/50">
                  <Loader2 size={22} className="animate-spin text-amber-200/80" />
                  <p className="text-[12px]">숙소를 불러오는 중…</p>
                </div>
              ) : null}
              {status === 'empty' || status === 'error' ? (
                <p className="break-keep px-1 py-12 text-center text-[12px] text-white/45">
                  이 일정으로 숙소를 찾지 못했어요. 날짜를 바꿔 보세요.
                </p>
              ) : null}
              {status === 'ready' && items?.length ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {items.map((item) => {
                    const price = formatPrice(item.salePrice);
                    return (
                      <StayCard
                        key={item.itemId}
                        item={item}
                        price={price}
                        className="w-full"
                        imageClassName="h-[100px]"
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                mobileListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 z-10 flex h-11 items-center gap-1 rounded-full border border-amber-300/50 bg-amber-500 px-3.5 text-black shadow-[0_4px_20px_rgba(245,158,11,0.45)] transition-all duration-300 active:scale-95 ${
                showMobileScrollTop
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold">맨 위</span>
            </button>
          </div>,
          document.body
        )
      : null;

  if (typeof children === 'function') {
    return (
      <>
        {/* 카드 안 확장 UI 없음 — stayExpanded는 PC 포털만 해당, 레이아웃 팽창 불필요 */}
        {children({ toggle, mobilePanel, eligible: true, expanded: false })}
        {desktopPortal}
        {fullscreenPortal}
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
      {desktopPortal}
      {fullscreenPortal}
    </div>
  );
}
