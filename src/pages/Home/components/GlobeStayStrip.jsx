import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp,
  ArrowUpDown,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  LayoutGrid,
  Loader2,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import {
  buildMrtStayListUrl,
  canShowMrtStayStrip,
  defaultMrtStayDates,
  fetchMrtStaysForLocation,
  isMrtDomesticLocation,
  mrtStayNights,
  normalizeMrtGuestCounts,
  normalizeMrtStayDates,
} from '../../../utils/fetchMrtStays';
import {
  MRT_STAY_LOW_COUNT,
  TRIPCOM_HOTEL_TRACKING,
  buildMrtMylinkUrl,
  buildTripcomHotelSearchUrl,
  getTripcomHotelEmptyCopy,
} from '../../../utils/affiliate';
import {
  STAY_AGENCY_DISCLAIMER,
  getStayAgencyKindLabel,
  resolveStayAgencyProfile,
  withStayAgencyReferral,
} from '../../../utils/stayAgencyLinks';
import {
  getPartnerLinkTarget,
  getTripcomLinkRel,
} from '../../../components/PlaceCard/common/partnerNavigation';
import { getAddressFromCoordinates } from '../lib/geocoding';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';
import {
  MRT_HOME_MYLINK_ID,
  MRT_PACKAGE_SHORT_URLS,
} from '../data/mrtPackageThemeLinks';
import {
  GuestStepper,
  StayRangeCalendar,
  formatStayDateLabel,
} from './stayDateControls';

const LG_MQ = '(min-width: 1024px)';
/** 목록 URL을 못 만들 때만 — 마이리얼트립 제휴 홈 */
const MRT_AFFILIATE_HOME_URL = MRT_PACKAGE_SHORT_URLS.home;

const STAY_SORT_OPTIONS = [
  { id: 'recommended', label: '추천순' },
  { id: 'price_asc', label: '낮은 가격순' },
  { id: 'price_desc', label: '높은 가격순' },
  { id: 'rating_desc', label: '평점 높은순' },
];

/** 모바일 목록 열 수 — 기본 2열, 1열은 확대 */
const MOBILE_GRID_IMAGE = {
  2: 'h-[100px]',
  1: 'h-[180px]',
};
/** PC 목록 — 기본 5열, 확대는 3열 */
const DESKTOP_GRID_DENSITY = {
  default: { cols: 5, imageClassName: 'h-[120px]' },
  zoom: { cols: 3, imageClassName: 'h-[168px]' },
};

function reviewScoreNum(item) {
  const n = Number(item?.reviewScore);
  return Number.isFinite(n) ? n : -1;
}

function salePriceNum(item) {
  const n = Number(item?.salePrice);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 이미 받은 목록만 재정렬 — API 재호출 없음 · 요금 없는 건은 가격 정렬 시 뒤로 */
function sortStayGroup(list, sortMode) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (sortMode === 'price_asc') {
    return arr.sort((a, b) => {
      const ap = salePriceNum(a);
      const bp = salePriceNum(b);
      if (ap == null && bp == null) return 0;
      if (ap == null) return 1;
      if (bp == null) return -1;
      return ap - bp;
    });
  }
  if (sortMode === 'price_desc') {
    return arr.sort((a, b) => {
      const ap = salePriceNum(a);
      const bp = salePriceNum(b);
      if (ap == null && bp == null) return 0;
      if (ap == null) return 1;
      if (bp == null) return -1;
      return bp - ap;
    });
  }
  if (sortMode === 'rating_desc') {
    return arr.sort((a, b) => reviewScoreNum(b) - reviewScoreNum(a));
  }
  return arr;
}

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

/**
 * 일정: 달력 「변경하기」→ 즉시 조회.
 * 인원: 헤더 「변경하기」→ 인원만 바뀌었을 때 활성·조회.
 */
