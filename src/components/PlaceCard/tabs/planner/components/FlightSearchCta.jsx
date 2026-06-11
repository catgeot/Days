import React, { useMemo } from 'react';
import { ArrowRight, Plane, Search } from 'lucide-react';
import {
    TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
    getPlannerFlightArrivalIata,
} from '../../../../../utils/affiliate';
import { getFlightTripDisclaimer } from '../../../../../utils/flightBookingMatch';
import { getFlightDestinationSearchHint } from '../../../../../utils/rentalAirportMatch.js';

/**
 * 플래너 항공권 Trip.com 검색 CTA — 고대비·클릭 유도형 배너.
 * WhiteLabelWidget customTrigger 또는 단독 버튼으로 사용.
 */
const FlightSearchCta = ({ location, essentialGuide, className = '', ...buttonProps }) => {
    const arrivalIata = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );
    const departure = TRIPCOM_DEFAULT_DEPARTURE_AIRPORT || 'ICN';

    const subtitle = useMemo(() => {
        const tierDisclaimer = getFlightTripDisclaimer(location, { arrivalIata });
        if (tierDisclaimer) return tierDisclaimer;
        if (arrivalIata) {
            return 'Trip.com에서 출발·도착 공항이 자동 입력됩니다';
        }
        return getFlightDestinationSearchHint(location, { essentialGuide });
    }, [location, essentialGuide, arrivalIata]);

    return (
        <button
            type="button"
            className={`group relative mt-3 w-full overflow-hidden rounded-2xl text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${className}`.trim()}
            aria-label={
                arrivalIata
                    ? `Trip.com 항공권 검색 — ${departure}에서 ${arrivalIata}까지`
                    : 'Trip.com 항공권 실시간 검색'
            }
            {...buttonProps}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700" aria-hidden="true" />
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-cyan-300/25 blur-xl" aria-hidden="true" />
            <Plane
                className="pointer-events-none absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 rotate-12 text-white/10 sm:right-5 sm:h-16 sm:w-16"
                strokeWidth={1.25}
                aria-hidden="true"
            />

            <div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm sm:h-12 sm:w-12">
                    <Plane size={20} className="text-white sm:hidden" />
                    <Plane size={22} className="hidden text-white sm:block" />
                </div>

                <div className="min-w-0 flex-1 pr-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-white sm:text-base">항공권 실시간 검색</span>
                        {arrivalIata ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/25 sm:text-xs">
                                <span className="font-mono tracking-wide">{departure}</span>
                                <ArrowRight size={11} className="opacity-90" aria-hidden="true" />
                                <span className="font-mono tracking-wide">{arrivalIata}</span>
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-sky-50/95 sm:text-sm">{subtitle}</p>
                </div>

                <span className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-blue-700 shadow-md transition-colors group-hover:bg-sky-50 sm:inline-flex">
                    <Search size={15} aria-hidden="true" />
                    검색
                </span>
                <ArrowRight
                    size={20}
                    className="shrink-0 text-white/90 transition-transform group-hover:translate-x-0.5 sm:hidden"
                    aria-hidden="true"
                />
            </div>
        </button>
    );
};

export default FlightSearchCta;
