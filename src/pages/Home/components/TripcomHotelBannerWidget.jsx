import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, MapPin, Search, Users } from 'lucide-react';
import {
    TRIPCOM_HOTEL_AD,
    TRIPCOM_HOTEL_TRACKING,
    buildTripcomHotelSearchUrl,
    getTripcomHotelCityIdForLocation,
} from '../../../utils/affiliate';
import {
    mrtStayNights,
    normalizeMrtGuestCounts,
    normalizeMrtStayDates,
} from '../../../utils/fetchMrtStays';
import {
    getPartnerLinkTarget,
    getTripcomIframeReferrerPolicy,
    getTripcomLinkRel,
} from '../../../components/PlaceCard/common/partnerNavigation';
import { computeKlookBannerLayout } from '../../../components/PlaceCard/tabs/planner/components/klookBannerLayout';
import {
    GuestStepper,
    StayRangeCalendar,
    formatStayDateLabel,
} from './stayDateControls';

/** 이 폭 미만이면 세로형(모바일) 호텔 위젯 */
const TALL_BANNER_MAX_CONTAINER = 720;
const MIN_WIDE_DISPLAY_HEIGHT = 180;
const TALL_BANNER_MAX_SCALE = 1.35;
const TALL_BANNER_MAX_CLIP_H = 560;

/**
 * Trip.com 호텔 커스텀 검색바 (partners/ad iframe은 프리필 미지원).
 * 여행지·달력·인원 조절 후 `/hotels/list` 딥링크. 위젯은 직접 입력용 보조.
 */
