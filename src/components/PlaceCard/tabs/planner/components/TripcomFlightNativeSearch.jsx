import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Plane, Search } from 'lucide-react';
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
import {
    getFlightOriginDisplayLabel,
    listFlightCinemaOriginPickerOptions,
} from '../../../../../pages/Home/lib/flightCinemaOriginOptions';
import { searchFlightOriginHubs } from '../../../../../pages/Home/lib/flightCinemaOriginSearch';
import { hasCompleteFlightDates } from '../../../../../utils/tripcomFlightDateRange';
import TripcomFlightDateRangeCalendar from './TripcomFlightDateRangeCalendar';

function AirportSlot({
    label,
    iata,
    locale,
    onSelect,
    excludeIata,
    placeholder,
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const displayLabel = getFlightOriginDisplayLabel(iata, locale) || iata;
    const results = useMemo(() => {
        const q = query.trim();
        const rows = q
            ? searchFlightOriginHubs(q, { limit: 8 })
            : listFlightCinemaOriginPickerOptions().slice(0, 8);
        return rows.filter((row) => row.iata !== excludeIata);
    }, [query, excludeIata]);

    return (
        <div className="relative min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-sky-600">{label}</p>
            <input
                type="text"
                inputMode="search"
                autoComplete="off"
                value={open ? query : iata ? `${iata} ${displayLabel}`.trim() : ''}
                placeholder={placeholder}
                aria-label={label}
                onFocus={() => {
                    setQuery('');
                    setOpen(true);
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onBlur={() => {
                    window.setTimeout(() => setOpen(false), 160);
                }}
                className={`mt-0.5 w-full rounded-lg border-0 bg-transparent p-0 font-mono text-lg font-black tracking-tight text-gray-900 focus:outline-none focus:ring-0 ${MOBILE_INPUT_TEXT_CLASS}`}
            />
            {open ? (
                <ul
                    className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-xl border border-sky-100 bg-white py-1 shadow-lg"
                    role="listbox"
                >
                    {results.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-400">{placeholder}</li>
                    ) : (
                        results.map((row) => (
                            <li key={row.iata}>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-sky-50"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        onSelect(row.iata);
                                        setQuery('');
                                        setOpen(false);
                                    }}
                                >
                                    <span className="font-mono text-sm font-bold text-gray-900">{row.iata}</span>
                                    <span className="truncate pl-2 text-xs text-gray-500">{row.label}</span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            ) : null}
        </div>
    );
}

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
    calendarInitialOpen = false,
    closeSlot = false,
    onAfterSearch,
}) => {
    const { t, i18n } = useTranslation();
    const defaultArrival = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );
    const [depart, setDepart] = useState(
        () => String(departureIata || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT).trim().toUpperCase()
            || TRIPCOM_DEFAULT_DEPARTURE_AIRPORT,
    );
    const [arrive, setArrive] = useState(() => defaultArrival || '');
    const [tripType, setTripType] = useState('RT');
    const [ddate, setDdate] = useState(departDate || '');
    const [rdate, setRdate] = useState(returnDate || '');
    const [calendarOpenSignal, setCalendarOpenSignal] = useState(0);
    const linkTarget = getPartnerLinkTarget();
    const isRoundTrip = tripType === 'RT';
    const datesReady = hasCompleteFlightDates({ tripType, ddate, rdate });

    useEffect(() => {
        if (defaultArrival) {
            setArrive((current) => current || defaultArrival);
        }
    }, [defaultArrival]);

    const handleSwap = () => {
        if (!arrive) return;
        setDepart(arrive);
        setArrive(depart);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!hasCompleteFlightDates({ tripType, ddate, rdate })) {
            setCalendarOpenSignal((current) => current + 1);
            return;
        }
        const outbound = ddate;
        const inbound = isRoundTrip ? rdate : '';
        const url = buildTripcomPlannerFlightUrl(location, {
            essentialGuide,
            mode: 'flights',
            departureIata: depart,
            arrivalIata: arrive || undefined,
            tracking,
            tripType,
            departDate: outbound,
            ...(isRoundTrip && inbound ? { returnDate: inbound } : {}),
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
            data-tripcom-trip-type={tripType}
            data-tripcom-schedule-complete={datesReady ? '1' : '0'}
        >
            <div className={`flex items-center justify-between border-b border-sky-100/90 bg-gradient-to-r from-sky-50 to-white px-3.5 py-2.5 ${closeSlot ? 'pr-12' : ''}`.trim()}>
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

            <div className="flex flex-col gap-3 p-3.5">
                <div
                    className="grid grid-cols-2 rounded-xl border border-sky-100 bg-sky-50/70 p-1"
                    role="tablist"
                    aria-label={t('place.planner.banners.tripcomFlight.nativeTripType')}
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={isRoundTrip}
                        className={`min-h-[40px] rounded-lg text-sm font-bold ${
                            isRoundTrip ? 'bg-white text-sky-700 shadow-sm' : 'text-sky-700/70'
                        }`}
                        onClick={() => setTripType('RT')}
                    >
                        {t('place.planner.banners.tripcomFlight.nativeRoundTrip')}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!isRoundTrip}
                        className={`min-h-[40px] rounded-lg text-sm font-bold ${
                            !isRoundTrip ? 'bg-white text-sky-700 shadow-sm' : 'text-sky-700/70'
                        }`}
                        onClick={() => setTripType('OW')}
                    >
                        {t('place.planner.banners.tripcomFlight.nativeOneWay')}
                    </button>
                </div>

                <div className="relative flex items-start justify-between gap-2 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-blue-50/40 to-sky-50/70 p-3 shadow-inner">
                    <AirportSlot
                        label={t('place.planner.banners.tripcomFlight.routeDepart')}
                        iata={depart}
                        locale={i18n.language}
                        excludeIata={arrive}
                        placeholder={t('place.planner.banners.tripcomFlight.nativeAirportSearch')}
                        onSelect={setDepart}
                    />
                    <button
                        type="button"
                        className="mt-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-sm"
                        aria-label={t('place.planner.banners.tripcomFlight.nativeSwap')}
                        onClick={handleSwap}
                    >
                        <ArrowLeftRight size={15} />
                    </button>
                    <AirportSlot
                        label={t('place.planner.banners.tripcomFlight.routeArrive')}
                        iata={arrive}
                        locale={i18n.language}
                        excludeIata={depart}
                        placeholder={t('place.planner.banners.tripcomFlight.nativeAirportSearch')}
                        onSelect={setArrive}
                    />
                </div>

                <TripcomFlightDateRangeCalendar
                    tripType={tripType}
                    ddate={ddate}
                    rdate={rdate}
                    locale={i18n.language}
                    t={t}
                    initialOpen={calendarInitialOpen}
                    openSignal={calendarOpenSignal}
                    onChange={({ ddate: nextDepart, rdate: nextReturn }) => {
                        setDdate(nextDepart);
                        setRdate(nextReturn);
                    }}
                />

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
