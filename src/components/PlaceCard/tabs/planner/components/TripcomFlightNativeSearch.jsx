import React, { useMemo, useState } from 'react';
import { Plane, Search } from 'lucide-react';
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
 * 모바일 partners/ad iframe은 빈 화면이라 네이티브 폼 → /flights/(noreferrer).
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
            className="flex flex-col gap-3 bg-white px-3 py-3 md:px-4"
            data-tripcom-native-search="1"
        >
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className={`${plannerCaption} text-gray-500`}>
                        {t('place.planner.banners.tripcomFlight.routeDepart')}
                    </p>
                    <p className="font-mono text-base font-bold text-gray-900">{depart}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className={`${plannerCaption} text-gray-500`}>
                        {t('place.planner.banners.tripcomFlight.routeArrive')}
                    </p>
                    <p className="font-mono text-base font-bold text-gray-900">
                        {arrivalIata || '—'}
                    </p>
                </div>
                <label className="flex flex-col gap-1">
                    <span className={`${plannerCaption} text-gray-500`}>
                        {t('place.planner.banners.tripcomFlight.nativeDepartDate')}
                    </span>
                    <input
                        type="date"
                        value={ddate}
                        onChange={(event) => setDdate(event.target.value)}
                        className={`w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-gray-900 ${MOBILE_INPUT_TEXT_CLASS}`}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className={`${plannerCaption} text-gray-500`}>
                        {t('place.planner.banners.tripcomFlight.nativeReturnDate')}
                    </span>
                    <input
                        type="date"
                        value={rdate}
                        onChange={(event) => setRdate(event.target.value)}
                        className={`w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-gray-900 ${MOBILE_INPUT_TEXT_CLASS}`}
                    />
                </label>
            </div>
            <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-sky-700 hover:bg-sky-100"
            >
                <Plane size={14} />
                {t('place.planner.banners.flightSearchCta.search')}
                <Search size={12} className="opacity-80" />
            </button>
        </form>
    );
};

export default TripcomFlightNativeSearch;
