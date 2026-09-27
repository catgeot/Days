import React, { useEffect, useMemo } from 'react';
import { getPlannerFlightArrivalIata } from '../../../../../utils/affiliate';
import TripcomFlightNativeSearch from './TripcomFlightNativeSearch';
import { logFlightDebug } from '../../../../../shared/cloudPreview/flightDebug';

/**
 * 플래너 항공권 검색 — Trip.com partners/ad iframe 대신 네이티브 입력 폼.
 * 모바일 ad iframe은 인증 오류로 빈 박스가 된다 (`mobileIframeUsable: false`).
 */
const TripcomFlightBannerWidget = ({ location, essentialGuide, departDate, returnDate, className = 'mt-3' }) => {
    const arrivalIata = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );

    useEffect(() => {
        logFlightDebug('banner.mount', {
            slug: location?.slug,
            arrivalIata,
            mode: 'native',
        });
    }, [location?.slug, arrivalIata]);

    return (
        <div
            id="planner-flight-search"
            className={`${className} scroll-mt-24`.trim()}
            data-tripcom-arrival-iata={arrivalIata || ''}
            data-tripcom-flight-banner="native"
        >
            <div className="overflow-hidden rounded-2xl border border-sky-300/80 bg-white shadow-sm ring-1 ring-sky-900/10">
                <TripcomFlightNativeSearch
                    location={location}
                    essentialGuide={essentialGuide}
                    departDate={departDate}
                    returnDate={returnDate}
                />
            </div>
        </div>
    );
};

export default TripcomFlightBannerWidget;