export default function TripcomHotelBannerWidget({
    location,
    checkIn,
    checkOut,
    adultCount = 2,
    childCount = 0,
    todayYmd,
    onStayChange,
    campaign = TRIPCOM_HOTEL_TRACKING.emptyResult,
    className = '',
}) {
    const rootRef = useRef(null);
    const containerRef = useRef(null);
    const [showWidget, setShowWidget] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [layout, setLayout] = useState({
        scale: 1,
        clipH: MIN_WIDE_DISPLAY_HEIGHT,
        nativeW: TRIPCOM_HOTEL_AD.width,
        nativeH: TRIPCOM_HOTEL_AD.height,
        adId: TRIPCOM_HOTEL_AD.adId,
        isTall: false,
    });

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

    const linkTarget = getPartnerLinkTarget();
    const linkRel = getTripcomLinkRel(linkTarget);
    const iframeReferrerPolicy = getTripcomIframeReferrerPolicy();

    const cityName = String(
        location?.name || location?.name_ko || location?.name_en || '',
    ).trim();
    const cityNameEn = String(location?.name_en || '').trim();
    const cityId = useMemo(() => getTripcomHotelCityIdForLocation(location), [location]);

    const resolvedToday = useMemo(() => {
        if (todayYmd) return todayYmd;
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, [todayYmd]);

    const nights = mrtStayNights(draftIn, draftOut);
    const guests = normalizeMrtGuestCounts(draftAdult, draftChild);

    const pushStayChange = useCallback(
        (next) => {
            const dates = normalizeMrtStayDates(next.checkIn, next.checkOut);
            const nextGuests = normalizeMrtGuestCounts(next.adultCount, next.childCount);
            setDraftIn(dates.checkIn);
            setDraftOut(dates.checkOut);
            setDraftAdult(nextGuests.adultCount);
            setDraftChild(nextGuests.childCount);
            onStayChange?.({
                checkIn: dates.checkIn,
                checkOut: dates.checkOut,
                adultCount: nextGuests.adultCount,
                childCount: nextGuests.childCount,
            });
        },
        [onStayChange],
    );

    const stayOptionsBase = useMemo(
        () => ({
            checkIn: draftIn,
            checkOut: draftOut,
            adultCount: guests.adultCount,
            childCount: guests.childCount,
        }),
        [draftIn, draftOut, guests.adultCount, guests.childCount],
    );

    const listUrl = useMemo(
        () =>
            buildTripcomHotelSearchUrl(location, {
                ...stayOptionsBase,
                mode: 'list',
                campaign: TRIPCOM_HOTEL_TRACKING.fullScreen,
            }),
        [location, stayOptionsBase],
    );

    const closeCalendar = useCallback(() => setCalendarOpen(false), []);

    const handleCalendarPick = useCallback(
        (nextIn, nextOut) => {
            pushStayChange({
                checkIn: nextIn,
                checkOut: nextOut,
                adultCount: draftAdult,
                childCount: draftChild,
            });
            setCalendarOpen(false);
        },
        [pushStayChange, draftAdult, draftChild],
    );

    const handleGuestChange = useCallback(
        (field, value) => {
            const nextAdult = field === 'adult' ? value : draftAdult;
            const nextChild = field === 'child' ? value : draftChild;
            pushStayChange({
                checkIn: draftIn,
                checkOut: draftOut,
                adultCount: nextAdult,
                childCount: nextChild,
            });
        },
        [pushStayChange, draftIn, draftOut, draftAdult, draftChild],
    );

    useEffect(() => {
        if (!calendarOpen) return undefined;
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
    }, [calendarOpen, closeCalendar]);

    useEffect(() => {
        if (!showWidget) return undefined;
        const el = containerRef.current;
        if (!el) return undefined;

        const update = () => {
            const width = el.clientWidth || 0;
            setContainerWidth(width);
            const useTall = width > 0 && width < TALL_BANNER_MAX_CONTAINER;
            const nativeW = useTall ? TRIPCOM_HOTEL_AD.mobileWidth : TRIPCOM_HOTEL_AD.width;
            const nativeH = useTall ? TRIPCOM_HOTEL_AD.mobileHeight : TRIPCOM_HOTEL_AD.height;
            const adId = useTall
                ? TRIPCOM_HOTEL_AD.mobileAdId || TRIPCOM_HOTEL_AD.adId
                : TRIPCOM_HOTEL_AD.adId;

            let { scale, clipH } = computeKlookBannerLayout(width, 8, nativeW, nativeH);

            if (useTall) {
                const available = Math.max(0, width - 8);
                const fit = nativeW > 0 ? available / nativeW : 1;
                scale = Math.min(TALL_BANNER_MAX_SCALE, Math.max(fit, scale));
                clipH = Math.min(TALL_BANNER_MAX_CLIP_H, Math.round(nativeH * scale));
            } else {
                clipH = Math.max(clipH, MIN_WIDE_DISPLAY_HEIGHT);
            }

            setLayout({ scale, clipH, nativeW, nativeH, adId, isTall: useTall });
        };

        update();
        window.addEventListener('resize', update);
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
        if (ro) ro.observe(el);

        return () => {
            window.removeEventListener('resize', update);
            ro?.disconnect();
        };
    }, [showWidget]);

    const iframeSrc = useMemo(
        () =>
            buildTripcomHotelSearchUrl(location, {
                ...stayOptionsBase,
                mode: 'ad',
                adId: layout.adId,
                campaign: layout.isTall
                    ? TRIPCOM_HOTEL_TRACKING.emptyResultMobile
                    : campaign,
            }),
        [location, stayOptionsBase, layout.adId, layout.isTall, campaign],
    );

    const { nativeW, nativeH, scale, clipH, adId } = layout;

    return (
        <div ref={rootRef} className={className || 'w-full'}>
            <div
                className="overflow-hidden rounded-2xl border border-sky-300/40 bg-gradient-to-b from-sky-500/20 to-sky-950/40 shadow-[0_8px_28px_rgba(14,165,233,0.18)]"
                data-tripcom-hotel-searchbar="1"
            >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                    <p className="text-[11px] font-bold tracking-wide text-sky-100/90">
                        Trip.com 숙소 검색
                    </p>
                    <span className="rounded-full border border-sky-300/35 bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold text-sky-100/80">
                        제휴
                    </span>
                </div>

                <div className="space-y-2 p-3">
                    {/* 여행지 */}
                    <div className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-white/12 bg-black/45 px-3 py-2">
                        <MapPin
                            size={18}
                            className="shrink-0 text-sky-300"
                            aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold text-sky-100/55">여행지</p>
                            <p className="truncate text-sm font-bold text-white">
                                {cityName || '여행지'}
                            </p>
                            {cityNameEn && cityNameEn !== cityName ? (
                                <p className="truncate text-[11px] text-white/40">{cityNameEn}</p>
                            ) : null}
                        </div>
                    </div>

                    {/* 일정 — 클릭 시 달력 */}
                    <button
                        type="button"
                        aria-expanded={calendarOpen}
                        aria-haspopup="dialog"
                        aria-label="체크인·체크아웃 날짜 선택"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCalendarOpen((v) => !v);
                        }}
                        className={`flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                            calendarOpen
                                ? 'border-sky-300/55 bg-black/55'
                                : 'border-white/12 bg-black/45 hover:border-sky-300/40 hover:bg-black/55'
                        }`}
                    >
                        <CalendarDays
                            size={18}
                            className="shrink-0 text-sky-300"
                            aria-hidden="true"
                        />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-sky-100/55">체크인</p>
                                <p className="truncate text-sm font-bold tabular-nums text-white">
                                    {formatStayDateLabel(draftIn)}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-md bg-sky-400/20 px-2 py-1 text-xs font-bold tabular-nums text-sky-100">
                                {nights > 0 ? `${nights}박` : '·'}
                            </span>
                            <div className="min-w-0 text-right">
                                <p className="text-[10px] font-semibold text-sky-100/55">체크아웃</p>
                                <p className="truncate text-sm font-bold tabular-nums text-white">
                                    {formatStayDateLabel(draftOut)}
                                </p>
                            </div>
                        </div>
                    </button>

                    {calendarOpen ? (
                        <StayRangeCalendar
                            key={`${draftIn}|${draftOut}|open`}
                            checkIn={draftIn}
                            checkOut={draftOut}
                            todayYmd={resolvedToday}
                            onPick={handleCalendarPick}
                            onCancel={closeCalendar}
                            accent="sky"
                        />
                    ) : null}

                    {/* 인원 */}
                    <div className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-black/45 px-3 py-2">
                        <Users
                            size={18}
                            className="shrink-0 text-sky-300"
                            aria-hidden="true"
                        />
                        <p className="mr-1 shrink-0 text-[10px] font-semibold text-sky-100/55">
                            인원
                        </p>
                        <GuestStepper
                            label="성인"
                            value={guests.adultCount}
                            min={1}
                            max={8}
                            accent="sky"
                            onChange={(v) => handleGuestChange('adult', v)}
                        />
                        <GuestStepper
                            label="아동"
                            value={guests.childCount}
                            min={0}
                            max={8}
                            accent="sky"
                            onChange={(v) => handleGuestChange('child', v)}
                        />
                        <span className="ml-auto text-[10px] font-medium text-white/35">
                            객실 1
                        </span>
                    </div>

                    <a
                        href={listUrl}
                        target={linkTarget}
                        rel={linkRel}
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_18px_rgba(14,165,233,0.4)] transition-colors hover:bg-sky-400 active:scale-[0.99]"
                    >
                        <Search size={17} strokeWidth={2.5} aria-hidden="true" />
                        트립닷컴에서 검색
                    </a>
                </div>
            </div>

            <div className="mt-2">
                <button
                    type="button"
                    aria-expanded={showWidget}
                    onClick={() => setShowWidget((v) => !v)}
                    className="flex w-full items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-white/40 transition-colors hover:text-white/65"
                >
                    트립닷컴 검색 위젯으로 직접 입력
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${showWidget ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>

                {showWidget ? (
                    <div
                        ref={containerRef}
                        className="relative mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-white shadow-sm"
                        data-tripcom-hotel-banner="1"
                        data-tripcom-ad-id={adId}
                        data-tripcom-city-id={cityId || ''}
                        data-tripcom-banner-size={`${nativeW}x${nativeH}`}
                        data-tripcom-container-w={containerWidth || ''}
                    >
                        <div
                            className="flex w-full justify-center overflow-hidden"
                            style={{ height: `${clipH}px` }}
                        >
                            <div
                                style={{
                                    width: `${nativeW}px`,
                                    height: `${nativeH}px`,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                }}
                            >
                                <iframe
                                    key={`${iframeSrc}-${nativeW}x${nativeH}`}
                                    src={iframeSrc}
                                    title="Trip.com 숙소 검색 위젯"
                                    width={nativeW}
                                    height={nativeH}
                                    className="block border-0"
                                    scrolling="no"
                                    loading="lazy"
                                    {...(iframeReferrerPolicy
                                        ? { referrerPolicy: iframeReferrerPolicy }
                                        : {})}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
