import { useEffect, useState } from 'react';
import { TRIPCOM_FLIGHT_AD, TRIPCOM_HOTEL_AD } from '../../../../../utils/affiliate';
import { KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT } from './klookBannerLayout';

function readBannerSize(ad) {
    if (typeof window === 'undefined') {
        return { width: ad.width, height: ad.height };
    }
    const mobile = window.matchMedia(
        `(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`,
    ).matches;
    if (!mobile) {
        return { width: ad.width, height: ad.height };
    }
    return {
        width: ad.mobileWidth,
        height: ad.mobileHeight,
    };
}

/**
 * Trip.com 제휴 배너 크기 — 768px 미만 320×480, 그 외 900×200.
 * @param {typeof TRIPCOM_FLIGHT_AD | typeof TRIPCOM_HOTEL_AD} [ad]
 */
export function useTripcomBannerDimensions(ad = TRIPCOM_FLIGHT_AD) {
    const [dims, setDims] = useState(() => readBannerSize(ad));

    useEffect(() => {
        const query = `(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`;
        const mq = window.matchMedia(query);
        const sync = () => setDims(readBannerSize(ad));
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [ad]);

    return dims;
}

/** @deprecated {@link useTripcomBannerDimensions} — 항공 AD 기본 */
export function useTripcomPlannerBannerDimensions() {
    return useTripcomBannerDimensions(TRIPCOM_FLIGHT_AD);
}

export function useTripcomHotelBannerDimensions() {
    return useTripcomBannerDimensions(TRIPCOM_HOTEL_AD);
}
