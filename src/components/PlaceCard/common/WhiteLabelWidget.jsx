import React, { useMemo } from 'react';
import { Search, Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    buildTripcomPlannerNavigationUrl,
    getPartnerLinkTarget,
    getTripcomLinkRel,
    openTripcomExternalUrl,
} from './partnerNavigation';
import { useTryOpenTripcomFlightSearch } from '../tabs/planner/TripcomFlightSearchContext';
import { TRIPCOM_DEFAULT_DEPARTURE_AIRPORT } from '../../../utils/affiliate';
import { resolveFlightDepartureIataForTrip } from '../../../pages/Home/lib/flightOriginPreference.js';
import { recordTravelAgencyVisit } from '../../../utils/travelAgencyVisits.js';

function isNativeButtonTrigger(element) {
    return React.isValidElement(element) && element.type === 'button';
}

/**
 * 플래너 Trip.com 항공권 제휴 링크.
 * iframe 모달이 꺼져 있으면 `/flights/` 직링크. 네이티브 `<a>`면 브라우저가 이동하고,
 * Bar·숙소 스트립의 `<button>` 트리거만 JS 이동.
 * @param {Record<string, unknown> | null | undefined} [location]
 * @param {Record<string, unknown> | null | undefined} [essentialGuide]
 * @param {string | null | undefined} [departureIata] - 시네마 Bar 등 명시 시에만 전달. 미지정(플래너)은 ICN 고정.
 * @param {'planner-flight-mobile' | 'planner-pre-travel' | 'globe-flight-cinema' | 'chat-flight' | 'stay-modal-flight' | 'event-detail-flight' | null | undefined} [tracking]
 * @param {string | null | undefined} [departDate] - YYYY-MM-DD → Trip `ddate`
 * @param {string | null | undefined} [returnDate] - YYYY-MM-DD → Trip `rdate` + `tripType=RT`
 * @param {number | null | undefined} [adultCount]
 * @param {number | null | undefined} [childCount]
 * @param {React.ReactElement} [customTrigger] - 커스텀 트리거 버튼
 */
const WhiteLabelWidget = ({
    location,
    essentialGuide,
    departureIata: departureOverride,
    tracking,
    departDate,
    returnDate,
    adultCount,
    childCount,
    customTrigger,
}) => {
    const tryOpenFlightSearch = useTryOpenTripcomFlightSearch();
    const { t } = useTranslation();
    const departureIata = useMemo(() => {
        if (departureOverride) return resolveFlightDepartureIataForTrip(departureOverride);
        return TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
    }, [departureOverride]);
    const flightSearchOpts = useMemo(
        () => ({
            essentialGuide,
            departureIata,
            tracking,
            ...(departDate ? { departDate } : {}),
            ...(returnDate ? { returnDate } : {}),
            ...(adultCount != null ? { adultCount } : {}),
            ...(childCount != null ? { childCount } : {}),
        }),
        [essentialGuide, departureIata, tracking, departDate, returnDate, adultCount, childCount],
    );
    const flightUrl = useMemo(
        () => buildTripcomPlannerNavigationUrl(location, flightSearchOpts),
        [location, flightSearchOpts],
    );
    const linkTarget = getPartnerLinkTarget();
    const linkRel = getTripcomLinkRel(linkTarget);
    const nativeLinkProps = {
        href: flightUrl,
        target: linkTarget,
        ...(linkRel ? { rel: linkRel } : {}),
    };

    const handleOpen = (event) => {
        if (tryOpenFlightSearch(location, flightSearchOpts)) {
            event.preventDefault();
            return;
        }
        if (event.currentTarget instanceof HTMLAnchorElement && event.currentTarget.href) {
            recordTravelAgencyVisit({ href: flightUrl });
            return;
        }
        openTripcomExternalUrl(flightUrl, { target: linkTarget });
    };

    if (customTrigger) {
        if (isNativeButtonTrigger(customTrigger)) {
            return React.cloneElement(customTrigger, { onClick: handleOpen });
        }
        return React.cloneElement(customTrigger, {
            ...nativeLinkProps,
            onClick: handleOpen,
        });
    }

    return (
        <a
            {...nativeLinkProps}
            onClick={handleOpen}
            className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 min-h-[44px] rounded-xl text-xs font-semibold no-underline transition-colors border bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
            aria-label="Trip.com 항공권 검색"
        >
            <Plane size={14} />
            <span>Trip.com 항공권 검색</span>
            <span className="text-[10px] font-bold opacity-75">
                {t('place.planner.banners.affiliateBadge')}
            </span>
            <Search size={12} className="ml-0.5 opacity-80" />
        </a>
    );
};

export default WhiteLabelWidget;
