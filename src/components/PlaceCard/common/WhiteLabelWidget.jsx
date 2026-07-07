import React, { useMemo } from 'react';
import { Search, Plane } from 'lucide-react';
import {
    buildTripcomPlannerNavigationUrl,
    getPartnerLinkTarget,
    openTripcomExternalUrl,
} from './partnerNavigation';
import { useTryOpenTripcomFlightSearch } from '../tabs/planner/TripcomFlightSearchContext';
import { TRIPCOM_DEFAULT_DEPARTURE_AIRPORT } from '../../../utils/affiliate';
import { resolveFlightDepartureIataForTrip } from '../../../pages/Home/lib/flightOriginPreference.js';

/**
 * 플래너 Trip.com 항공권 제휴 링크.
 * 모바일: 앱 내 전체 화면 모달(iframe 중앙 정렬·도착지 자동입력).
 * 데스크톱: /flights/ 직링크 + 새 탭 + Referer(gateo 복귀 링크).
 * @param {Record<string, unknown> | null | undefined} [location]
 * @param {Record<string, unknown> | null | undefined} [essentialGuide]
 * @param {string | null | undefined} [departureIata] - 시네마 Bar 등 명시 시에만 전달. 미지정(플래너)은 ICN 고정.
 * @param {'planner-flight-mobile' | 'planner-pre-travel' | 'globe-flight-cinema' | 'chat-flight' | null | undefined} [tracking]
 * @param {React.ReactElement} [customTrigger] - 커스텀 트리거 버튼
 */
const WhiteLabelWidget = ({
    location,
    essentialGuide,
    departureIata: departureOverride,
    tracking,
    customTrigger,
}) => {
    const tryOpenFlightSearch = useTryOpenTripcomFlightSearch();
    const departureIata = useMemo(() => {
        if (departureOverride) return resolveFlightDepartureIataForTrip(departureOverride);
        return TRIPCOM_DEFAULT_DEPARTURE_AIRPORT;
    }, [departureOverride]);
    const flightUrl = useMemo(
        () => buildTripcomPlannerNavigationUrl(location, { essentialGuide, departureIata, tracking }),
        [location, essentialGuide, departureIata, tracking],
    );
    const linkTarget = getPartnerLinkTarget();

    const handleOpen = () => {
        if (tryOpenFlightSearch(location, { essentialGuide, departureIata, tracking })) return;
        openTripcomExternalUrl(flightUrl, { target: linkTarget });
    };

    if (customTrigger) {
        return React.cloneElement(customTrigger, { onClick: handleOpen });
    }

    return (
        <button
            type="button"
            onClick={handleOpen}
            className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 min-h-[44px] rounded-xl text-xs font-semibold transition-colors border bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
            aria-label="Trip.com 항공권 검색"
        >
            <Plane size={14} />
            <span>Trip.com 항공권 검색</span>
            <Search size={12} className="ml-0.5 opacity-80" />
        </button>
    );
};

export default WhiteLabelWidget;