function StayDateBar({
  placeName = '',
  checkIn,
  checkOut,
  todayYmd,
  adultCount,
  childCount,
  onApply,
  showClose = false,
  onClose,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [draftAdult, setDraftAdult] = useState(adultCount);
  const [draftChild, setDraftChild] = useState(childCount);

  useEffect(() => {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
    setDraftAdult(adultCount);
    setDraftChild(childCount);
  }, [checkIn, checkOut, adultCount, childCount]);

  const draftNights = mrtStayNights(draftIn, draftOut);
  /** 헤더 버튼 — 인원만 (일정은 달력에서 즉시 적용) */
  const guestsDirty =
    draftAdult !== adultCount || draftChild !== childCount;
  const title = String(placeName || '').trim();

  const closeCalendar = useCallback(() => setOpen(false), []);

  const handleCalendarPick = useCallback(
    (nextIn, nextOut) => {
      setDraftIn(nextIn);
      setDraftOut(nextOut);
      setOpen(false);
      onApply?.({
        checkIn: nextIn,
        checkOut: nextOut,
        adultCount: draftAdult,
        childCount: draftChild,
      });
    },
    [onApply, draftAdult, draftChild],
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
      {(title || showClose) ? (
        <div className="mb-1.5 flex min-w-0 items-center gap-1.5">
          {title ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5 px-0.5">
              <MapPin
                size={14}
                className="shrink-0 text-amber-200/85"
                aria-hidden="true"
              />
              <p className="min-w-0 truncate text-left text-[13px] font-bold text-amber-50">
                {title}
              </p>
            </div>
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {showClose ? (
            <button
              type="button"
              aria-label="숙소 목록 닫기"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/50 active:scale-95 transition-all"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="체크인·체크아웃 날짜 선택"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex min-h-[40px] w-full min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors ${
          open
            ? 'border-amber-300/60 bg-black/55'
            : 'border-amber-300/40 bg-black/40 hover:border-amber-300/55 hover:bg-black/55'
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
            {formatStayDateLabel(draftIn)}
          </span>
        </span>
        <span
          className="shrink-0 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-xs font-bold tabular-nums text-amber-100"
          aria-label={draftNights > 0 ? `${draftNights}박` : '일정'}
        >
          {draftNights > 0 ? `${draftNights}박` : '·'}
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <span className="shrink-0 text-[11px] font-semibold text-amber-100/80">체크아웃</span>
          <span className="truncate text-sm font-bold tabular-nums text-amber-50">
            {formatStayDateLabel(draftOut)}
          </span>
        </span>
      </button>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-1.5">
        <Users size={12} className="shrink-0 text-amber-200/75" aria-hidden="true" />
        <GuestStepper
          label="성인"
          value={draftAdult}
          min={1}
          max={8}
          onChange={setDraftAdult}
        />
        <GuestStepper
          label="아동"
          value={draftChild}
          min={0}
          max={8}
          onChange={setDraftChild}
        />
        <button
          type="button"
          disabled={!guestsDirty}
          onClick={(e) => {
            e.stopPropagation();
            if (!guestsDirty) return;
            onApply?.({
              checkIn: draftIn,
              checkOut: draftOut,
              adultCount: draftAdult,
              childCount: draftChild,
            });
          }}
          className={`ml-auto shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold transition-all active:scale-95 ${
            guestsDirty
              ? 'border-amber-300/55 bg-amber-400 text-black hover:bg-amber-300'
              : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
          }`}
        >
          변경하기
        </button>
      </div>
      {open ? (
        <div className="flex justify-start">
          <StayRangeCalendar
            key={`${checkIn}|${checkOut}|open`}
            checkIn={checkIn}
            checkOut={checkOut}
            todayYmd={todayYmd}
            onPick={handleCalendarPick}
            onCancel={closeCalendar}
          />
        </div>
      ) : null}
    </div>
  );
}

function StayCard({
  item,
  price,
  className = '',
  imageClassName = 'h-[72px] lg:h-[96px]',
  /** PC 확장 목록용 — 이미지·타이포 한 단계 확대 */
  size = 'md',
}) {
  const large = size === 'lg';
  const productHref = item.productUrl
    ? buildMrtMylinkUrl(item.productUrl)
    : MRT_AFFILIATE_HOME_URL;

  return (
    <a
      href={productHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      draggable={false}
      className={`rounded-2xl border border-amber-400/30 bg-amber-500/10 overflow-hidden transition-colors hover:border-amber-300/45 hover:bg-amber-500/20 ${className}`}
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
          <div
            className={`flex h-full w-full items-center justify-center text-white/30 ${
              large ? 'text-xs' : 'text-[10px]'
            }`}
          >
            No image
          </div>
        )}
      </div>
      <div className={`pointer-events-none ${large ? 'space-y-1 p-2.5' : 'space-y-0.5 p-2'}`}>
        <p
          className={`line-clamp-2 break-keep font-semibold leading-snug text-white ${
            large ? 'text-[13px]' : 'text-[11px]'
          }`}
        >
          {item.itemName}
        </p>
        <div className="flex min-w-0 items-center justify-between gap-1">
          {item.reviewScore ? (
            <span
              className={`tabular-nums text-amber-100/80 ${large ? 'text-xs' : 'text-[10px]'}`}
            >
              ★ {item.reviewScore}
            </span>
          ) : (
            <span />
          )}
          {price ? (
            <span
              className={`truncate font-bold tabular-nums text-white/90 ${
                large ? 'text-xs' : 'text-[10px]'
              }`}
            >
              {price}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function StayGridDensityToggle({ variant, value, onChange }) {
  const isZoomed =
    variant === 'desktop' ? value === 'zoom' : value === 1;
  const nextValue =
    variant === 'desktop'
      ? isZoomed
        ? 'default'
        : 'zoom'
      : isZoomed
        ? 2
        : 1;
  const label = isZoomed ? '기본 그리드로' : '확대해서 보기';

  return (
    <button
      type="button"
      aria-pressed={isZoomed}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(nextValue);
      }}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
        isZoomed
          ? 'border-amber-300/50 bg-amber-500/30 text-amber-50'
          : 'border-white/12 bg-black/40 text-amber-100/70 hover:border-amber-300/35 hover:bg-white/5 hover:text-amber-50'
      }`}
    >
      <LayoutGrid size={14} strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}

function StayListToolbar({
  count,
  sortMode,
  onSortChange,
  listUrl,
  densityVariant = 'mobile',
  densityValue,
  onDensityChange,
}) {
  const href = listUrl || MRT_AFFILIATE_HOME_URL;
  return (
    <div className="mb-1.5 flex min-w-0 flex-wrap items-center justify-between gap-1.5 px-0.5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {count ? (
          <p className="shrink-0 text-xs font-semibold tabular-nums text-amber-100/75">
            {count}곳
          </p>
        ) : null}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center rounded-md border border-amber-300/45 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-50 hover:bg-amber-500/30 hover:border-amber-300/60 active:scale-[0.98] transition-all"
        >
          마이리얼트립에서 보기
        </a>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <StayGridDensityToggle
          variant={densityVariant}
          value={densityValue}
          onChange={onDensityChange}
        />
        <label className="relative flex shrink-0 items-center">
          <span className="sr-only">숙소 정렬</span>
          <ArrowUpDown
            size={11}
            className="pointer-events-none absolute left-1.5 text-amber-200/70"
            aria-hidden="true"
          />
          <select
            value={sortMode}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onSortChange?.(e.target.value);
            }}
            className="appearance-none rounded-md border border-white/12 bg-black/40 py-1 pl-5 pr-5 text-[10px] font-semibold text-amber-50 outline-none hover:border-amber-300/35 focus:border-amber-300/50"
          >
            {STAY_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/** 공신력 있는 관광청·여행사 안내 링크 — 신뢰(중립 화이트) · 큰 탭 영역 · Trip CTA와 구분 */
function StayAgencyGuideLinks({
  profile,
  linkTarget,
  linkRel,
  compact = false,
  className = '',
}) {
  if (!profile?.links?.length) return null;
  const titleClass = compact
    ? 'break-keep text-[11px] font-semibold tracking-wide text-slate-100/90'
    : 'break-keep text-[13px] font-semibold tracking-wide text-slate-100';
  const linkClass = compact
    ? 'group flex w-full min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-left text-slate-800 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100'
    : 'group flex w-full min-h-[48px] items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-left text-slate-800 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100';

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-stretch gap-2.5 lg:max-w-md ${className}`.trim()}
    >
      <p className={`${titleClass} text-center`}>공식·인가 안내</p>
      <div className="flex w-full flex-col gap-2">
        {profile.links.map((link) => {
          const kindLabel = getStayAgencyKindLabel(link.kind);
          return (
            <a
              key={`${link.kind}:${link.href}`}
              href={withStayAgencyReferral(link.href)}
              target={linkTarget}
              rel={linkRel}
              onClick={(e) => e.stopPropagation()}
              className={linkClass}
              aria-label={`${link.name}. ${kindLabel}`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate font-semibold leading-snug ${
                    compact ? 'text-[13px]' : 'text-[14px]'
                  }`}
                >
                  {link.name}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                  {kindLabel}
                </span>
              </span>
              <ExternalLink
                size={compact ? 14 : 16}
                className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600"
                aria-hidden
              />
            </a>
          );
        })}
      </div>
      <p className="break-keep text-center text-[10px] font-medium leading-relaxed text-white/50">
        {STAY_AGENCY_DISCLAIMER}
      </p>
    </div>
  );
}

/** 정보 희소 여행지 — MRT 목록이 있어도 공식 관광청을 하단에 상시 노출 */
function StayAgencyAlwaysFooter({
  profile,
  linkTarget,
  linkRel,
  compact = false,
}) {
  if (!profile?.alwaysShow || !profile?.links?.length) return null;
  return (
    <div className="mt-4 flex flex-col items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3 py-3.5 text-center">
      <p className="break-keep text-[11px] font-medium leading-relaxed text-white/70 lg:text-[12px]">
        이 지역은 온라인 정보가 적어요. 공식 관광 안내도 함께 확인해 보세요
      </p>
      <StayAgencyGuideLinks
        profile={profile}
        linkTarget={linkTarget}
        linkRel={linkRel}
        compact={compact}
      />
    </div>
  );
}

/** MRT 저재고(요금 있는 숙소 ≤5) — 목록 하단 공식 안내 + Trip.com */
function StayLowInventoryFooter({
  href,
  linkTarget,
  linkRel,
  ctaClassName,
  agencyProfile = null,
  /** API 목록 중 요금 없는 건이 더 있으면 일정 변경 안내 */
  moreWithDateChange = false,
}) {
  if (!href && !agencyProfile?.links?.length) return null;
  const hasAgency = Boolean(agencyProfile?.links?.length);
  return (
    <div
      className={`mt-4 flex flex-col items-center gap-3 rounded-xl px-3 py-4 text-center ${
        hasAgency
          ? 'border border-white/15 bg-white/5'
          : 'border border-sky-300/25 bg-sky-500/10'
      }`}
    >
      {/* 모바일: 문장 단위 2줄 · PC: 한 줄(폭 확대) */}
      <p className="w-full max-w-sm text-[12px] font-medium leading-relaxed text-white/75 lg:max-w-xl lg:whitespace-nowrap">
        {moreWithDateChange ? (
          <>
            <span className="block lg:inline">
              선택한 일정에 바로 예약 가능한 숙소만 보여요.
            </span>
            <span className="mt-0.5 block lg:mt-0 lg:inline">
              <span className="hidden lg:inline"> </span>
              일정을 바꾸면 더 많아질 수 있어요
            </span>
          </>
        ) : hasAgency ? (
          <>
            <span className="block lg:inline">이 지역은 마이리얼트립 재고가 적어요.</span>
            <span className="mt-0.5 block lg:mt-0 lg:inline">
              <span className="hidden lg:inline"> </span>
              공식·전문 안내와 트립닷컴을 함께 확인해 보세요
            </span>
          </>
        ) : (
          <>
            <span className="block lg:inline">이 지역은 마이리얼트립 재고가 적어요.</span>
            <span className="mt-0.5 block lg:mt-0 lg:inline">
              <span className="hidden lg:inline"> </span>
              트립닷컴도 함께 확인해 보세요
            </span>
          </>
        )}
      </p>
      {hasAgency ? (
        <StayAgencyGuideLinks
          profile={agencyProfile}
          linkTarget={linkTarget}
          linkRel={linkRel}
          compact
        />
      ) : null}
      {href ? (
        <div
          className={`flex w-full flex-col items-center gap-1.5 ${
            hasAgency ? 'max-w-sm lg:max-w-md' : ''
          }`}
        >
          {hasAgency ? (
            <p className="break-keep text-[10px] font-medium text-white/55">또는 숙소 OTA</p>
          ) : null}
          <a
            href={href}
            target={linkTarget}
            rel={linkRel}
            onClick={(e) => e.stopPropagation()}
            className={ctaClassName}
          >
            <span>트립닷컴에서 숙소 검색</span>
            {hasAgency ? (
              <ExternalLink size={13} className="shrink-0 opacity-80" aria-hidden />
            ) : null}
          </a>
        </div>
      ) : null}
    </div>
  );
}

function StayCardsGrid({
  items,
  sortMode = 'recommended',
  imageClassName,
  cardClassName = 'w-auto min-w-0',
  cardSize = 'md',
}) {
  /** fetch: 요금 우선 정렬 · 요금 없는 숙소도 포함 */
  const sorted = sortStayGroup(items || [], sortMode);

  return (
    <>
      {sorted.map((item) => (
        <StayCard
          key={item.itemId}
          item={item}
          price={formatPrice(item.salePrice)}
          className={cardClassName}
          imageClassName={imageClassName}
          size={cardSize}
        />
      ))}
    </>
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
  /** Edge 응답 region·usedKeyword — MRT 사이트 목록 딥링크용 */
  const [mrtListMeta, setMrtListMeta] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | empty | error
  const [stayDates, setStayDates] = useState(() => defaultMrtStayDates());
  const [guests, setGuests] = useState(() => normalizeMrtGuestCounts(2, 0));
  const [sortMode, setSortMode] = useState('recommended');
  /** 모바일 목록 열 — 2(기본) | 1 */
  const [mobileGridCols, setMobileGridCols] = useState(2);
  /** PC 목록 밀도 — default(5열) | zoom(3열 확대) */
  const [desktopGridDensity, setDesktopGridDensity] = useState('default');
  const [showMobileScrollTop, setShowMobileScrollTop] = useState(false);
  const [showDesktopScrollTop, setShowDesktopScrollTop] = useState(false);
  const fetchedKeyRef = useRef('');
  const mobileListScrollRef = useRef(null);
  const desktopListScrollRef = useRef(null);

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : '';
  const name = location?.name || '';
  const country = location?.country || '';
  const isScanning = Boolean(location?.isScanning);
  const placeKey = `${slug}|${name}|${country}|${location?.lat}|${location?.lng}`;
  const datesKey = `${stayDates.checkIn}|${stayDates.checkOut}`;
  const guestsKey = `a${guests.adultCount}c${guests.childCount}`;
  const fetchKey = `${placeKey}|${datesKey}|${guestsKey}`;
  const eligible = canShowMrtStayStrip(location, { hidden }) && !isScanning;
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
    setMrtListMeta(null);
    setStatus('idle');
    setStayDates(defaultMrtStayDates());
    setGuests(normalizeMrtGuestCounts(2, 0));
    setSortMode('recommended');
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

  const desktopOpen = Boolean(expanded && isLg);

  useEffect(() => {
    if (!desktopOpen) {
      setShowDesktopScrollTop(false);
      return undefined;
    }
    const el = desktopListScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => setShowDesktopScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [desktopOpen, status, items]);

  useEffect(() => {
    if (!eligible || !expanded) return undefined;
    if (fetchedKeyRef.current === fetchKey) return undefined;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const locForFetch = await withStayAdmin(location);
      if (cancelled) return;
      const result = await fetchMrtStaysForLocation(locForFetch, {
        ...stayDates,
        ...guests,
      });
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
        setMrtListMeta({
          regionId: result.region?.regionId ?? null,
          keyword: result.usedKeyword || name || '',
          isDomestic: isMrtDomesticLocation(locForFetch),
          moreWithDateChange: Boolean(result.moreWithDateChange),
          listedCount: Number(result.listedCount) || result.items.length,
          bookableCount:
            Number(result.bookableCount) >= 0
              ? Number(result.bookableCount)
              : result.items.length,
        });
        setStatus('ready');
      } else {
        setItems(null);
        setMrtListMeta(null);
        setStatus(result == null ? 'error' : 'empty');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, expanded, fetchKey, location, stayDates, guests]);

  const applyStayFilters = useCallback((next) => {
    const dates = normalizeMrtStayDates(next?.checkIn, next?.checkOut);
    const nextGuests = normalizeMrtGuestCounts(next?.adultCount, next?.childCount);
    setStayDates((prev) => {
      if (prev.checkIn === dates.checkIn && prev.checkOut === dates.checkOut) return prev;
      return dates;
    });
    setGuests((prev) => {
      if (
        prev.adultCount === nextGuests.adultCount &&
        prev.childCount === nextGuests.childCount
      ) {
        return prev;
      }
      return nextGuests;
    });
    fetchedKeyRef.current = '';
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
      placeName={name}
      checkIn={stayDates.checkIn}
      checkOut={stayDates.checkOut}
      todayYmd={todayYmd}
      adultCount={guests.adultCount}
      childCount={guests.childCount}
      onApply={applyStayFilters}
      showClose={Boolean(opts.showClose)}
      onClose={() => setExpanded(false)}
    />
  );

  const tripcomStayOptions = {
    checkIn: stayDates.checkIn,
    checkOut: stayDates.checkOut,
    adultCount: guests.adultCount,
    childCount: guests.childCount,
  };

  const tripcomEmptyUrl = buildTripcomHotelSearchUrl(location, {
    ...tripcomStayOptions,
    mode: 'list',
    campaign: TRIPCOM_HOTEL_TRACKING.emptyResult,
  });
  const tripcomLinkTarget = getPartnerLinkTarget();
  const tripcomLinkRel = getTripcomLinkRel(tripcomLinkTarget);

  /** 예약 가능(요금有) ≤5이면 하단 Trip CTA · 목록은 요금無 유지 · moreWithDateChange 카피 */
  const bookableCountForCta =
    Number(mrtListMeta?.bookableCount) >= 0
      ? Number(mrtListMeta.bookableCount)
      : (Array.isArray(items) ? items.filter((it) => Number(it?.salePrice) > 0).length : 0);
  const showLowInventoryCta =
    status === 'ready' &&
    Array.isArray(items) &&
    items.length > 0 &&
    bookableCountForCta <= MRT_STAY_LOW_COUNT;

  const tripcomLowUrl = showLowInventoryCta
    ? buildTripcomHotelSearchUrl(location, {
        ...tripcomStayOptions,
        mode: 'list',
        campaign: TRIPCOM_HOTEL_TRACKING.lowInventory,
      })
    : null;

  /** gateo.kr 배포 empty CTA — outline sky */
  const tripcomCtaDesktopClassName =
    'inline-flex items-center justify-center rounded-xl border border-sky-300/40 bg-sky-500/20 px-4 py-2.5 text-sm font-semibold text-sky-50 transition-colors hover:bg-sky-500/30';
  const tripcomCtaMobileClassName =
    'inline-flex items-center justify-center rounded-xl border border-sky-300/40 bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-50 transition-colors hover:bg-sky-500/30';
  /** 공식 안내와 나란히 둘 때 — 보조이되 폭·대비를 맞춤 */
  const tripcomCtaBesideAgencyDesktopClassName =
    'inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-sky-200/70 bg-sky-500/40 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-500/55';
  const tripcomCtaBesideAgencyMobileClassName =
    'inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-sky-200/70 bg-sky-500/40 px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-500/55';

  const { title: emptyTitleBase, subtitle: emptySubtitleBase, cta: emptyCtaLabel } =
    getTripcomHotelEmptyCopy(location);
  const stayAgencyProfile = resolveStayAgencyProfile(location);
  const hasStayAgencyLinks = Boolean(stayAgencyProfile?.links?.length);
  /** 저재고 footer에 이미 포함되면 중복 방지 · 그 외 ready 목록에서만 상시 노출 */
  const showAgencyAlwaysFooter =
    Boolean(stayAgencyProfile?.alwaysShow) &&
    status === 'ready' &&
    Array.isArray(items) &&
    items.length > 0 &&
    !showLowInventoryCta;
  const emptyTitle = emptyTitleBase;
  const emptySubtitle = hasStayAgencyLinks
    ? stayAgencyProfile.note ||
      '아래 공신력 있는 안내·여행사로 루트를 확인해 보세요'
    : emptySubtitleBase;
  const agencyLinkTarget = getPartnerLinkTarget();
  const agencyLinkRel = 'noopener noreferrer';
  const tripcomEmptyCtaDesktopClass = hasStayAgencyLinks
    ? tripcomCtaBesideAgencyDesktopClassName
    : tripcomCtaDesktopClassName;
  const tripcomEmptyCtaMobileClass = hasStayAgencyLinks
    ? tripcomCtaBesideAgencyMobileClassName
    : tripcomCtaMobileClassName;
  const tripcomLowCtaDesktopClass = hasStayAgencyLinks
    ? tripcomCtaBesideAgencyDesktopClassName
    : tripcomCtaDesktopClassName;
  const tripcomLowCtaMobileClass = hasStayAgencyLinks
    ? tripcomCtaBesideAgencyMobileClassName
    : tripcomCtaMobileClassName;

  const emptyState = (
    <div className="flex min-h-[min(420px,calc(100%-5rem))] w-full flex-col items-center justify-center gap-5 px-4 py-8">
      <div className="max-w-md space-y-2 text-center">
        <p className="break-keep text-[15px] font-bold leading-snug text-white/90">{emptyTitle}</p>
        <p className="break-keep text-[13px] font-medium leading-relaxed text-white/70">
          {emptySubtitle}
        </p>
      </div>
      {hasStayAgencyLinks ? (
        <StayAgencyGuideLinks
          profile={stayAgencyProfile}
          linkTarget={agencyLinkTarget}
          linkRel={agencyLinkRel}
        />
      ) : null}
      <div
        className={`flex w-full flex-col items-center gap-1.5 ${
          hasStayAgencyLinks ? 'max-w-sm' : ''
        }`}
      >
        {hasStayAgencyLinks ? (
          <p className="break-keep text-[11px] font-medium text-white/55">또는 숙소 OTA</p>
        ) : null}
        <a
          href={tripcomEmptyUrl}
          target={tripcomLinkTarget}
          rel={tripcomLinkRel}
          onClick={(e) => e.stopPropagation()}
          className={tripcomEmptyCtaDesktopClass}
        >
          <span>{emptyCtaLabel}</span>
          {hasStayAgencyLinks ? (
            <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden />
          ) : null}
        </a>
      </div>
    </div>
  );

  /** 모바일도 배너/iframe 없이 문구 + CTA만 (PC emptyState와 동일 구조) */
  const emptyStateMobile = (
    <div className="flex min-h-[min(52vh,420px)] w-full flex-col items-center justify-center gap-4 px-3 py-10">
      <div className="max-w-sm space-y-1.5 text-center">
        <p className="break-keep text-[14px] font-bold leading-snug text-white/90">{emptyTitle}</p>
        <p className="break-keep text-[12px] font-medium leading-relaxed text-white/70">
          {emptySubtitle}
        </p>
      </div>
      {hasStayAgencyLinks ? (
        <StayAgencyGuideLinks
          profile={stayAgencyProfile}
          linkTarget={agencyLinkTarget}
          linkRel={agencyLinkRel}
          compact
        />
      ) : null}
      <div
        className={`flex w-full flex-col items-center gap-1.5 ${
          hasStayAgencyLinks ? 'max-w-sm' : ''
        }`}
      >
        {hasStayAgencyLinks ? (
          <p className="break-keep text-[10px] font-medium text-white/55">또는 숙소 OTA</p>
        ) : null}
        <a
          href={tripcomEmptyUrl}
          target={tripcomLinkTarget}
          rel={tripcomLinkRel}
          onClick={(e) => e.stopPropagation()}
          className={tripcomEmptyCtaMobileClass}
        >
          <span>{emptyCtaLabel}</span>
          {hasStayAgencyLinks ? (
            <ExternalLink size={13} className="shrink-0 opacity-80" aria-hidden />
          ) : null}
        </a>
      </div>
    </div>
  );

  const mrtStayListUrl =
    status === 'ready' && mrtListMeta
      ? buildMrtStayListUrl({
          keyword: mrtListMeta.keyword,
          regionId: mrtListMeta.regionId,
          isDomestic: mrtListMeta.isDomestic,
          checkIn: stayDates.checkIn,
          checkOut: stayDates.checkOut,
          adultCount: guests.adultCount,
          childCount: guests.childCount,
          mylinkId: MRT_HOME_MYLINK_ID,
        })
      : null;

  /** PC 포털 전용 그리드 — 모바일은 전체화면만 사용 */
  const desktopDensity =
    DESKTOP_GRID_DENSITY[desktopGridDensity] || DESKTOP_GRID_DENSITY.default;
  const desktopList =
    isLg && status === 'ready' && items?.length ? (
      <>
        <StayListToolbar
          count={items.length}
          sortMode={sortMode}
          onSortChange={setSortMode}
          listUrl={mrtStayListUrl}
          densityVariant="desktop"
          densityValue={desktopGridDensity}
          onDensityChange={setDesktopGridDensity}
        />
        <div
          className={`grid gap-3 ${
            desktopDensity.cols === 3 ? 'grid-cols-3' : 'grid-cols-5'
          }`}
        >
          <StayCardsGrid
            items={items}
            sortMode={sortMode}
            cardSize="lg"
            imageClassName={desktopDensity.imageClassName}
          />
        </div>
        {showLowInventoryCta ? (
          <StayLowInventoryFooter
            href={tripcomLowUrl}
            linkTarget={tripcomLinkTarget}
            linkRel={tripcomLinkRel}
            ctaClassName={tripcomLowCtaDesktopClass}
            agencyProfile={stayAgencyProfile}
            moreWithDateChange={Boolean(mrtListMeta?.moreWithDateChange)}
          />
        ) : null}
        {showAgencyAlwaysFooter ? (
          <StayAgencyAlwaysFooter
            profile={stayAgencyProfile}
            linkTarget={agencyLinkTarget}
            linkRel={agencyLinkRel}
          />
        ) : null}
      </>
    ) : null;

  const desktopPanelBody = (
    <div
      ref={desktopListScrollRef}
      className="globe-stay-strip-scroll min-h-0 flex-1 overflow-y-auto"
    >
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
      <div className="mb-3">{renderDateBar({ showClose: true })}</div>
      {status === 'loading' ? (
        <div
          className="flex min-h-[min(360px,calc(100%-5rem))] flex-col items-center justify-center gap-3 px-4 py-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 size={28} className="animate-spin text-amber-200/90" aria-hidden="true" />
          <p className="text-sm font-medium text-white/70">숙소를 불러오는 중…</p>
          <p className="text-xs text-white/40">잠시만 기다려 주세요</p>
        </div>
      ) : null}
      {status === 'empty' || status === 'error' ? emptyState : null}
      {desktopList}
    </div>
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
    desktopOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-stay-strip-panel"
            role="region"
            aria-label="숙소 목록"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[61] left-4 top-[5.25rem] bottom-6 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-xl"
          >
            {desktopPanelBody}
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                desktopListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`absolute bottom-4 right-4 z-10 flex h-10 items-center gap-1 rounded-full border border-amber-300/50 bg-amber-500 px-3 text-black shadow-[0_4px_20px_rgba(245,158,11,0.45)] transition-all duration-300 hover:bg-amber-400 active:scale-95 ${
                showDesktopScrollTop
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <ArrowUp size={16} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold">맨 위</span>
            </button>
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
            <div className="shrink-0 border-b border-white/10 px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-amber-50">
                    {name ? `${name} 근처 숙소` : '근처 숙소'}
                  </p>
                  {status === 'loading' ? (
                    <p className="truncate text-xs font-semibold text-amber-100/75">
                      불러오는 중…
                    </p>
                  ) : null}
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
            </div>
            <div
              ref={mobileListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="mb-3">{renderDateBar()}</div>
              {status === 'loading' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-white/50">
                  <Loader2 size={22} className="animate-spin text-amber-200/80" />
                  <p className="text-[12px]">숙소를 불러오는 중…</p>
                </div>
              ) : null}
              {status === 'empty' || status === 'error' ? emptyStateMobile : null}
              {status === 'ready' && items?.length ? (
                <>
                  <StayListToolbar
                    count={items.length}
                    sortMode={sortMode}
                    onSortChange={setSortMode}
                    listUrl={mrtStayListUrl}
                    densityVariant="mobile"
                    densityValue={mobileGridCols}
                    onDensityChange={setMobileGridCols}
                  />
                  <div
                    className={`grid gap-2.5 ${
                      mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    <StayCardsGrid
                      items={items}
                      sortMode={sortMode}
                      cardClassName="w-full"
                      cardSize={mobileGridCols === 1 ? 'lg' : 'md'}
                      imageClassName={
                        MOBILE_GRID_IMAGE[mobileGridCols] || MOBILE_GRID_IMAGE[2]
                      }
                    />
                  </div>
                  {showLowInventoryCta ? (
                    <StayLowInventoryFooter
                      href={tripcomLowUrl}
                      linkTarget={tripcomLinkTarget}
                      linkRel={tripcomLinkRel}
                      ctaClassName={tripcomLowCtaMobileClass}
                      agencyProfile={stayAgencyProfile}
                      moreWithDateChange={Boolean(mrtListMeta?.moreWithDateChange)}
                    />
                  ) : null}
                  {showAgencyAlwaysFooter ? (
                    <StayAgencyAlwaysFooter
                      profile={stayAgencyProfile}
                      linkTarget={agencyLinkTarget}
                      linkRel={agencyLinkRel}
                      compact
                    />
                  ) : null}
                </>
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
