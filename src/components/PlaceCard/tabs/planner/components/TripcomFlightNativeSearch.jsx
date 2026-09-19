import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Plane, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
    buildTripcomPlannerFlightUrl,
    getPlannerFlightArrivalIata,
} from '../../../../../utils/affiliate';
import { MOBILE_INPUT_TEXT_CLASS } from '../../../../../shared/hooks/useMobileInputViewport';
import {
    getPartnerLinkTarget,
    openTripcomExternalUrl,
} from '../../../common/partnerNavigation';
import { plannerCaption } from '../readableText';

/**
 * 모바일 플래너 Trip.com 항공권 검색 폼 — 티켓 스타일 카드.
 */
const TripcomFlightNativeSearch = ({
    location,
    essentialGuide,
    departureIata,
    tracking,
    departDate,
    returnDate,
    onAfterSearch,
}) => {
    const { t } = useTranslation();
    const [ddate, setDdate] = useState(departDate || '');
    const [rdate, setRdate] = useState(returnDate || '');
    const arrivalIata = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );
    const depart = String(departureIata || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT)
        .trim()
        .toUpperCase() || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
    const linkTarget = getPartnerLinkTarget();

    const handleSubmit = (event) => {
        event.preventDefault();
        const url = buildTripcomPlannerFlightUrl(location, {
            essentialGuide,
            mode: 'flights',
            departureIata: depart,
            tracking,
            ...(ddate ? { departDate: ddate } : {}),
            ...(rdate ? { returnDate: rdate } : {}),
        });
        openTripcomExternalUrl(url, {
            target: linkTarget,
            placeLabel: location?.name || location?.name_ko || location?.name_en,
        });
        onAfterSearch?.();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex flex-col overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-white"
            data-tripcom-native-search="1"
        >
            {/* 상단 브랜드 헤더 */}
            <div className="flex items-center justify-between border-b border-sky-100/90 bg-gradient-to-r from-sky-50 to-white px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                        <Plane size={15} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black tracking-tight text-sky-950">Trip.com</span>
                        <span className="text-xs font-semibold text-sky-800/80">항공권 검색</span>
                    </div>
                </div>
                <span className="rounded-full bg-gray-800/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t('place.planner.banners.affiliateBadge')}
                </span>
            </div>

            {/* 카드 본문 */}
            <div className="flex flex-col gap-3 p-3.5">
                {/* 비행 티켓 스타일 출·도착 표시 바 */}
                <div className="relative flex items-center justify-between rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-blue-50/40 to-sky-50/70 p-3 shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-sky-600">
                            {t('place.planner.banners.tripcomFlight.routeDepart')}
                        </span>
                        <span className="font-mono text-xl font-black tracking-tight text-gray-900">
                            {depart}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                        <div className="flex items-center gap-1 text-sky-400">
                            <span className="h-0.5 w-5 bg-sky-200" />
                            <Plane size={16} className="rotate-90 text-sky-500" />
                            <span className="h-0.5 w-5 bg-sky-200" />
                        </div>
                        <span className="mt-0.5 text-[10px] font-medium text-sky-500">왕복·직항/경유</span>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-semibold text-sky-600">
                            {t('place.planner.banners.tripcomFlight.routeArrive')}
                        </span>
                        <span className="font-mono text-xl font-black tracking-tight text-gray-900">
                            {arrivalIata || '—'}
                        </span>
                    </div>
                </div>

                {/* 날짜 선택 인풋 */}
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 rounded-xl border border-gray-200/90 bg-gray-50/60 p-2.5 transition-colors focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                            <Calendar size={12} className="text-sky-500" />
                            <span>{t('place.planner.banners.tripcomFlight.nativeDepartDate')}</span>
                        </div>
                        <input
                            type="date"
                            value={ddate}
                            onChange={(event) => setDdate(event.target.value)}
                            className={`w-full rounded-lg border-0 bg-transparent p-0 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 ${MOBILE_INPUT_TEXT_CLASS}`}
                        />
                    </label>

                    <label className="flex flex-col gap-1 rounded-xl border border-gray-200/90 bg-gray-50/60 p-2.5 transition-colors focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                            <Calendar size={12} className="text-sky-500" />
                            <span>{t('place.planner.banners.tripcomFlight.nativeReturnDate')}</span>
                        </div>
                        <input
                            type="date"
                            value={rdate}
                            onChange={(event) => setRdate(event.target.value)}
                            className={`w-full rounded-lg border-0 bg-transparent p-0 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 ${MOBILE_INPUT_TEXT_CLASS}`}
                        />
                    </label>
                </div>

                {/* 검색 제출 버튼 */}
                <button
                    type="submit"
                    className="group relative mt-0.5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-bold text-white shadow-sm transition-all duration-200 hover:from-sky-600 hover:to-blue-700 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                    <Search size={15} className="transition-transform group-hover:scale-110" />
                    <span className="text-sm tracking-wide">
                        {t('place.planner.banners.flightSearchCta.search')}
                    </span>
                    <ArrowRight size={14} className="opacity-80 transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>
        </form>
    );
};

export default TripcomFlightNativeSearch;
