import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    applyFlightDatePick,
    buildMonthCells,
    dateRangeRole,
    formatDayLabel,
    formatMonthTitle,
    parseYmd,
    shiftMonth,
    todayYmd,
    weekdayLabels,
} from '../../../../../utils/tripcomFlightDateRange';

function dayClass(role, disabled) {
    if (disabled) return 'text-gray-300';
    if (role === 'start' || role === 'end' || role === 'both') {
        return 'bg-sky-500 font-bold text-white';
    }
    if (role === 'mid') return 'bg-sky-100 font-semibold text-sky-800';
    return 'text-gray-900 hover:bg-sky-50';
}

const TripcomFlightDateRangeCalendar = ({
    tripType,
    ddate,
    rdate,
    onChange,
    t,
    locale,
}) => {
    const isRoundTrip = tripType === 'RT';
    const [open, setOpen] = useState(false);
    const [picking, setPicking] = useState('start');
    const [view, setView] = useState(() => parseYmd(ddate) || new Date());
    const today = todayYmd();
    const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
    const cells = useMemo(() => buildMonthCells(view), [view]);

    useEffect(() => {
        if (tripType === 'RT' && ddate && !rdate) {
            setPicking('end');
            return;
        }
        setPicking('start');
    }, [tripType, ddate, rdate]);

    const summary = isRoundTrip
        ? `${formatDayLabel(ddate, locale)}${rdate ? ` – ${formatDayLabel(rdate, locale)}` : ` – ${t('place.planner.banners.tripcomFlight.nativePickReturn')}`}`
        : formatDayLabel(ddate, locale);

    const hint = !isRoundTrip
        ? t('place.planner.banners.tripcomFlight.nativePickDepart')
        : picking === 'end'
            ? t('place.planner.banners.tripcomFlight.nativePickReturn')
            : t('place.planner.banners.tripcomFlight.nativePickDepart');

    const handleDay = (ymd) => {
        const next = applyFlightDatePick({
            tripType,
            ddate,
            rdate,
            picking,
            ymd,
            today,
        });
        if (!next.changed) return;
        onChange({ ddate: next.ddate, rdate: next.rdate });
        setPicking(next.picking);
        if (next.done) setOpen(false);
    };

    return (
        <div data-tripcom-date-range="1">
            <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-gray-200/90 bg-gray-50/60 px-3 py-2.5 text-left transition-colors hover:border-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-100"
                aria-expanded={open}
                aria-label={t('place.planner.banners.tripcomFlight.nativeDateRangeOpen')}
                onClick={() => {
                    setOpen((was) => !was);
                    const nextView = parseYmd(ddate);
                    if (nextView) setView(nextView);
                }}
            >
                <Calendar size={14} className="shrink-0 text-sky-500" />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-600">
                        {t('place.planner.banners.tripcomFlight.nativeDateRange')}
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-900">{summary}</p>
                </div>
            </button>

            {open ? (
                <div className="mt-2 rounded-xl border border-sky-100 bg-white p-2.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:bg-sky-50"
                            aria-label={t('place.planner.banners.tripcomFlight.nativeCalendarPrev')}
                            onClick={() => setView((current) => shiftMonth(current, -1))}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-bold text-gray-900">{formatMonthTitle(view, locale)}</p>
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:bg-sky-50"
                            aria-label={t('place.planner.banners.tripcomFlight.nativeCalendarNext')}
                            onClick={() => setView((current) => shiftMonth(current, 1))}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <p className="mb-2 text-center text-[11px] font-semibold text-sky-600">{hint}</p>
                    <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-bold text-gray-400">
                        {weekdays.map((label, index) => (
                            <span key={`${label}-${index}`}>{label}</span>
                        ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-y-0.5">
                        {cells.map((ymd, index) => {
                            if (!ymd) {
                                return <span key={`empty-${index}`} className="h-9" />;
                            }
                            const disabled = ymd < today;
                            const role = dateRangeRole(ymd, ddate, rdate);
                            const rounded =
                                role === 'start' ? 'rounded-l-full' : role === 'end' ? 'rounded-r-full' : 'rounded-full';
                            return (
                                <button
                                    key={ymd}
                                    type="button"
                                    disabled={disabled}
                                    className={`h-9 w-full text-xs ${rounded} ${dayClass(role, disabled)}`}
                                    onClick={() => handleDay(ymd)}
                                >
                                    {Number(ymd.slice(-2))}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TripcomFlightDateRangeCalendar;
