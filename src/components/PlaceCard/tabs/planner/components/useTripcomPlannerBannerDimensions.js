import { useEffect, useState } from 'react';
import { TRIPCOM_FLIGHT_AD } from '../../../../../utils/affiliate';
import { KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT } from './klookBannerLayout';

function readTripcomBannerSize() {
    if (typeof window === 'undefined') {
        return { width: TRIPCOM_FLIGHT_AD.width, height: TRIPCOM_FLIGHT_AD.height };
    }
    const mobile = window.matchMedia(
        `(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`,
    ).matches;
    if (!mobile) {
        return { width: TRIPCOM_FLIGHT_AD.width, height: TRIPCOM_FLIGHT_AD.height };
    }
    return {
        width: TRIPCOM_FLIGHT_AD.mobileWidth,
        height: TRIPCOM_FLIGHT_AD.mobileHeight,
    };
}

/** 플래너 Trip.com 배너: 768px 미만 320×480, 그 외 900×200 */
export function useTripcomPlannerBannerDimensions() {
    const [dims, setDims] = useState(() => readTripcomBannerSize());

    useEffect(() => {
        const query = `(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`;
        const mq = window.matchMedia(query);
        const sync = () => setDims(readTripcomBannerSize());
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    return dims;
}
